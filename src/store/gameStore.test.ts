import { describe, it, expect, beforeEach } from 'vitest'
import {
  useGameStore,
  selectHintUnlocked,
  selectHintLockReason,
  selectHintPup,
  selectHintablePups,
} from './gameStore'
import { SKILL_IDS } from '@/content/manifest'
import { buildSyncPayload } from '@/sync/payload'

/* ===========================================================================
   THE HINT UNLOCK GATE, tested at the store level.

   A hint is one life per attempt, so it has to cost the learner something.
   The gate has FOUR conditions and all four have to hold:

     1. the level exists and has an attempt left
     2. helper-ready: perfect pre-test AND one level already passed
     3. ONE question answered correctly in THIS attempt  <-- the unlock
     4. the hint has not already been spent

   Condition 3 is the anti-exploit layer. Without it a learner opens a quiz,
   spends the hint on question one, and never attempts the text at all.

   Store-level tests, not selector-only tests, because the gate is a GAME RULE.
   A disabled-looking button that still spends a hint is the exact bug this
   prevents, so the assertions go through the real actions.
   =========================================================================== */

/** Puts the store in a helper-ready state: every pre-test perfect, one tier
 *  passed. Both are required before any hint can be spent. */
function makeHelperReady() {
  const s = useGameStore.getState()
  s.resetGame()
  useGameStore.setState({
    skills: SKILL_IDS.map((id) => ({
      id,
      lessonComplete: true,
      pupEarned: true,
      pupUses: 0,
      bestPreTestScore: 5,
    })),
    tiers: {
      ...useGameStore.getState().tiers,
      easy: {
        ...useGameStore.getState().tiers.easy!,
        attempts: [{ score: 80, date: Date.now(), missedSkills: [] }],
      },
    },
  })
}

describe('hint unlock gate', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('refuses a hint when the learner has answered nothing yet', () => {
    makeHelperReady()
    expect(selectHintUnlocked(useGameStore.getState(), 'easy')).toBe(false)
    expect(useGameStore.getState().spendHint('easy', 'text-type')).toBe(false)
    expect(useGameStore.getState().tiers.easy!.hintUsed).toBe(false)
  })

  it('refuses a hint after only WRONG answers', () => {
    makeHelperReady()
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', false)
    useGameStore.getState().recordAnswer('easy', 'E002', 'Main Topic', false)
    // Deliberately no correct answer: reading is not enough, the learner has
    // to get something right to show they are engaging with the text.
    expect(selectHintUnlocked(useGameStore.getState(), 'easy')).toBe(false)
    expect(useGameStore.getState().spendHint('easy', 'text-type')).toBe(false)
  })

  it('opens the hint after ONE correct answer, not a score', () => {
    makeHelperReady()
    // One right out of one. The bar is deliberately low.
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    expect(selectHintUnlocked(useGameStore.getState(), 'easy')).toBe(true)
    expect(useGameStore.getState().spendHint('easy', 'text-type')).toBe(true)
    expect(useGameStore.getState().tiers.easy!.hintUsed).toBe(true)
  })

  it('keeps the unlock on the level the answer belongs to', () => {
    makeHelperReady()
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    // A correct answer in Easy must not open Medium's hint.
    expect(selectHintUnlocked(useGameStore.getState(), 'medium')).toBe(false)
  })

  it('is still blocked by the pre-test gate even with a correct answer', () => {
    // No perfect pre-test, so no pup, so no hint - even though the learner
    // just answered correctly.
    useGameStore.getState().resetGame()
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    expect(useGameStore.getState().tiers.easy!.answeredCorrectThisAttempt).toBe(true)
    expect(useGameStore.getState().spendHint('easy', 'text-type')).toBe(false)
  })

  it('is one life per attempt, and the second spend fails', () => {
    makeHelperReady()
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    expect(useGameStore.getState().spendHint('easy', 'text-type')).toBe(true)
    expect(useGameStore.getState().spendHint('easy', 'main-topic')).toBe(false)
  })

  it('records WHICH pup the learner chose', () => {
    makeHelperReady()
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    useGameStore.getState().spendHint('easy', 'characters')
    expect(useGameStore.getState().tiers.easy!.hintSkillId).toBe('characters')
    expect(useGameStore.getState().hintSkillId('easy')).toBe('characters')
    // The results screen needs the PUP, not just the id.
    expect(selectHintPup(useGameStore.getState(), 'easy')?.name).toBe('Coco')
  })

  it('re-locks on a fresh attempt, so a retry earns a fresh hint', () => {
    makeHelperReady()
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    useGameStore.getState().spendHint('easy', 'text-type')
    expect(selectHintUnlocked(useGameStore.getState(), 'easy')).toBe(false)

    // Finishing the tier starts a new attempt.
    useGameStore.getState().completeTier('easy', 75, 20, [])
    expect(useGameStore.getState().tiers.easy!.hintUsed).toBe(false)
    expect(useGameStore.getState().tiers.easy!.hintSkillId).toBeNull()
    expect(useGameStore.getState().tiers.easy!.answeredCorrectThisAttempt).toBe(false)
  })

  it('explains why the hint is locked instead of failing silently', () => {
    makeHelperReady()
    expect(selectHintLockReason(useGameStore.getState(), 'easy')).toMatch(/correctly/i)
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    expect(selectHintLockReason(useGameStore.getState(), 'easy')).toBeNull()
  })

  it('closes the hint once all three attempts are spent', () => {
    // makeHelperReady seeded ONE passing attempt, so two more reach the cap.
    makeHelperReady()
    useGameStore.getState().completeTier('easy', 50, 20, [])
    useGameStore.getState().completeTier('easy', 50, 20, [])
    expect(useGameStore.getState().tiers.easy!.attempts).toHaveLength(3)
    expect(selectHintUnlocked(useGameStore.getState(), 'easy')).toBe(false)
    expect(selectHintLockReason(useGameStore.getState(), 'easy')).toMatch(/three attempts/i)
  })
})

