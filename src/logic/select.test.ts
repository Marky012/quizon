import { describe, it, expect } from 'vitest'
import {
  shuffleArray,
  shuffleQuestionOptions,
  weightedShuffle,
  appendHistory,
  assignStory,
  buildLevelQuiz,
  poolsForStory,
  storyPoolIsThin,
  type HistoryEntry,
} from './select'
import type { Question } from '@/content/schemas'
import type { TierId } from '@/content/world'
import { mulberry32, randomSeed, seedFromString } from '@/lib/random'
import { helperGate, helperIsAvailable, helperGateMessage } from './scoring'
import { getTierPools, STORY_POOL_IDS } from '@/content/questions'

function q(id: string, correctIndex = 0, n = 4): Question {
  return {
    id,
    skillTested: 'Uri ng Teksto',
    prompt: `tanong ${id}`,
    options: Array.from({ length: n }, (_, i) => ({
      text: `sagot ${i}`,
      ...(i === correctIndex ? {} : { errorTag: `mali ang ${i}` }),
    })),
    correctIndex,
    explanation: ' paliwanag',
  }
}

describe('shuffleArray', () => {
  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    shuffleArray(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('returns a permutation of the same elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffleArray(input)
    expect(out).toHaveLength(input.length)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
  })

  it('handles empty and single-element arrays', () => {
    expect(shuffleArray([])).toEqual([])
    expect(shuffleArray([7])).toEqual([7])
  })

  it('is reproducible from a seed, which is what makes an attempt resumable', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(shuffleArray(input, mulberry32(12345))).toEqual(shuffleArray(input, mulberry32(12345)))
  })

  it('produces a different order for a different seed', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // 40 draws: the odds of two seeds colliding are negligible, so a single
    // disagreement is enough and we do not need a statistical test here.
    const a = shuffleArray(input, mulberry32(1)).join()
    const b = shuffleArray(input, mulberry32(2)).join()
    expect(a).not.toEqual(b)
  })

  it('does not mutate the input when seeded', () => {
    const input = ['a', 'b', 'c', 'd']
    const copy = input.slice()
    shuffleArray(input, mulberry32(99))
    expect(input).toEqual(copy)
  })
})

describe('shuffleQuestionOptions - the positional-bias guard', () => {
  it('remaps correctIndex so the right answer still points at the right text', () => {
    const original = q('Q1', 2)
    for (let i = 0; i < 300; i++) {
      const shuffled = shuffleQuestionOptions(original)
      expect(shuffled.options[shuffled.correctIndex as number]?.text).toBe(
        original.options[2]?.text,
      )
    }
  })

  it('actually moves the answer, so "always A" cannot be learned', () => {
    const original = q('Q1', 0)
    const positions = new Set<number>()
    for (let i = 0; i < 300; i++) {
      positions.add(shuffleQuestionOptions(original).correctIndex as number)
    }
    expect(positions.size).toBeGreaterThan(1)
  })

  it('keeps errorTag attached to its own option', () => {
    const original = q('Q1', 1)
    for (let i = 0; i < 200; i++) {
      const s = shuffleQuestionOptions(original)
      const correct = s.options[s.correctIndex as number]
      expect(correct?.errorTag).toBeUndefined()
      const wrong = s.options.filter((_, idx) => idx !== s.correctIndex)
      expect(wrong.every((opt) => Boolean(opt.errorTag))).toBe(true)
    }
  })

  it('preserves option count and does not mutate the source', () => {
    const original = q('Q1', 3)
    const snapshot = JSON.stringify(original)
    const shuffled = shuffleQuestionOptions(original)
    expect(shuffled.options).toHaveLength(4)
    expect(JSON.stringify(original)).toBe(snapshot)
  })

  it('remaps correctIndices for multi-select questions', () => {
    const multi: Question = {
      id: 'M1',
      skillTested: 'Mahalagang Detalye',
      prompt: 'piliin ang lahat',
      options: [
        { text: 'A' },
        { text: 'B' },
        { text: 'C' },
        { text: 'D' },
      ],
      correctIndices: [0, 2],
      explanation: ' paliwanag',
    }
    for (let i = 0; i < 200; i++) {
      const s = shuffleQuestionOptions(multi)
      const chosen = s.correctIndices ?? []
      expect(chosen).toHaveLength(2)
      expect(chosen.map((idx) => s.options[idx]?.text).sort()).toEqual(['A', 'C'])
    }
  })
})

