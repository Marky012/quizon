import { describe, it, expect } from 'vitest'
import {
  percentage,
  isPassing,
  averageScore,
  bestScore,
  isTierPassed,
  attemptsLeft,
  checkNeedsAttention,
  tierIsUnlocked,
  availableTiers,
  computeUnlockedTiers,
  performanceBand,
  buildReport,
  type Attempt,
  type ReportInput,
} from './scoring'
import { PASSING_SCORE, MAX_ATTEMPTS, TIERS, TIER_ORDER } from '@/constants/gameConfig'
import { SKILL_NAMES } from '@/content/manifest'
import type { TierId } from '@/content/world'

const a = (score: number, missed: string[] = []): Attempt => ({
  score,
  date: 0,
  missedSkills: missed,
})

describe('percentage', () => {
  it('rounds to the nearest whole percent', () => {
    expect(percentage(14, 20)).toBe(70)
    expect(percentage(18, 25)).toBe(72)
    expect(percentage(1, 3)).toBe(33)
  })

  it('returns 0 rather than NaN on an empty item set', () => {
    expect(percentage(0, 0)).toBe(0)
  })
})

describe('isPassing', () => {
  it('uses the configured 70% gate, inclusive', () => {
    expect(PASSING_SCORE).toBe(70)
    expect(isPassing(70)).toBe(true)
    expect(isPassing(69)).toBe(false)
  })
})

describe('attempt aggregation', () => {
  it('averages, bests, and counts down', () => {
    const attempts = [a(50), a(80), a(60)]
    expect(averageScore(attempts)).toBe(63)
    expect(bestScore(attempts)).toBe(80)
    expect(attemptsLeft(attempts)).toBe(0)
  })

  it('handles no attempts without dividing by zero', () => {
    expect(averageScore([])).toBe(0)
    expect(bestScore([])).toBe(0)
    expect(attemptsLeft([])).toBe(MAX_ATTEMPTS)
  })

  it('treats the BEST attempt as the pass, not the average', () => {
    // A learner who failed twice then passed on the third try has passed.
    expect(isTierPassed([a(40), a(55), a(75)])).toBe(true)
  })
})

describe('checkNeedsAttention', () => {
  it('does not flag before MAX_ATTEMPTS', () => {
    const r = checkNeedsAttention([a(30), a(40)])
    expect(r.needsAttention).toBe(false)
    expect(r.reason).toBeNull()
  })

  it('flags after three failed attempts, with a readable Taglish reason', () => {
    const r = checkNeedsAttention([a(30), a(40), a(55)])
    expect(r.needsAttention).toBe(true)
    // the reason must quote the BEST attempt, not the last or the average
    expect(r.reason).toContain('55')
    expect(r.reason).toContain('teacher')
  })

  it('a pass always wins, even on the third attempt', () => {
    // The reference let the "avg of first 3 >= 70%" rule lock out a learner
    // who had actually passed. That contradiction is gone.
    const r = checkNeedsAttention([a(30), a(40), a(80)])
    expect(r.needsAttention).toBe(false)
  })

  it('names the best score in the reason', () => {
    const r = checkNeedsAttention([a(64), a(55), a(20)])
    expect(r.reason).toContain('64')
  })
})

describe('tier unlocking', () => {
  const easy = TIERS.find((t) => t.id === 'easy')!
  const medium = TIERS.find((t) => t.id === 'medium')!
  const hard = TIERS.find((t) => t.id === 'hard')!

  it('easy needs all eight pups and nothing before it', () => {
    expect(tierIsUnlocked(easy, { pupsEarned: 8, tiersPassed: new Set() })).toBe(true)
    expect(tierIsUnlocked(easy, { pupsEarned: 7, tiersPassed: new Set() })).toBe(false)
  })

  it('medium additionally needs easy passed', () => {
    expect(tierIsUnlocked(medium, { pupsEarned: 8, tiersPassed: new Set() })).toBe(false)
    expect(
      tierIsUnlocked(medium, { pupsEarned: 8, tiersPassed: new Set<TierId>(['easy']) }),
    ).toBe(true)
  })

  it('hard additionally needs medium passed', () => {
    expect(
      tierIsUnlocked(hard, { pupsEarned: 8, tiersPassed: new Set<TierId>(['easy']) }),
    ).toBe(false)
    expect(
      tierIsUnlocked(hard, {
        pupsEarned: 8,
        tiersPassed: new Set<TierId>(['easy', 'medium']),
      }),
    ).toBe(true)
  })

  it('availableTiers is a cumulative chain, never a skip', () => {
    expect(availableTiers({ pupsEarned: 0, tiersPassed: new Set() })).toEqual(new Set())
    expect(availableTiers({ pupsEarned: 8, tiersPassed: new Set() })).toEqual(
      new Set<TierId>(['easy']),
    )
    expect(
      availableTiers({ pupsEarned: 8, tiersPassed: new Set<TierId>(['easy']) }),
    ).toEqual(new Set<TierId>(['easy', 'medium']))
    expect(
      availableTiers({
        pupsEarned: 8,
        tiersPassed: new Set<TierId>(['easy', 'medium']),
      }),
    ).toEqual(new Set<TierId>(['easy', 'medium', 'hard']))
  })

  it('computeUnlockedTiers refuses to count a skipped tier as progress', () => {
    // hard passed but medium not: medium is not "unlocked-and-passed"
    const out = computeUnlockedTiers({
      pupsEarned: 8,
      tiersPassed: new Set<TierId>(['hard']),
    })
    expect(out.has('hard')).toBe(false)
    expect(out.has('easy')).toBe(false)
  })

  it('tier order is easy, medium, hard', () => {
    expect(TIER_ORDER).toEqual(['easy', 'medium', 'hard'])
  })
})

