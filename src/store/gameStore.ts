import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ANSWER_FEEDBACK_DELAY,
  HINTS_PER_LEVEL,
  MAX_FULL_NAME,
  MAX_NICKNAME,
  PRETEST_PASSING_SCORE,
  QUESTION_HISTORY_LIMIT,
  TIER_ORDER,
  TIERS,
} from '@/constants/gameConfig'
import { SKILLS, SKILL_IDS, PUP_BY_SKILL } from '@/content/manifest'
import { STORY_POOL_IDS } from '@/content/world'
import { type TierId } from '@/content/world'
import {
  appendHistory,
  assignStory,
  type HistoryEntry,
} from '@/logic/select'
import {
  availableTiers,
  bestScore,
  buildReport,
  checkNeedsAttention,
  helperGate,
  helperGateMessage,
  isPassing,
  percentage,
  type Attempt,
  type HelperGateState,
  type StudentReport,
} from '@/logic/scoring'
import type { SyncStatus } from '@/sync/types'
import { normalizeClassCode } from '@/sync/classCode'

/* ===========================================================================
   GAME STORE
   ===========================================================================
   Thin. All rules live in @/logic/* as pure functions and are covered by
   tests. This file only holds state, persists it, and calls into that logic.

   Deliberate differences from the reference project:
   - No duplicated export. exportStudentData() below is the ONLY export
     implementation; the UI calls it. The reference had a working copy in a
     component and a dead copy in the store.
   - No dead fields. Every field below is read somewhere.
   - Every storage key is namespaced with "quizon-". The reference had four
     unprefixed keys that would collide with any other app on the origin.
   =========================================================================== */

/** Namespace for every key this app writes. Derive STORAGE_KEY from it so the
 *  two can never drift apart. */
export const PREF_PREFIX = 'quizon-'
export const STORAGE_KEY = `${PREF_PREFIX}game-storage`

/** Which player avatar set the pupil chose for themselves before the game. A
 *  blunt two-way split, because that is what the player-character picker shows
 *  today; if the app ever needs more, this is the one type to widen. */
export type PlayerGender = 'boy' | 'girl'

export interface SkillProgress {
  id: string
  lessonComplete: boolean
  pupEarned: boolean
  pupUses: number
  bestPreTestScore: number
}

export interface TierState {
  id: TierId
  attempts: Attempt[]
  needsAttention: boolean
  attentionReason: string | null
  hintUsed: boolean
  /**
   * Which skill's hint was spent, so the results screen can show the pup the
   * learner chose. Null until a hint is used.
   */
  hintSkillId: string | null
  /**
   * THE HINT UNLOCK GATE (locked 2026-10-03).
   *
   * A hint is one life per attempt, so it has to cost something. Before this
   * existed, a learner could open a quiz, spend the hint on question 1, and
   * never attempt the text at all.
   *
   * Now a hint only becomes spendable once the learner has answered at least
   * ONE question CORRECTLY in this attempt. Read one question, get it right,
   * THEN the pup will help. It is an anti-exploit layer, not a punishment: the
   * bar is one correct answer, not a score, so a struggling learner can still
   * reach it.
   *
   * Reset alongside hintUsed on every fresh attempt.
   */
  answeredCorrectThisAttempt: boolean
  /** Best score across attempts, cached for the level-select badge. */
  bestScore: number
  /**
   * THE STORY THIS LEARNER IS SITTING IN THIS LEVEL. Assigned once, on first
   * entry, and never re-rolled. All 20 items come from this one text, so a
   * retry has to re-sit the same story or the stored best score would be
   * comparing two different texts.
   */
  storyId: string | null
}

function freshSkills(): SkillProgress[] {
  return SKILL_IDS.map((id) => ({
    id,
    lessonComplete: false,
    pupEarned: false,
    pupUses: 0,
    bestPreTestScore: 0,
  }))
}