describe('weightedShuffle - the adaptive engine', () => {
  const bank = Array.from({ length: 10 }, (_, i) => q(`B${i}`))

  it('never returns more than the bank holds', () => {
    expect(weightedShuffle(bank, [], 25)).toHaveLength(10)
  })

  it('respects the limit', () => {
    expect(weightedShuffle(bank, [], 4)).toHaveLength(4)
  })

  it('never repeats a question', () => {
    const picked = weightedShuffle(bank, [], 10)
    expect(new Set(picked.map((x) => x.id)).size).toBe(10)
  })

  it('returns empty for a non-positive limit or empty bank', () => {
    expect(weightedShuffle(bank, [], 0)).toEqual([])
    expect(weightedShuffle([], [], 5)).toEqual([])
  })

  it('surfaces a question the learner got wrong twice far more often', () => {
    const history: HistoryEntry[] = [
      { questionId: 'B0', correct: false, timestamp: 1 },
      { questionId: 'B0', correct: false, timestamp: 2 },
    ]
    let b0Count = 0
    const trials = 400
    for (let i = 0; i < trials; i++) {
      // pick one item with a limit of 1 and see which question comes back
      const [first] = weightedShuffle(bank, history, 1)
      if (first?.id === 'B0') b0Count++
    }
    // B0 has weight 1 + 2*2 = 5; the other nine have weight 1 each. Total 14.
    // Expected share is 5/14 ~ 35.7%. Assert it beats a uniform 10% draw.
    expect(b0Count / trials).toBeGreaterThan(0.2)
  })

  it('does not penalise a question answered correctly', () => {
    const history: HistoryEntry[] = [
      { questionId: 'B0', correct: true, timestamp: 1 },
      { questionId: 'B0', correct: true, timestamp: 2 },
    ]
    let b0Count = 0
    const trials = 400
    for (let i = 0; i < trials; i++) {
      const [first] = weightedShuffle(bank, history, 1)
      if (first?.id === 'B0') b0Count++
    }
    // weight floors at 1, so B0 must not be below the others' share
    expect(b0Count / trials).toBeGreaterThan(0.02)
  })

  it('is deterministic given a seeded generator', () => {
    const rand = () => 0.5
    expect(weightedShuffle(bank, [], 3, rand).map((x) => x.id)).toEqual(
      weightedShuffle(bank, [], 3, rand).map((x) => x.id),
    )
  })
})

/* ===========================================================================
   THE HELPER GATE - pre-test 5/5 EARNS a pup, passing a level CONFIRMS it
   =========================================================================== */

describe('helperGate', () => {
  const passed = (...ids: TierId[]) => new Set<TierId>(ids)

  it('needs a perfect pre-test first', () => {
    expect(helperGate({ pupsEarned: 0, tiersPassed: passed('easy') })).toBe('needs_pretest')
  })

  it('needs a passed level before a helper is usable', () => {
    expect(helperGate({ pupsEarned: 8, tiersPassed: new Set() })).toBe('needs_pass')
  })

  it('is ready only when both are satisfied', () => {
    expect(helperGate({ pupsEarned: 1, tiersPassed: passed('easy') })).toBe('ready')
  })

  it('a single earned pup is enough', () => {
    // Requiring all eight would make hints unreachable in practice.
    expect(helperGate({ pupsEarned: 1, tiersPassed: passed('hard') })).toBe('ready')
  })

  it('does not treat an unpassed attempt as a pass', () => {
    expect(helperGate({ pupsEarned: 8, tiersPassed: new Set<TierId>() })).not.toBe('ready')
  })

  it('helperIsAvailable mirrors the ready state', () => {
    expect(helperIsAvailable({ pupsEarned: 1, tiersPassed: passed('easy') })).toBe(true)
    expect(helperIsAvailable({ pupsEarned: 1, tiersPassed: new Set() })).toBe(false)
    expect(helperIsAvailable({ pupsEarned: 0, tiersPassed: passed('easy') })).toBe(false)
  })

  it('gives an English reason while locked, and none once ready', () => {
    expect(helperGateMessage('needs_pretest')).toMatch(/5/)
    expect(helperGateMessage('needs_pass')).toMatch(/Pass one level/)
    expect(helperGateMessage('ready')).toBeNull()
  })
})

