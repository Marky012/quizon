import { SKILL_IDS, SKILL_NAMES } from '@/content/manifest'
import { STORY_POOL_IDS, TIER_ORDER, WORLD, type TierId } from '@/content/world'
import { MAX_ATTEMPTS } from '@/constants/gameConfig'
import {
  bestScore as bestOf,
  checkNeedsAttention,
  type Attempt,
} from '@/logic/scoring'
import { useGameStore, type ActiveAttempt, type GameState, type SkillProgress, type TierState } from '@/store/gameStore'

/* ===========================================================================
   THE DEV BYPASS - a screen index and a set of state presets.

   WHY THIS EXISTS. Every screen in this app is already reachable by typing its
   URL, because Boot is the only component that redirects and it only ever runs
   on "/". So the hard part of "try every screen" was never the routing. It was
   that most screens have nothing to show until a learner has earned their way
   into the state that renders them: the bench is empty, the Reading Trail is
   locked, Results says "there is no result for that level yet", the Record is
   blank. Opening /result/medium on a fresh install shows one sentence, and that
   sentence is not the screen anyone wanted to review.

   So this file does two things. It indexes every route INCLUDING the guards and
   the bad-parameter cases, because those are deliberate copy and somebody has to
   look at them. And it offers presets that write a specific game state, so each
   screen can be seen in the state that is hardest to reach by hand.

   THE ONE RULE: presets go through useGameStore.setState, never through
   localStorage. setState updates memory AND persistence in one write, so what
   you see is what is stored, with no reload in between and no chance of the two
   disagreeing. Writing localStorage directly would leave the running app showing
   the old state until a refresh, which is exactly the kind of stale-truth bug
   this codebase keeps recording.

   AND THE OTHER RULE: nothing in src/dev is reachable in a production build. The
   route is registered behind import.meta.env.DEV in App.tsx, which Vite folds to
   a literal false, so the dynamic import below lands in dead code and is dropped.
   Verify with `npm run build` and confirm no DevIndex chunk is emitted.
   =========================================================================== */

/** A route to open, and what it is for. `note` is the QA reason to look. */
export interface DevScreen {
  path: string
  label: string
  note: string
}

export interface DevGroup {
  group: string
  screens: DevScreen[]
}

/** Every route in the app, grouped. Ids come from the content module, never
 *  typed by hand, so a renamed skill or a new tier shows up here for free. */
export const DEV_GROUPS: DevGroup[] = [
  {
    group: 'Onboarding spine',
    screens: [
      { path: '/', label: 'Boot', note: 'the only redirector. Sends you to welcome, intro or hub.' },
      { path: '/welcome', label: 'Welcome', note: 'first run. Rolls a learner code, starts the game.' },
      { path: '/intro', label: 'Intro', note: 'the pitch. Advances to the hub on tap.' },
      { path: '/hub', label: 'Hub', note: 'carousel, grass bench, settings header.' },
    ],
  },
  {
    group: 'Drill-downs off the hub',
    screens: [
      { path: '/skills', label: 'Skills', note: 'the eight modules, lesson and pup state per row.' },
      { path: '/arena', label: 'Reading Trail', note: 'three tiers, locked and unlocked, plus Continue.' },
      { path: '/record', label: 'Your Record', note: 'the report, weakest skills, print and export.' },
      { path: '/settings', label: 'Settings', note: 'sound toggle. Reached from the hub header.' },
    ],
  },
  {
    group: 'Levels',
    screens: TIER_ORDER.flatMap((id) => [
      {
        path: `/quiz/${id}`,
        label: `Quiz - ${WORLD.tiers[id].name}`,
        note: 'the live quiz. Needs this tier unlocked, or it shows its guard.',
      },
      {
        path: `/result/${id}`,
        label: `Result - ${WORLD.tiers[id].name}`,
        note: 'Needs a completed attempt, or it shows "no result for that level yet".',
      },
    ]),
  },
  {
    group: 'Skills and pre-tests',
    screens: SKILL_IDS.flatMap((id, i) => [
      {
        path: `/skill/${id}`,
        label: `Lesson - ${SKILL_NAMES[i] ?? id}`,
        note: 'the teaching screen for one skill.',
      },
      {
        path: `/pretest/${id}`,
        label: `Pre-test - ${SKILL_NAMES[i] ?? id}`,
        note: 'five items, perfection earns the pup.',
      },
    ]),
  },
  {
    group: 'Guards and edges (these are deliberate copy, review them too)',
    screens: [
      { path: '/quiz/nonsense', label: 'Quiz - bad level', note: 'must say "That level does not exist."' },
      { path: '/result/nonsense', label: 'Result - bad level', note: 'must say there is no result yet.' },
      { path: '/skill/nonsense', label: 'Lesson - bad id', note: 'must say that lesson does not exist.' },
      { path: '/pretest/nonsense', label: 'Pre-test - bad id', note: 'must say that skill does not exist.' },
      { path: '/nowhere-at-all', label: 'Not found', note: 'the catch-all. Must not blank the screen.' },
      { path: '/challenges', label: 'Legacy /challenges', note: 'redirects to /arena.' },
      { path: '/bantayan', label: 'Legacy /bantayan', note: 'redirects to /hub. Used to be the roster.' },
      { path: '/progress', label: 'Legacy /progress', note: 'redirects to /record.' },
    ],
  },
]