function freshTiers(): Record<string, TierState> {
  return Object.fromEntries(
    TIER_ORDER.map((id) => [
      id,
      {
        id,
        attempts: [],
        needsAttention: false,
        attentionReason: null,
        hintUsed: false,
        hintSkillId: null,
        answeredCorrectThisAttempt: false,
        bestScore: 0,
        storyId: null,
      },
    ]),
  )
}

function randomLearnerCode(): string {
  // Anonymous codes, no real names. RA 10173 posture.
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const pick = () => letters[Math.floor(Math.random() * letters.length)]
  return `${pick()}${pick()}${pick()}-${String(Math.floor(Math.random() * 90) + 10)}`
}

/**
 * AN ATTEMPT IN PROGRESS, persisted so a stray tap cannot destroy it.
 *
 * Before this existed, an attempt lived entirely in Quiz's component state. A
 * learner who answered fifteen questions and then tapped the browser's back
 * button - or whose phone locked, or who closed the tab to take a call - came
 * back to an empty Arena and had to start from question one. For a Grade 5
 * learner doing a 20-question reading assessment, that is not a papercut. It is
 * the whole session gone, with no warning and no way to get it back.
 *
 * WHAT IS STORED, AND WHY EXACTLY THIS.
 *
 *   seed        The single integer that makes the draw reproducible. Rebuilding
 *               the quiz from it plus the history yields the same 20 items in
 *               the same order, with the same options in the same order. See
 *               @/lib/random.
 *   questionIds The exact 20 items, stored explicitly rather than re-derived.
 *               Re-deriving would make resume depend on the question bank never
 *               changing: edit one prompt and a returning learner would get a
 *               different attempt than the one they left. Storing the ids makes
 *               resume immune to content edits, and lets a retired question be
 *               reported instead of silently swapped.
 *   index       How many are done. This is the only thing resume needs to
 *               restore the learner's place.
 *   correct     Running score, so the progress bar is right immediately rather
 *               than only after the next answer.
 *   missedSkills  Skill names, in order, so the results screen can show what to
 *               practise without re-deriving it from the answered items.
 *
 * KEYED BY TIER, not a single slot. A learner can genuinely have Easy done up
 * to question 12 and Medium started; a single global slot would silently
 * discard one of them.
 */
export interface ActiveAttempt {
  tierId: TierId
  storyId: string
  seed: number
  questionIds: string[]
  /** 0-based index of the item now being answered. */
  index: number
  correct: number
  missedSkills: string[]
  startedAt: number
}

export interface GameState {
  learnerCode: string
  avatarId: string
  hasStarted: boolean

  /** The pupil's own player character. Set once on the Profile screen before
   *  the intro; not the helper pup they pick on Welcome. */
  playerGender: PlayerGender

  /**
   * THE OFFICIAL NAME, and the only name that ever leaves the device.
   *
   * This is the name on the attendance sheet: the one the teacher reads off
   * the dashboard and matches to a face in the classroom. It was added on
   * 2026-10-22, and adding it deliberately REVERSES half of the privacy
   * posture this app used to hold - the old rule was that no name ever
   * travels and the anonymous learner code was the only identifier. That
   * rule is still true of the NICKNAME below, and it is still true of
   * everything else in the record.
   *
   * So there are now two names, and they do different jobs:
   *
   *   playerFullName   the official record. Goes to the teacher dashboard.
   *   playerNickname   the in-game alias. Never leaves the device.
   */
  playerFullName: string

  /**
   * THE IN-GAME ALIAS. What the app calls the learner in the game.
   *
   * It is display-only and it never travels: the sync payload is built
   * without it, and a test asserts it is absent from the document that goes
   * to the server. A nickname is chosen by a child, is often a joke, and is
   * not a legal name - so it has no business on an official record.
   */
  playerNickname: string

  profileCreated: boolean
  introCompleted: boolean

  skills: SkillProgress[]
  tiers: Record<string, TierState>

  /** Keyed by TierId. See ActiveAttempt. */
  activeAttempts: Record<string, ActiveAttempt>

  totals: { correct: number; incorrect: number }
  /** Keyed by SKILL NAME, because that is what a question's skillTested holds. */
  skillMissedCount: Record<string, number>
  history: HistoryEntry[]