describe('performanceBand', () => {
  it('unassessed before any attempt', () => {
    expect(performanceBand(0, 0)).toBe('not_assessed')
  })
  it('bands by the 70% gate', () => {
    expect(performanceBand(95, 2)).toBe('excellent')
    expect(performanceBand(75, 2)).toBe('good')
    expect(performanceBand(60, 2)).toBe('needs_improvement')
  })
})

describe('buildReport', () => {
  const base: ReportInput = {
    learnerCode: 'BAL-47',
    skills: [],
    tiers: {},
    skillMissedCount: {},
    totals: { correct: 30, incorrect: 10 },
    now: 1_700_000_000_000,
  }

  it('is not_assessed with no attempts', () => {
    const r = buildReport(base)
    expect(r.overallPerformance).toBe('not_assessed')
    expect(r.averageScore).toBe(0)
    expect(r.totalAttempts).toBe(0)
  })

  it('reports every tier by id, not by array index', () => {
    const r = buildReport(base)
    expect(Object.keys(r.tiers).sort()).toEqual([...TIER_ORDER].sort())
  })

  it('a tier flagged for attention outranks the numeric band', () => {
    const r = buildReport({
      ...base,
      tiers: {
        easy: { attempts: [a(50), a(50), a(50)], needsAttention: true },
      },
    })
    expect(r.overallPerformance).toBe('needs_attention')
    expect(r.recommendations[0]).toContain('three attempts')
  })

  it('ranks the five most-missed skills and names their pups', () => {
    const r = buildReport({
      ...base,
      skillMissedCount: Object.fromEntries(
        SKILL_NAMES.map((n, i) => [n, 10 - i]),
      ),
    })
    expect(r.skillsToFocus).toHaveLength(5)
    expect(r.skillsToFocus[0]).toBe(SKILL_NAMES[0])
    const rec = r.recommendations.find((x) => x.includes(SKILL_NAMES[0]!))
    expect(rec).toBeDefined()
    expect(rec).toMatch(/can help with this/)
  })

  it('de-duplicates missed skills across attempts', () => {
    const name = SKILL_NAMES[0]!
    const r = buildReport({
      ...base,
      tiers: { easy: { attempts: [a(50, [name]), a(60, [name])], needsAttention: false } },
    })
    expect(r.tiers.easy?.missedSkills).toEqual([name])
  })

  it('counts a level completed when its best attempt passed', () => {
    const r = buildReport({
      ...base,
      tiers: { easy: { attempts: [a(40), a(75)], needsAttention: false } },
    })
    expect(r.tiers.easy?.passed).toBe(true)
    expect(r.completedLevels).toBe(1)
  })

  it('always produces at least one recommendation', () => {
    expect(buildReport(base).recommendations.length).toBeGreaterThan(0)
  })

  it('reports pup status per skill, never lumping them into one score', () => {
    const r = buildReport({
      ...base,
      skills: [{ id: 'text-type', completed: true, pupEarned: true }],
    })
    const s = r.skills.find((x) => x.id === 'text-type')
    expect(s?.pupEarned).toBe(true)
    expect(s?.pup).toBe('Tala')
  })

  it('shows the shortfall when the average is below the gate', () => {
    const r = buildReport({
      ...base,
      tiers: { easy: { attempts: [a(60)], needsAttention: false } },
    })
    expect(r.recommendations.some((x) => x.includes('60%') && x.includes('70%'))).toBe(true)
  })
})
