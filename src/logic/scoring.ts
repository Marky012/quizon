import { PASSING_SCORE, MAX_ATTEMPTS, TIER_ORDER, TIERS, type TierRule } from '@/constants/gameConfig'
import { SKILLS } from '@/content/manifest'
import type { TierId } from '@/content/world'

/* ===========================================================================
   PURE SCORING, UNLOCK, AND REPORTING LOGIC
   ===========================================================================
   Extracted from the store on purpose. The reference buried all of this
   inside a 527-line Zustand store and had no tests; the consequence was that
   the rules nobody could verify by reading. Everything here is pure and
   independently testable.
   =========================================================================== */

export function percentage(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

export function isPassing(pct: number): boolean {
  return pct >= PASSING_SCORE
}

export interface Attempt {
  score: number
  date: number
  missedSkills: string[]
}

export function averageScore(attempts: readonly Attempt[]): number {
  if (attempts.length === 0) return 0
  const sum = attempts.reduce((s, a) => s + a.score, 0)
  return Math.round(sum / attempts.length)
}

export function bestScore(attempts: readonly Attempt[]): number {
  return attempts.reduce((best, a) => Math.max(best, a.score), 0)
}

export function isTierPassed(attempts: readonly Attempt[]): boolean {
  if (attempts.length === 0) return false
  return bestScore(attempts) >= PASSING_SCORE
}

export function attemptsLeft(attempts: readonly Attempt[]): number {
  return Math.max(0, MAX_ATTEMPTS - attempts.length)
}

/* --- The helper gate ------------------------------------------------------ */

/**
 * A HELPER (one of the eight Woof pups) becomes usable in two steps, both
 * confirmed by the user on 2026-10-01:
 *
 *   1. EARNED   - a perfect 5/5 on that skill's pre-test. This is the reward
 *                 for having learned the skill, and it is why the pre-test is
 *                 worth sitting at all.
 *   2. CONFIRMED - the learner has passed at least one level. Before any level
 *                 has been passed the pup sits in the roster as a reward but
 *                 does not yet lean out and help mid-quiz, because the hint
 *                 has not been earned in a real attempt.
 *
 * Both conditions are required. `pupsEarned > 0` alone would hand out hints to
 * a learner who has never actually attempted a level; `tiersPassed > 0` alone
 * would hand out hints from pups whose skills were never demonstrated.
 */
export interface HelperGateInput {
  /** Skills with a perfect pre-test. */
  pupsEarned: number
  /** Tier ids with at least one passing attempt. */
  tiersPassed: ReadonlySet<TierId>
}

export type HelperGateState = 'locked' | 'needs_pretest' | 'needs_pass' | 'ready'

export function helperGate(input: HelperGateInput): HelperGateState {
  if (input.pupsEarned === 0) return 'needs_pretest'
  if (input.tiersPassed.size === 0) return 'needs_pass'
  return 'ready'
}

export function helperIsAvailable(input: HelperGateInput): boolean {
  return helperGate(input) === 'ready'
}

/** English, learner-facing. "Locked" is deliberately never shown as a threat. */
export function helperGateMessage(state: HelperGateState): string | null {
  switch (state) {
    case 'ready':
      return null
    case 'needs_pretest':
      return 'Score a perfect 5 on a skill check to bring your helper out.'
    case 'needs_pass':
      return 'Pass one level and your helper will be ready to jump in.'
    case 'locked':
      return 'Your helper is not ready yet.'
  }
}

/* --- The lockout rule ---------------------------------------------------- */

/**
 * Three failed attempts and the learner is flagged. The reference also
 * required an "average of the first 3 attempts >= 70%" escape hatch, which
 * contradicts MAX_ATTEMPTS: a learner who passed on attempt 4 would be locked
 * out. We drop that hatch. A pass always wins.
 */
export function checkNeedsAttention(attempts: readonly Attempt[]): {
  needsAttention: boolean
  reason: string | null
} {
  if (isTierPassed(attempts)) return { needsAttention: false, reason: null }
  if (attempts.length < MAX_ATTEMPTS) {
    return { needsAttention: false, reason: null }
  }
  const best = bestScore(attempts)
  const left = attemptsLeft(attempts)
  return {
    needsAttention: true,
    reason:
      `You have used all three attempts on this level (your best was ${best}%). ` +
      `Please practise with your teacher before you try again.${left === 0 ? '' : ''}`,
  }
}

/* --- Unlocking ----------------------------------------------------------- */

export interface UnlockInput {
  pupsEarned: number
  /** Set of tier ids already passed. */
  tiersPassed: ReadonlySet<TierId>
}

export function tierIsUnlocked(rule: TierRule, input: UnlockInput): boolean {
  if (input.pupsEarned < rule.requiresPups) return false
  const needed = TIER_ORDER.filter((id) => {
    const r = TIERS.find((t) => t.id === id)
    return r ? r.order < rule.order : false
  })
  if (needed.every((id) => input.tiersPassed.has(id))) return true
  return false
}

export function computeUnlockedTiers(input: UnlockInput): Set<TierId> {
  // Progressive: a tier is only counted as passed once every earlier tier is
  // also passed, so "hard" cannot unlock while "medium" is still open.
  const passed = new Set<TierId>()
  for (const id of TIER_ORDER) {
    const rule = TIERS.find((t) => t.id === id)
    if (!rule) continue
    const ok =
      input.pupsEarned >= rule.requiresPups &&
      TIER_ORDER.filter((other) => {
        const r = TIERS.find((t) => t.id === other)
        return r ? r.order < rule.order : false
      }).every((earlier) => passed.has(earlier))
    if (ok && input.tiersPassed.has(id)) passed.add(id)
  }
  return passed
}

/** Which tiers can be entered right now. Derived, never stored. */
export function availableTiers(input: UnlockInput): Set<TierId> {
  const out = new Set<TierId>()
  for (const id of TIER_ORDER) {
    const rule = TIERS.find((t) => t.id === id)
    if (rule && tierIsUnlocked(rule, input)) out.add(id)
  }
  return out
}

/* --- Reporting ----------------------------------------------------------- */

export type PerformanceBand =
  | 'not_assessed'
  | 'needs_attention'
  | 'excellent'
  | 'good'
  | 'needs_improvement'

export function performanceBand(avg: number, attempts: number): PerformanceBand {
  if (attempts === 0) return 'not_assessed'
  if (avg >= 90) return 'excellent'
  if (avg >= PASSING_SCORE) return 'good'
  return 'needs_improvement'
}

export interface SkillReport {
  id: string
  name: string
  pup: string
  completed: boolean
  pupEarned: boolean
  missedCount: number
}

export interface TierReport {
  id: TierId
  attempts: number
  scores: number[]
  averageScore: number
  bestScore: number
  passed: boolean
  missedSkills: string[]
}

export interface StudentReport {
  learnerCode: string
  generatedAt: number
  overallPerformance: PerformanceBand
  averageScore: number
  totalAttempts: number
  completedLevels: number
  skills: SkillReport[]
  tiers: Record<string, TierReport>
  skillsToFocus: string[]
  recommendations: string[]
  totals: { correct: number; incorrect: number }
}

export interface ReportInput {
  learnerCode: string
  skills: { id: string; completed: boolean; pupEarned: boolean }[]
  tiers: Record<string, { attempts: Attempt[]; needsAttention: boolean }>
  skillMissedCount: Record<string, number>
  totals: { correct: number; incorrect: number }
  now: number
}

export function buildReport(input: ReportInput): StudentReport {
  const skillReports: SkillReport[] = SKILLS.map((s) => ({
    id: s.id,
    name: s.name,
    pup: s.pup.name,
    completed: input.skills.find((x) => x.id === s.id)?.completed ?? false,
    pupEarned: input.skills.find((x) => x.id === s.id)?.pupEarned ?? false,
    missedCount: input.skillMissedCount[s.name] ?? 0,
  }))

  const tierReports: Record<string, TierReport> = {}
  let totalAttempts = 0
  let scoreSum = 0
  let completedLevels = 0

  // Keyed by tier id. The reference hardcoded [0],[1],[2] here, which broke
  // the moment the tier list changed.
  for (const id of TIER_ORDER) {
    const t = input.tiers[id]
    const attempts = t?.attempts ?? []
    const missed = [...new Set(attempts.flatMap((a) => a.missedSkills))]
    const passed = isTierPassed(attempts)
    if (passed) completedLevels += 1
    totalAttempts += attempts.length
    scoreSum += attempts.reduce((s, a) => s + a.score, 0)
    tierReports[id] = {
      id,
      attempts: attempts.length,
      scores: attempts.map((a) => a.score),
      averageScore: averageScore(attempts),
      bestScore: bestScore(attempts),
      passed,
      missedSkills: missed,
    }
  }

  const avg = totalAttempts > 0 ? Math.round(scoreSum / totalAttempts) : 0
  const anyNeedsAttention = Object.values(input.tiers).some((t) => t.needsAttention)
  const band: PerformanceBand = anyNeedsAttention
    ? 'needs_attention'
    : performanceBand(avg, totalAttempts)

  const skillsToFocus = Object.entries(input.skillMissedCount)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

  const recommendations: string[] = []
  if (anyNeedsAttention) {
    recommendations.push(
      'One level was not passed in three attempts. Please practise with your teacher before trying again.',
    )
  }
  for (const name of skillsToFocus) {
    const pup = SKILLS.find((s) => s.name === name)?.pup.name
    recommendations.push(
      `More practice needed on "${name}".${pup ? ` ${pup} can help with this.` : ''}`,
    )
  }
  if (totalAttempts > 0 && avg < PASSING_SCORE) {
    recommendations.push(
      `Your average is ${avg}%. You need ${PASSING_SCORE}% to pass. Keep practising.`,
    )
  }
  if (completedLevels === TIER_ORDER.length) {
    recommendations.push('All levels complete. Excellent work!')
  }
  if (recommendations.length === 0) {
    recommendations.push('Nothing to review yet. Carry on to the levels.')
  }

  return {
    learnerCode: input.learnerCode,
    generatedAt: input.now,
    overallPerformance: band,
    averageScore: avg,
    totalAttempts,
    completedLevels,
    skills: skillReports,
    tiers: tierReports,
    skillsToFocus,
    recommendations,
    totals: input.totals,
  }
}