  /** The skill whose pup was earned on the last PERFECT pre-test, so the Hub
   *  can celebrate on arrival. TRANSIENT on purpose: it is never persisted,
   *  and the Hub clears it the moment it has been seen - a reload should not
   *  re-fire confetti for an old win. */
  lastEarnedSkillId: string | null

  soundEnabled: boolean
  hapticsEnabled: boolean
  debugMode: boolean

  /* ---------------------------------------------------------------------
     THE CLASS LINK.

     The teacher creates a class in the dashboard and gets a short code.
     A learner types that code once, offline if necessary, and from then on
     the device sends its progress to that class whenever it can reach the
     network. The code is a DEVICE property, not a learner property: it stays
     when the game is reset, because handing the device to the next pupil in
     the same class must not mean re-typing it.
     --------------------------------------------------------------------- */
  classCode: string | null
  /** When this device last sent its record successfully. */
  lastSyncedAt: number | null
  /**
   * The live sync state. NOT persisted: it describes this moment, and a
   * stale "synced" from last week would be a lie the moment the app opens.
   */
  syncStatus: SyncStatus
  /** A short, grown-up-readable reason the last attempt failed. */
  syncError: string | null
}

export interface GameActions {
  setLearnerCode: (code: string) => void
  rollLearnerCode: () => void
  setAvatar: (id: string) => void
  startGame: () => void
  /** Saves the player character, the official name and the in-game alias
   *  chosen on the Profile screen.
   *
   *  THE TWO NAMES DO DIFFERENT JOBS, and the difference is the point:
   *
   *    fullName   the official record. This is the one that reaches the
   *               teacher dashboard, because a teacher has to be able to say
   *               "Maria Santos Reyes sat on the Maunahan" without guessing.
   *    nickname   the in-game alias. It never leaves the device. It is what
   *               the app calls the learner while they play.
   *
   *  Before 2026-10-22 the store held ONE name and refused to export it, so
   *  the teacher saw only the anonymous learner code. The nickname half of
   *  that rule is unchanged; the full name is the deliberate exception. */
  createProfile: (gender: PlayerGender, fullName: string, nickname: string) => void
  completeIntro: () => void

  completeLesson: (skillId: string) => void
  recordPreTest: (skillId: string, correct: number, total: number) => boolean
  recordPupUse: (skillId: string) => void
  /** Reads and clears the freshly-earned skill's id, once, for the Hub's
   *  confetti. Returns null when there is nothing to celebrate. */
  consumePupCelebration: () => string | null

  /**
   * tierId is REQUIRED, not inferred. The hint unlock is per level, so the
   * store has to know which level this answer belongs to. Guessing by
   * "whichever tier is mid-attempt" would set the flag on the wrong level the
   * moment a learner has two levels in progress.
   */
  recordAnswer: (
    tierId: TierId,
    questionId: string,
    skillTested: string,
    correct: boolean,
  ) => void
  completeTier: (tierId: TierId, correct: number, total: number, missedSkills: string[]) => number
  /**
   * Spends the ONE hint for this attempt, and the learner PICKS which pup's
   * hint they get. Spending skillId is a real decision: one hint, eight
   * possible helpers, so the learner has to work out which skill they are
   * actually stuck on.
   */
  spendHint: (tierId: TierId, skillId: string) => boolean
  /** Which pup's hint was spent this attempt, so the UI can show that pup. */
  hintSkillId: (tierId: TierId) => string | null
  /** Assigns this learner's one story for this level, once, then keeps it. */
  ensureStory: (tierId: TierId) => string