/* ===========================================================================
   THE CHOSEN HELPER MUST BE A REAL, EARNED PUP.

   The global gate only proves SOME helper is available. Before these guards a
   learner could pass any string - including a skill they never unlocked, or a
   typo - and silently burn the one hint for the attempt while the results
   screen showed no pup at all.
   =========================================================================== */

describe('choosing which pup to call', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  /** Earns only the listed skills, so "earned" is exact rather than all eight. */
  function earnOnly(...ids: string[]) {
    useGameStore.setState({
      skills: SKILL_IDS.map((id) => ({
        id,
        lessonComplete: true,
        pupEarned: ids.includes(id),
        pupUses: 0,
        bestPreTestScore: ids.includes(id) ? 5 : 2,
      })),
      tiers: {
        ...useGameStore.getState().tiers,
        easy: {
          ...useGameStore.getState().tiers.easy!,
          attempts: [{ score: 80, date: Date.now(), missedSkills: [] }],
        },
      },
    })
  }

  it('refuses a skill that does not exist, without spending the hint', () => {
    earnOnly('text-type')
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    expect(useGameStore.getState().spendHint('easy', 'not-a-real-skill')).toBe(false)
    // The important part: the hint is still available afterwards.
    expect(useGameStore.getState().tiers.easy!.hintUsed).toBe(false)
    expect(useGameStore.getState().spendHint('easy', 'text-type')).toBe(true)
  })

  it('refuses a real skill whose pup was never earned', () => {
    earnOnly('text-type')
    useGameStore.getState().recordAnswer('easy', 'E001', 'Text Type', true)
    // Waffle is a real skill, but this learner never got a 5/5 on it.
    expect(useGameStore.getState().spendHint('easy', 'wh-questions')).toBe(false)
    expect(useGameStore.getState().tiers.easy!.hintUsed).toBe(false)
    expect(selectHintPup(useGameStore.getState(), 'easy')).toBeNull()
  })

  it('offers only earned helpers to the picker, in training order', () => {
    earnOnly('characters', 'text-type')
    const names = selectHintablePups(useGameStore.getState()).map((p) => p.name)
    // SKILLS order is Text Type then Characters, not the order they were earned.
    expect(names).toEqual(['Tala', 'Coco'])
  })
})