/** Flat list, for the count in the header. */
export const DEV_SCREEN_COUNT = DEV_GROUPS.reduce((n, g) => n + g.screens.length, 0)

/* --- Building blocks ----------------------------------------------------- */

function allSkills(pupEarned: boolean, lessonComplete: boolean): SkillProgress[] {
  return SKILL_IDS.map((id) => ({
    id,
    lessonComplete,
    pupEarned,
    pupUses: 0,
    // The pre-test demands a perfect 5/5, so "earned" and 100 are the same
    // statement. Anything less would be a state the app cannot actually reach.
    bestPreTestScore: pupEarned ? 100 : 0,
  }))
}

/** One earned pup and seven lessons still to do, for the "bench just lit up" case. */
function onePup(): SkillProgress[] {
  return allSkills(true, true).map((k, i) => (i === 0 ? k : { ...k, pupEarned: false, bestPreTestScore: 0 }))
}

function blankTier(id: TierId): TierState {
  return {
    id,
    attempts: [],
    needsAttention: false,
    attentionReason: null,
    hintUsed: false,
    hintSkillId: null,
    answeredCorrectThisAttempt: false,
    bestScore: 0,
    storyId: null,
  }
}

/**
 * Tiers from a per-tier attempt list, running the REAL unlock and attention
 * rules rather than hand-setting needsAttention.
 *
 * The point of using checkNeedsAttention here is that a preset can never invent a
 * state the game would refuse to produce. If the attention rule changes, these
 * presets follow it, and a reviewer looking at the "needs attention" screen is
 * looking at the real thing.
 */
function buildTiers(spec: Partial<Record<TierId, Attempt[]>>): Record<string, TierState> {
  return Object.fromEntries(
    TIER_ORDER.map((id) => {
      const attempts = spec[id] ?? []
      const check = checkNeedsAttention(attempts)
      return [
        id,
        {
          ...blankTier(id),
          attempts,
          needsAttention: check.needsAttention,
          attentionReason: check.reason,
          bestScore: bestOf(attempts),
        },
      ]
    }),
  )
}

function attempt(score: number, missedSkills: string[] = []): Attempt {
  return { score, date: Date.now(), missedSkills }
}

/**
 * A REAL in-progress attempt, drawn from the real bank.
 *
 * This is deliberately not a hand-written list of ids. Quiz refuses to resume an
 * attempt whose stored ids no longer resolve, so a fabricated attempt would make
 * Continue appear in the Arena and then land the reviewer on an error - the
 * bypass would be lying about the thing it exists to demonstrate. So this calls
 * the same startAttempt the screen calls, which also means the option order on
 * resume is byte-identical to a real session.
 *
 * The question bank is imported dynamically so it does not join the dev screen's
 * static graph.
 */
async function liveAttempt(tierId: TierId, index: number, correct: number): Promise<ActiveAttempt> {
  const [{ getTierPools }, { startAttempt }] = await Promise.all([
    import('@/content/questions'),
    import('@/logic/attempt'),
  ])
  // Pinned rather than random so two reviewers see the same resume screen.
  const storyId = STORY_POOL_IDS[0] ?? 'T1'
  const itemCount = WORLD.tiers[tierId].itemCount ?? 20
  const started = startAttempt({ pools: getTierPools(tierId), storyId, itemCount, history: [] })
  return {
    tierId,
    storyId,
    seed: started.seed,
    questionIds: started.questions.map((q) => q.id),
    index,
    correct,
    missedSkills: SKILL_NAMES.slice(0, 2),
    startedAt: Date.now(),
  }
}

/** Missed-skill counts, so Record and the Result review list have something in them. */
function someMisses(): Record<string, number> {
  return Object.fromEntries(SKILL_NAMES.slice(0, 4).map((name, i) => [name, 4 - i]))
}

/* --- Presets -------------------------------------------------------------- */