  /**
   * Records a fresh attempt and makes it resumable. Called once, by Quiz, on a
   * cold start only. Returns the attempt so the caller has the seed it used.
   *
   * Deliberately does NOT overwrite an existing attempt for the same tier: that
   * is what makes "continue" and "start over" different decisions, and Quiz
   * must resolve them before calling this.
   */
  beginAttempt: (tierId: TierId, storyId: string, seed: number, questionIds: string[]) => void
  /**
   * Records one answer AND advances, in a single set.
   *
   * Combined on purpose. Split into "record" and "advance", a learner who
   * closed the app between the two writes would resume one question behind what
   * they actually answered - and since the index drives which item is shown,
   * they would be asked a question they had already answered. One atomic write
   * means the persisted index is never ahead of or behind the persisted score.
   */
  submitAttemptAnswer: (tierId: TierId, correct: boolean, skillTested: string) => void
  /** Drops the attempt for a tier. Called on completion and on start-over. */
  clearAttempt: (tierId: TierId) => void

  toggleSound: () => void
  toggleHaptics: () => void
  toggleDebug: () => void
  resetGame: () => void

  getStudentReport: () => StudentReport

  /**
   * Joins a class, or leaves it with null.
   *
   * The code is upper-cased and trimmed because it is read off a teacher's
   * whiteboard and typed by a child on a phone keyboard, in either case.
   */
  setClassCode: (code: string | null) => void
  /** Called by the sync manager, never by a screen. */
  setSyncStatus: (status: SyncStatus, error?: string | null) => void
  /** Called by the sync manager the moment the server accepts the record. */
  markSynced: (at: number) => void
}