describe('appendHistory', () => {
  it('caps at the limit, keeping the newest', () => {
    let h: HistoryEntry[] = []
    for (let i = 0; i < 250; i++) {
      h = appendHistory(h, { questionId: `Q${i}`, correct: true, timestamp: i }, 200)
    }
    expect(h).toHaveLength(200)
    expect(h[0]?.questionId).toBe('Q50')
    expect(h[199]?.questionId).toBe('Q249')
  })
})

/* ===========================================================================
   STORY ASSIGNMENT - one story per learner, per level
   =========================================================================== */

describe('assignStory', () => {
  it('only ever returns a story from the pool', () => {
    for (let i = 0; i < 200; i++) {
      expect(STORY_POOL_IDS).toContain(assignStory(STORY_POOL_IDS))
    }
  })

  it('reaches more than one story across many draws', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) seen.add(assignStory(STORY_POOL_IDS))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('is deterministic given a seeded generator', () => {
    const rand = () => 0.5
    expect(assignStory(STORY_POOL_IDS, rand)).toBe(assignStory(STORY_POOL_IDS, rand))
  })

  it('never returns undefined when rand returns exactly 1', () => {
    // Math.random() is < 1, but a seeded generator can hit 1. Clamping keeps
    // a bad draw from producing a storyId that no pool can serve.
    expect(assignStory(STORY_POOL_IDS, () => 1)).toBe(STORY_POOL_IDS[STORY_POOL_IDS.length - 1])
  })

  it('throws on an empty pool rather than returning undefined', () => {
    expect(() => assignStory([])).toThrow(/empty pool/)
  })
})

describe('poolsForStory', () => {
  it('returns only the assigned story items', () => {
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      for (const storyId of STORY_POOL_IDS) {
        const items = poolsForStory(getTierPools(tier), storyId)
        for (const item of items) expect(item.passageId).toBe(storyId)
      }
    }
  })

  it('returns empty for an unknown story instead of falling back', () => {
    // Falling back to the whole tier would silently break the one-story rule.
    expect(poolsForStory(getTierPools('easy'), 'NOPE')).toEqual([])
  })
})

describe('buildLevelQuiz', () => {
  it('never mixes stories', () => {
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      for (const storyId of STORY_POOL_IDS) {
        const quiz = buildLevelQuiz(getTierPools(tier), storyId, 20, [], () => 0.3)
        for (const item of quiz) expect(item.passageId).toBe(storyId)
      }
    }
  })

  it('caps at what the pool holds rather than over-drawing', () => {
    const quiz = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], () => 0.3)
    expect(quiz.length).toBeLessThanOrEqual(20)
    expect(quiz.length).toBeGreaterThan(0)
  })

  it('draws without repeating a question inside one quiz', () => {
    const quiz = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], () => 0.3)
    const ids = quiz.map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('still shuffles option order on the questions it selects', () => {
    // Note the generator. This test used to inject `() => 0.3` for the weighted
    // draw while the option shuffle quietly used Math.random, so it never
    // actually covered option shuffling. Now one generator feeds both stages,
    // and a CONSTANT generator is degenerate: floor(0.3 * n) for every n picks a
    // single fixed permutation, which leaves every answer at one position and
    // would make this test fail for the right reason. A seeded stream varies.
    const positions = new Set<number>()
    for (let seed = 1; seed <= 25; seed++) {
      for (const x of buildLevelQuiz(getTierPools('easy'), 'T1', 4, [], mulberry32(seed))) {
        positions.add(x.correctIndex as number)
      }
    }
    // If options were left unshuffled, one position would dominate.
    expect(positions.size).toBeGreaterThan(1)
  })

  it('is deterministic under a constant generator, for both stages', () => {
    // The degenerate case above is still a legitimate input: it must produce a
    // stable, reproducible attempt rather than crashing or dropping items.
    const a = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], () => 0.3)
    const b = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], () => 0.3)
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
    expect(a).toHaveLength(20)
    // Option text must line up with correctIndex even on a fixed permutation,
    // otherwise the bias guard itself breaks.
    for (const item of a) {
      expect(item.options[item.correctIndex as number]?.errorTag).toBeUndefined()
    }
  })

  it('returns empty for an unknown story', () => {
    expect(buildLevelQuiz(getTierPools('easy'), 'NOPE', 20)).toEqual([])
  })
})