/* ===========================================================================
   PLAYER PROFILE - the one-time identity step before the intro.

   Store-level tests because createProfile is a GAME RULE guard: it must be a
   one-way door (createProfile flips profileCreated) that never re-appears on
   a later session, and it must keep the nickname display-only.
   =========================================================================== */

describe('player profile', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('starts uncreated, so Boot sends a started learner to /profile', () => {
    useGameStore.getState().startGame()
    expect(useGameStore.getState().profileCreated).toBe(false)
    expect(useGameStore.getState().playerName).toBe('')
  })

  it('createProfile stores the gender and a trimmed nickname, once', () => {
    useGameStore.getState().createProfile('boy', '  J R   ')

    const s = useGameStore.getState()
    expect(s.playerGender).toBe('boy')
    expect(s.playerName).toBe('J R')
    expect(s.profileCreated).toBe(true)

    // A second call overwrites; nothing re-creates the gate.
    useGameStore.getState().createProfile('girl', 'Mia')
    expect(useGameStore.getState().playerGender).toBe('girl')
    expect(useGameStore.getState().playerName).toBe('Mia')
  })

  it('caps the nickname at 12 characters so the UI cannot overflow', () => {
    useGameStore.getState().createProfile('girl', 'X'.repeat(40))
    expect(useGameStore.getState().playerName.length).toBe(12)
  })

  it('resetGame clears the profile (fresh start)', () => {
    useGameStore.getState().createProfile('boy', 'Gab')
    useGameStore.getState().resetGame()
    const s = useGameStore.getState()
    expect(s.profileCreated).toBe(false)
    expect(s.playerName).toBe('')
  })

  it('never puts the nickname into the teacher report or the synced payload', () => {
    useGameStore.getState().createProfile('girl', 'Mia')
    const report = useGameStore.getState().getStudentReport()
    const payload = buildSyncPayload({
      classCode: 'QZ4821',
      learnerCode: useGameStore.getState().learnerCode,
      deviceId: 'device-1',
      skills: useGameStore.getState().skills,
      tiers: useGameStore.getState().tiers,
      totals: useGameStore.getState().totals,
      skillMissedCount: useGameStore.getState().skillMissedCount,
      history: useGameStore.getState().history,
      report,
      now: 1_700_000_000_000,
    })
    expect(JSON.stringify(report)).not.toContain('Mia')
    expect(JSON.stringify(payload)).not.toContain('Mia')
    // The payload pins the anonymous learner code, not a name.
    expect(payload.learnerCode).toBe(useGameStore.getState().learnerCode)
  })
})

describe('pup-earned celebration', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('arms the celebration once when a perfect pre-test earns a pup', () => {
    useGameStore.getState().recordPreTest('text-type', 5, 5)
    expect(useGameStore.getState().lastEarnedSkillId).toBe('text-type')
    expect(useGameStore.getState().consumePupCelebration()).toBe('text-type')
    // Consumed: nothing left to celebrate.
    expect(useGameStore.getState().consumePupCelebration()).toBeNull()
  })

  it('does not re-arm the celebration for a pup already earned', () => {
    useGameStore.getState().recordPreTest('text-type', 5, 5)
    useGameStore.getState().consumePupCelebration()
    // Retry perfection on the same skill: the pup did not change state.
    useGameStore.getState().recordPreTest('text-type', 5, 5)
    expect(useGameStore.getState().consumePupCelebration()).toBeNull()
  })

  it('does not arm the celebration for a passing-but-not-perfect check', () => {
    useGameStore.getState().recordPreTest('text-type', 4, 5)
    expect(useGameStore.getState().skillMissedCount).not.toBeUndefined()
    expect(useGameStore.getState().lastEarnedSkillId).toBeNull()
    expect(useGameStore.getState().consumePupCelebration()).toBeNull()
  })

  it('arms it for the NEXT distinct skill after the first is consumed', () => {
    useGameStore.getState().recordPreTest('text-type', 5, 5)
    useGameStore.getState().consumePupCelebration()
    useGameStore.getState().recordPreTest('wh-questions', 5, 5)
    expect(useGameStore.getState().lastEarnedSkillId).toBe('wh-questions')
    expect(useGameStore.getState().consumePupCelebration()).toBe('wh-questions')
  })
})