const initial: GameState = {
  learnerCode: randomLearnerCode(),
  avatarId: SKILLS[0]!.pup.id,
  hasStarted: false,
  playerGender: 'girl',
  playerFullName: '',
  playerNickname: '',
  profileCreated: false,
  introCompleted: false,
  skills: freshSkills(),
  tiers: freshTiers(),
  activeAttempts: {},
  totals: { correct: 0, incorrect: 0 },
  skillMissedCount: {},
  history: [],
  lastEarnedSkillId: null,
  soundEnabled: true,
  hapticsEnabled: true,
  debugMode: false,
  classCode: null,
  lastSyncedAt: null,
  syncStatus: 'idle',
  syncError: null,
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initial,

      setLearnerCode: (code) => set({ learnerCode: code.trim().toUpperCase().slice(0, 12) }),
      rollLearnerCode: () => set({ learnerCode: randomLearnerCode() }),
      setAvatar: (id) => set({ avatarId: id }),
      startGame: () => set({ hasStarted: true }),
      createProfile: (gender, fullName, nickname) =>
        set({
          playerGender: gender,
          playerFullName: fullName.trim().replace(/\s+/g, ' ').slice(0, MAX_FULL_NAME),
          playerNickname: nickname.trim().replace(/\s+/g, ' ').slice(0, MAX_NICKNAME),
          profileCreated: true,
        }),
      completeIntro: () => set({ introCompleted: true }),

      completeLesson: (skillId) =>
        set((s) => ({
          skills: s.skills.map((k) => (k.id === skillId ? { ...k, lessonComplete: true } : k)),
        })),

      /**
       * A PERFECT pre-test earns the pup. Retries are free and unlimited, so
       * perfection stays fair for a Grade 5 learner. Returns true if a pup
       * was newly earned, so the UI can celebrate.
       */
      recordPreTest: (skillId, correct, total) => {
        const pct = percentage(correct, total)
        let earned = false
        set((s) => ({
          skills: s.skills.map((k) => {
            if (k.id !== skillId) return k
            const isPerfect = correct >= PRETEST_PASSING_SCORE
            const newly = isPerfect && !k.pupEarned
            if (newly) earned = true
            return {
              ...k,
              bestPreTestScore: Math.max(k.bestPreTestScore, pct),
              pupEarned: k.pupEarned || isPerfect,
            }
          }),
          // The Hub celebrates a newly-earned pup on its next visit. Only a
          // freshly-earned one: retries that earn nothing must not re-fire it.
          lastEarnedSkillId: earned ? skillId : s.lastEarnedSkillId,
          totals: {
            correct: s.totals.correct + correct,
            incorrect: s.totals.incorrect + (total - correct),
          },
        }))
        return earned
      },

      consumePupCelebration: () => {
        const id = get().lastEarnedSkillId
        if (id) set({ lastEarnedSkillId: null })
        return id
      },

      recordPupUse: (skillId) =>
        set((s) => ({
          skills: s.skills.map((k) => (k.id === skillId ? { ...k, pupUses: k.pupUses + 1 } : k)),
        })),

      recordAnswer: (tierId, questionId, skillTested, correct) =>
        set((s) => {
          const cur = s.tiers[tierId]
          return {
            totals: {
              correct: s.totals.correct + (correct ? 1 : 0),
              incorrect: s.totals.incorrect + (correct ? 0 : 1),
            },
            // THE UNLOCK. One correct answer in THIS level opens this level's
            // hint. Guarded so a repeat correct answer stays a cheap no-op.
            ...(correct && cur && !cur.answeredCorrectThisAttempt
              ? {
                  tiers: {
                    ...s.tiers,
                    [tierId]: { ...cur, answeredCorrectThisAttempt: true },
                  },
                }
              : {}),
            skillMissedCount: correct
              ? s.skillMissedCount
              : {
                  ...s.skillMissedCount,
                  [skillTested]: (s.skillMissedCount[skillTested] ?? 0) + 1,
                },
            history: appendHistory(
              s.history,
              { questionId, correct, timestamp: Date.now() },
              QUESTION_HISTORY_LIMIT,
            ),
          }
        }),

      completeTier: (tierId, correct, total, missedSkills) => {
        const pct = percentage(correct, total)
        set((s) => {
          const cur = s.tiers[tierId]!
          const attempts: Attempt[] = [
            ...cur.attempts,
            { score: pct, date: Date.now(), missedSkills },
          ]
          const check = checkNeedsAttention(attempts)
          // The attempt is finished, so there is nothing left to resume.
          // Dropping it here rather than in the Quiz screen means the cleanup
          // cannot be skipped by a navigation that unmounts first.
          const nextAttempts = { ...s.activeAttempts }
          delete nextAttempts[tierId]
          return {
            activeAttempts: nextAttempts,
            tiers: {
              ...s.tiers,
              [tierId]: {
                ...cur,
                attempts,
                needsAttention: check.needsAttention,
                attentionReason: check.reason,
                bestScore: bestScore(attempts),
                // A fresh attempt deserves a fresh hint, and the unlock gate
                // goes back to locked. One correct answer re-opens it.
                hintUsed: false,
                hintSkillId: null,
                answeredCorrectThisAttempt: false,
              },
            },
          }
        })
        return pct
      },

      /**
       * Assigns and RETURNS this learner's story for a level. Idempotent: the
       * first call picks from the pool and stores it; every later call returns
       * the same story, so a retry re-sits the same text.
       */
      ensureStory: (tierId) => {
        const cur = get().tiers[tierId]
        if (cur?.storyId) return cur.storyId
        const storyId = assignStory(STORY_POOL_IDS)
        set((s) => ({
          tiers: {
            ...s.tiers,
            [tierId]: { ...s.tiers[tierId]!, storyId },
          },
        }))
        return storyId
      },

      /**
       * Starts a resumable attempt. The seed and the exact ids are both stored;
       * see the ActiveAttempt note for why the ids are stored rather than
       * re-derived from the seed.
       *
       * Refuses to clobber an attempt already in flight. Starting over is a
       * deliberate learner action and goes through clearAttempt first, so an
       * accidental double-call cannot silently discard answered questions.
       */
      beginAttempt: (tierId, storyId, seed, questionIds) => {
        if (get().activeAttempts[tierId]) return
        set((s) => ({
          activeAttempts: {
            ...s.activeAttempts,
            [tierId]: {
              tierId,
              storyId,
              seed,
              questionIds,
              index: 0,
              correct: 0,
              missedSkills: [],
              startedAt: Date.now(),
            },
          },
        }))
      },

      /**
       * One answer, one atomic write. Records the result, then advances.
       *
       * Capped at questionIds.length so a stray extra call cannot push the index
       * past the end of the attempt; that would make the Quiz screen render
       * undefined and, worse, persist it.
       */
      submitAttemptAnswer: (tierId, correct, skillTested) => {
        set((s) => {
          const cur = s.activeAttempts[tierId]
          if (!cur) return s
          const nextIndex = Math.min(cur.index + 1, cur.questionIds.length)
          return {
            activeAttempts: {
              ...s.activeAttempts,
              [tierId]: {
                ...cur,
                index: nextIndex,
                correct: cur.correct + (correct ? 1 : 0),
                missedSkills: correct ? cur.missedSkills : [...cur.missedSkills, skillTested],
              },
            },
          }
        })
      },

      clearAttempt: (tierId) =>
        set((s) => {
          if (!s.activeAttempts[tierId]) return s
          const next = { ...s.activeAttempts }
          delete next[tierId]
          return { activeAttempts: next }
        }),

      /**
       * Returns false and changes nothing unless ALL FOUR gates pass:
       *   1. the level exists and still has an attempt left
       *   2. the helper gate is ready: perfect pre-test AND one level passed
       *   3. ONE question answered correctly in this attempt  (the unlock)
       *   4. the hint has not already been spent this attempt
       *
       * Checked in the store as well as the UI, because a hint is a game rule
       * and not a button state. The UI reflects this; it does not enforce it.
       *
* skillId is the pup the LEARNER CHOSE. One hint, eight helpers, so
        * picking the right one is part of the work. It is recorded so the
        * results screen can show which pup helped.
        *
        * Returns false without spending anything when the tier is locked, the
        * gate is not ready, nothing has been answered correctly yet, or the
        * requested skillId is not a real skill whose pup the learner has
        * actually earned. An unknown or unearned id must NOT burn the one hint
        * for the attempt.
        */
      spendHint: (tierId, skillId) => {
        const s = get()
        const cur = s.tiers[tierId]
        if (!cur || cur.hintUsed || cur.attempts.length >= 3) return false
        if (helperGateFor(s) !== 'ready') return false
        if (!cur.answeredCorrectThisAttempt) return false
        // The chosen helper must be a real skill, and its own pup must have
        // been earned. The global gate only proves SOME helper is available;
        // without this check a learner could call a pup they never unlocked.
        if (!SKILL_IDS.includes(skillId)) return false
        if (!s.skills.some((k) => k.id === skillId && k.pupEarned)) return false
        set((state) => ({
          tiers: {
            ...state.tiers,
            [tierId]: {
              ...state.tiers[tierId]!,
              hintUsed: true,
              hintSkillId: skillId,
            },
          },
        }))
        return true
      },

      hintSkillId: (tierId) => get().tiers[tierId]?.hintSkillId ?? null,

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      toggleDebug: () => set((s) => ({ debugMode: !s.debugMode })),

      /**
       * A fresh learner on this device.
       *
       * The CLASS LINK SURVIVES. The class code belongs to the device, not
       * to the learner: a teacher hands the same tablet to the next pupil
       * in the same class, and making that child re-type a code off a
       * whiteboard is busywork the teacher did not ask for. The learner code
       * IS regenerated, so the new learner is a new row on the dashboard.
       *
       * The last-synced time does NOT survive, because it belongs to the
       * learner who has just been cleared off the device. Carrying it over
       * would tell the next child that their teacher already has their
       * work, which is not true.
       */
      resetGame: () =>
        set({
          ...initial,
          learnerCode: randomLearnerCode(),
          skills: freshSkills(),
          tiers: freshTiers(),
          activeAttempts: {},
          totals: { correct: 0, incorrect: 0 },
          skillMissedCount: {},
          history: [],
          lastEarnedSkillId: null,
          classCode: get().classCode,
          lastSyncedAt: null,
        }),

      getStudentReport: () => {
        const s = get()
        return buildReport({
          learnerCode: s.learnerCode,
          skills: s.skills.map((k) => ({
            id: k.id,
            completed: k.lessonComplete,
            pupEarned: k.pupEarned,
          })),
          tiers: s.tiers,
          skillMissedCount: s.skillMissedCount,
          totals: s.totals,
          now: Date.now(),
        })
      },

      /**
       * Joins or leaves a class.
       *
       * Leaving clears the link but NOT the last-synced time: the record
       * that already reached the teacher stays on the teacher's dashboard,
       * and the device remembers that it was last in touch with that class.
       */
      setClassCode: (code) => {
        const clean = code === null ? null : normalizeClassCode(code)
        set({ classCode: clean && clean.length > 0 ? clean : null, syncError: null })
      },

      setSyncStatus: (status, error) => set({ syncStatus: status, syncError: error ?? null }),

      /**
       * The server has the record.
       *
       * The timestamp goes in with the status on purpose. "Synced" without a
       * time is a claim the learner cannot check, and this is the only
       * evidence they get that their work arrived, so the two are written
       * together or not at all.
       */
      markSynced: (at) => set({ syncStatus: 'synced', syncError: null, lastSyncedAt: at }),
    }),
    {
      name: STORAGE_KEY,
      /* Version 2, 2026-10-22: the one name became two, and the old one was
         renamed so that nobody could ship the wrong one to the server by
         accident. `playerName` was the nickname and is now `playerNickname`;
         `playerFullName` is new and did not exist before. */
      version: 2,
      migrate: (persisted) => {
        const old = persisted as Partial<GameState> & { playerName?: string }
        const { playerName, ...rest } = old
        /* The cast is honest rather than lazy: a migration reads a PARTIAL
           state - whatever the previous version happened to have written -
           and produces a full one. TypeScript cannot know that the spread
           plus the three fields below covers every persisted key. */
        return {
          ...rest,
          playerNickname: rest.playerNickname ?? playerName ?? '',
          playerFullName: rest.playerFullName ?? '',
          /* AN INSTALL FROM BEFORE THE FULL NAME EXISTED has a profile but no
             official name, and the teacher dashboard now needs one. Those
             devices are sent back through the Profile screen to supply it -
             Boot's routing sends a learner with no profile to /profile, so
             setting this false is the whole migration. */
          profileCreated: Boolean(rest.profileCreated && rest.playerFullName),
        } as GameState
      },
      partialize: (s) => ({
        learnerCode: s.learnerCode,
        avatarId: s.avatarId,
        hasStarted: s.hasStarted,
        playerGender: s.playerGender,
        playerFullName: s.playerFullName,
        playerNickname: s.playerNickname,
        profileCreated: s.profileCreated,
        introCompleted: s.introCompleted,
        skills: s.skills,
        tiers: s.tiers,
        activeAttempts: s.activeAttempts,
        totals: s.totals,
        skillMissedCount: s.skillMissedCount,
        history: s.history,
        soundEnabled: s.soundEnabled,
        hapticsEnabled: s.hapticsEnabled,
        // The class link and the last successful sync survive a restart, so
        // the device does not have to be told its class again every morning.
        classCode: s.classCode,
        lastSyncedAt: s.lastSyncedAt,
      }),
    },
  ),
)