export interface DevPreset {
  id: string
  label: string
  note: string
  /** Land on this screen after applying, so a preset is one tap to review. */
  lands: string
  build: () => Partial<GameState> | Promise<Partial<GameState>>
}

const onboards: Partial<GameState> = {
  hasStarted: true,
  profileCreated: true,
  introCompleted: true,
}

export const DEV_PRESETS: DevPreset[] = [
  {
    id: 'fresh',
    label: 'Brand new learner',
    note: 'Nothing earned. The empty states, and the lock messages that explain them.',
    lands: '/hub',
    build: () => {
      useGameStore.getState().resetGame()
      return {}
    },
  },
  {
    id: 'intro',
    label: 'Mid onboarding',
    note: 'Started, profile done, but the intro is unfinished. Boot now lands on /intro.',
    lands: '/',
    build: () => ({ hasStarted: true, profileCreated: true, introCompleted: false }),
  },
  {
    id: 'hub-bare',
    label: 'Hub, nothing done',
    note: 'Past onboarding, no lessons. Reading Trail locked, bench empty.',
    lands: '/hub',
    build: () => ({ ...onboards, skills: allSkills(false, false), tiers: buildTiers({}) }),
  },
  {
    id: 'bench-one',
    label: 'One pup earned',
    note: 'One helper lit on the bench, seven greyed. Reading Trail still shut.',
    lands: '/hub',
    build: () => ({ ...onboards, skills: onePup(), tiers: buildTiers({}) }),
  },
  {
    id: 'trail-open',
    label: 'Reading Trail unlocked',
    note: 'All eight pups, no level passed. Easy open, Medium and Hard locked.',
    lands: '/arena',
    build: () => ({ ...onboards, skills: allSkills(true, true), tiers: buildTiers({}) }),
  },
  {
    id: 'resume',
    label: 'Quiz in progress (resume)',
    note: 'A real attempt seven items in. Tests Continue in the Arena and the resume itself.',
    lands: '/arena',
    build: async () => ({
      ...onboards,
      skills: allSkills(true, true),
      tiers: buildTiers({}),
      activeAttempts: { easy: await liveAttempt('easy', 7, 5) },
    }),
  },
  {
    id: 'easy-passed',
    label: 'Easy passed',
    note: 'A passing score and a review list. Medium unlocks, so Result offers it.',
    lands: '/result/easy',
    build: () => ({
      ...onboards,
      skills: allSkills(true, true),
      tiers: buildTiers({ easy: [attempt(80, SKILL_NAMES.slice(0, 2))] }),
      skillMissedCount: someMisses(),
      totals: { correct: 16, incorrect: 4 },
    }),
  },
  {
    id: 'under-70',
    label: 'Easy failed, attempts left',
    note: 'A low score with tries remaining. Must stay warm - no red, no "failed".',
    lands: '/result/easy',
    build: () => ({
      ...onboards,
      skills: allSkills(true, true),
      tiers: buildTiers({ easy: [attempt(45, SKILL_NAMES.slice(0, 3))] }),
      skillMissedCount: someMisses(),
      totals: { correct: 9, incorrect: 11 },
    }),
  },
  {
    id: 'attention',
    label: 'Needs attention',
    note: `All ${MAX_ATTEMPTS} attempts spent below the mark. This is the one screen that shows Teacher Reyes.`,
    lands: '/result/hard',
    build: () => ({
      ...onboards,
      skills: allSkills(true, true),
      tiers: buildTiers({
        easy: [attempt(80)],
        medium: [attempt(75)],
        hard: Array.from({ length: MAX_ATTEMPTS }, () => attempt(40, SKILL_NAMES.slice(0, 2))),
      }),
      skillMissedCount: someMisses(),
      totals: { correct: 52, incorrect: 48 },
    }),
  },
  {
    id: 'everything',
    label: 'Everything done',
    note: 'All lessons, all pups, Easy and Medium passed, a Hard attempt in progress.',
    lands: '/record',
    build: async () => ({
      ...onboards,
      skills: allSkills(true, true).map((k) => ({ ...k, pupUses: 3 })),
      tiers: buildTiers({ easy: [attempt(85)], medium: [attempt(75)] }),
      activeAttempts: { hard: await liveAttempt('hard', 3, 2) },
      skillMissedCount: someMisses(),
      totals: { correct: 74, incorrect: 26 },
    }),
  },
]

/** Apply a preset by id. Unknown ids are ignored rather than throwing. */
export async function applyDevPreset(id: string): Promise<void> {
  const preset = DEV_PRESETS.find((p) => p.id === id)
  if (!preset) return
  useGameStore.setState(await preset.build())
}