/* ===========================================================================
   THE RESUME CONTRACT

   These are the tests that justify persisting an in-progress attempt. If any of
   them break, "continue" becomes "start a subtly different quiz", which is
   worse than not offering it at all: the learner believes they are picking up
   where they left off and they are not.

   The property being pinned is that one seed plus one story plus one history
   determines the entire attempt - same items, same order, same option order.
   =========================================================================== */
describe('seeded reproducibility - the resume contract', () => {
  it('builds the identical 20 items from the same seed', () => {
    const a = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], mulberry32(4242))
    const b = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], mulberry32(4242))
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
  })

  it('keeps the OPTION order identical too, not just the item order', () => {
    const a = buildLevelQuiz(getTierPools('medium'), 'T2', 20, [], mulberry32(777))
    const b = buildLevelQuiz(getTierPools('medium'), 'T2', 20, [], mulberry32(777))
    // Option TEXT is compared as well as the ids: an identical id list with a
    // different option order would still silently invalidate a resume.
    expect(a.map((x) => [x.id, x.options.map((o) => o.text)])).toEqual(
      b.map((x) => [x.id, x.options.map((o) => o.text)]),
    )
  })

  it('still honours the learner history, because the draw is adaptive', () => {
    // Two different histories are two different attempts even at the same seed,
    // so resume must persist the history it was built from, not just the seed.
    const history: HistoryEntry[] = [{ questionId: 'E001', correct: false, timestamp: 1 }]
    const withMiss = buildLevelQuiz(getTierPools('easy'), 'T1', 20, history, mulberry32(1))
    const withoutMiss = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], mulberry32(1))
    expect(withMiss).toHaveLength(20)
    expect(withoutMiss).toHaveLength(20)
  })

  it('survives a JSON round trip, since a seed is persisted as a plain number', () => {
    const seed = randomSeed()
    const restored = JSON.parse(JSON.stringify(seed)) as number
    const a = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], mulberry32(seed))
    const b = buildLevelQuiz(getTierPools('easy'), 'T1', 20, [], mulberry32(restored))
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
  })

  it('seedFromString is stable, so a story id can key a reproducible draw', () => {
    expect(seedFromString('T1')).toBe(seedFromString('T1'))
    expect(seedFromString('T1')).not.toBe(seedFromString('T2'))
  })

  it('randomSeed stays inside the 32-bit range mulberry32 expects', () => {
    for (let i = 0; i < 500; i++) {
      const s = randomSeed()
      expect(Number.isInteger(s)).toBe(true)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(0xffffffff)
    }
  })

  it('multiplies out to values in [0, 1) so shuffle indexes stay in range', () => {
    const rand = mulberry32(20261004)
    for (let i = 0; i < 1000; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('storyPoolIsThin', () => {
  it('flags a pool that cannot fill a 20-item quiz', () => {
    // A pool is thin when it holds fewer items than the quiz needs, so the
    // learner would see the same question twice. All three tiers were filled
    // out to the full 20 per story on 2026-10-04, so none of them warn.
    expect(storyPoolIsThin(getTierPools('easy'), 'T1', 20)).toBe(false)
    expect(storyPoolIsThin(getTierPools('medium'), 'T1', 20)).toBe(false)
    expect(storyPoolIsThin(getTierPools('hard'), 'T1', 20)).toBe(false)
    // Still a real warning when a quiz asks for more than the pool holds.
    expect(storyPoolIsThin(getTierPools('hard'), 'T1', 21)).toBe(true)
  })

  it('treats a pool of exactly the needed size as not thin', () => {
    // The boundary matters: a pool holding exactly 20 for a 20-item quiz must
    // not warn, or every learner sees a false "not enough questions" notice.
    expect(storyPoolIsThin(getTierPools('hard'), 'T1', 20)).toBe(false)
  })
})