/* --- Derived selectors. Components read these, never recompute. --------- */

export const selectPupsEarned = (s: GameState): number =>
  s.skills.filter((k) => k.pupEarned).length

export const selectTiersPassed = (s: GameState): Set<TierId> => {
  const out = new Set<TierId>()
  for (const id of TIER_ORDER) {
    if (bestScore(s.tiers[id]?.attempts ?? []) >= 70) out.add(id)
  }
  return out
}

export const selectAvailableTiers = (s: GameState): Set<TierId> =>
  availableTiers({ pupsEarned: selectPupsEarned(s), tiersPassed: selectTiersPassed(s) })

/* --- Helper gate ---------------------------------------------------------
   Pre-test 5/5 EARNS a pup; passing a level CONFIRMS the helper. Both are
   required before a hint can be spent. Defined as a function declaration so
   the store actions above can call it before this point in the module. */

export function helperGateFor(s: GameState): HelperGateState {
  return helperGate({
    pupsEarned: selectPupsEarned(s),
    tiersPassed: selectTiersPassed(s),
  })
}

export const selectHelperGate = (s: GameState): HelperGateState => helperGateFor(s)

export const selectHelperReady = (s: GameState): boolean => helperGateFor(s) === 'ready'

/**
 * Whether the ONE hint for this attempt can be spent right now. This is the
 * UI's single source of truth for the hint button.
 *
 * Distinct from selectHelperReady on purpose: a learner can be helper-ready
 * and still be unable to spend, because they have not answered anything
 * correctly yet. Conflating the two produced a button that looked available
 * and silently did nothing.
 */
export function selectHintUnlocked(s: GameState, tierId: TierId): boolean {
  const cur = s.tiers[tierId]
  if (!cur || cur.hintUsed || cur.attempts.length >= 3) return false
  return helperGateFor(s) === 'ready' && cur.answeredCorrectThisAttempt
}

/** Why the hint button is disabled, or null when it is available. */
export function selectHintLockReason(s: GameState, tierId: TierId): string | null {
  const cur = s.tiers[tierId]
  if (!cur) return 'This level is not available yet.'
  if (cur.attempts.length >= 3) return 'You have used all three attempts for this level.'
  if (helperGateFor(s) !== 'ready') return helperGateMessage(helperGateFor(s))
  if (cur.hintUsed) return 'You already used your hint for this attempt.'
  if (!cur.answeredCorrectThisAttempt) {
    return 'Answer one question correctly and your pup helper will be ready.'
  }
  return null
}

/** The pup whose hint was spent this attempt, for the results screen. */
export const selectHintPup = (s: GameState, tierId: TierId) => {
  const id = s.tiers[tierId]?.hintSkillId
  return id ? PUP_BY_SKILL[id] ?? null : null
}

/**
 * The learners' EARNED helpers, in training order. This is exactly the set the
 * hint picker should show: one hint, and the learner chooses which helper to
 * call. Unearned pups are deliberately absent rather than shown locked,
 * because a hint is a reward for having earned that specific pup.
 *
 * Empty means the picker should not open at all - use selectHintLockReason for
 * the reason.
 */
export function selectHintablePups(s: GameState) {
  return SKILLS.filter((skill) => s.skills.some((k) => k.id === skill.id && k.pupEarned)).map(
    (skill) => skill.pup,
  )
}

export const selectAllPupsEarned = (s: GameState): boolean =>
  selectPupsEarned(s) === TIERS[0]!.requiresPups

/* --- In-progress attempts ------------------------------------------------- */

/** The resumable attempt for one tier, or null if there is none. */
export const selectActiveAttempt = (s: GameState, tierId: TierId): ActiveAttempt | null =>
  s.activeAttempts[tierId] ?? null

/**
 * The single most-finished attempt across all tiers, for the Arena's Continue
 * button.
 *
 * "Most finished" rather than "most recent": if a learner has two levels open,
 * the one they are further through in is the one they are more likely to want
 * to finish, and the one that would be most expensive to lose. startedAt is the
 * tie-break so the choice is stable when progress is equal.
 *
 * Null when nothing is in progress, which is what hides the button entirely.
 */
export function selectContinueAttempt(s: GameState): ActiveAttempt | null {
  const all = Object.values(s.activeAttempts).filter((a) => a.index < a.questionIds.length)
  if (all.length === 0) return null
  return all.reduce((best, a) => {
    if (a.index !== best.index) return a.index > best.index ? a : best
    return a.startedAt > best.startedAt ? a : best
  })
}

/**
 * True when an attempt is saved but has no attempts left to spend - the learner
 * used all three tries and then closed the app mid-quiz.
 *
 * The Arena has to notice this. A Continue button that resumes a fourth attempt
 * the rules forbid is worse than no button: the learner would answer all twenty
 * questions and then be told the result does not count.
 */
export function selectStalledAttempt(s: GameState): ActiveAttempt | null {
  const a = selectContinueAttempt(s)
  if (!a) return null
  return (s.tiers[a.tierId]?.attempts.length ?? 0) >= 3 ? a : null
}

export { ANSWER_FEEDBACK_DELAY, HINTS_PER_LEVEL, isPassing }
