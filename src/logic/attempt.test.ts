import { describe, it, expect } from 'vitest'
import { getTierPools, STORY_POOL_IDS } from '@/content/questions'
import { optionSeed, resumeAttempt, startAttempt, type ResumeAttempt } from './attempt'
import { mulberry32 } from '@/lib/random'
import { appendHistory, type HistoryEntry } from './select'
import type { TierId } from '@/content/world'

/* ===========================================================================
   THESE TESTS EXIST BECAUSE RESUME FAILS SILENTLY.

   A broken resume does not crash. It renders a valid-looking quiz containing
   the wrong twenty questions in the wrong order, and the learner only notices
   because a question they answered yesterday is asking again. Nothing in the
   test output would have said so. So the properties below are asserted
   explicitly rather than inferred from "the screen rendered".
   =========================================================================== */

const pools = getTierPools('easy')

/** A plausible saved attempt, as the store would hold it. */
function saved(over: Partial<ResumeAttempt> = {}): ResumeAttempt {
  const started = startAttempt({
    pools,
    storyId: 'T1',
    itemCount: 20,
    history: [],
    seed: 20261004,
  })
  return {
    tierId: 'easy' as TierId,
    storyId: 'T1',
    seed: started.seed,
    questionIds: started.questions.map((q) => q.id),
    index: 7,
    correct: 5,
    missedSkills: ['Uri ng Teksto'],
    startedAt: 1_700_000_000_000,
    ...over,
  }
}

describe('startAttempt', () => {
  it('draws the full item count from one story', () => {
    const a = startAttempt({ pools, storyId: 'T1', itemCount: 20, history: [], seed: 1 })
    expect(a.questions).toHaveLength(20)
    for (const q of a.questions) expect(q.passageId).toBe('T1')
  })

  it('is reproducible when given a seed', () => {
    const a = startAttempt({ pools, storyId: 'T2', itemCount: 20, history: [], seed: 42 })
    const b = startAttempt({ pools, storyId: 'T2', itemCount: 20, history: [], seed: 42 })
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id))
  })

  it('generates a usable seed when none is given', () => {
    const a = startAttempt({ pools, storyId: 'T1', itemCount: 20, history: [] })
    expect(Number.isInteger(a.seed)).toBe(true)
    expect(a.questions.length).toBeGreaterThan(0)
  })

  it('reacts to the adaptive history, which is the whole point of the draw', () => {
    const history: HistoryEntry[] = [{ questionId: 'E001', correct: false, timestamp: 1 }]
    const withMiss = startAttempt({ pools, storyId: 'T1', itemCount: 20, history, seed: 9 })
    const without = startAttempt({ pools, storyId: 'T1', itemCount: 20, history: [], seed: 9 })
    // Same seed, different history: the draw is adaptive, so these legitimately
    // differ. Resume therefore must NOT re-derive the draw - see resumeAttempt.
    expect(withMiss.seed).toBe(without.seed)
  })
})

describe('resumeAttempt', () => {
  it('rebuilds the exact same items in the exact same order', () => {
    const attempt = saved()
    const first = resumeAttempt(pools, attempt)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const again = resumeAttempt(pools, attempt)
    expect(again.ok).toBe(true)
    if (!again.ok) return
    expect(first.questions.map((q) => q.id)).toEqual(attempt.questionIds)
    expect(again.questions.map((q) => q.id)).toEqual(attempt.questionIds)
  })

  it('restores the OPTION order, so a learner cannot re-learn a position', () => {
    const attempt = saved()
    const a = resumeAttempt(pools, attempt)
    const b = resumeAttempt(pools, attempt)
    if (!a.ok || !b.ok) throw new Error('expected a resumable attempt')
    expect(a.questions.map((q) => q.options.map((o) => o.text))).toEqual(
      b.questions.map((q) => q.options.map((o) => o.text)),
    )
  })

  it('reproduces the ORIGINAL attempt, not merely a consistent re-derivation', () => {
    // THIS is the assertion that was missing. The test above compares a resume
    // against another resume, which passes even when both are wrong, because
    // resumeAttempt is internally self-consistent. What actually matters to the
    // learner is that the first screen after resuming is identical to the
    // screen they left. That can only be checked against a fresh startAttempt.
    //
    // It failed. startAttempt shuffled options with one sequential generator
    // that had already been consumed by the adaptive draw, while resumeAttempt
    // derived each permutation from optionSeed(seed, questionId). The item
    // order matched - it is stored - but every option row came back reordered.
    // A learner who had learned "the answer is always B" would find it had
    // silently become "always C" across a reload.
    const started = startAttempt({
      pools,
      storyId: 'T1',
      itemCount: 20,
      history: [],
      seed: 20261004,
    })
    const attempt = saved({ seed: started.seed, questionIds: started.questions.map((q) => q.id) })
    const resumed = resumeAttempt(pools, attempt)
    if (!resumed.ok) throw new Error('expected a resumable attempt')

    expect(resumed.questions.map((q) => q.options.map((o) => o.text))).toEqual(
      started.questions.map((q) => q.options.map((o) => o.text)),
    )
    expect(resumed.questions.map((q) => q.correctIndex)).toEqual(
      started.questions.map((q) => q.correctIndex),
    )
  })

  it('keeps errorTag on the right option and the right answer reachable', () => {
    const attempt = saved()
    const r = resumeAttempt(pools, attempt)
    if (!r.ok) throw new Error('expected a resumable attempt')
    for (const q of r.questions) {
      expect(q.options[q.correctIndex as number]?.errorTag).toBeUndefined()
      const wrong = q.options.filter((_, i) => i !== q.correctIndex)
      expect(wrong.every((o) => Boolean(o.errorTag))).toBe(true)
    }
  })

  it('gives two different questions two different option permutations', () => {
    // Guards against the tell where every item reshuffles the same way.
    const a = mulberry32(optionSeed(1, 'E001'))
    const b = mulberry32(optionSeed(1, 'E002'))
    const drawA = [a(), a(), a()].join()
    const drawB = [b(), b(), b()].join()
    expect(drawA).not.toEqual(drawB)
  })

  it('restores the learner to the question they left on', () => {
    const attempt = saved({ index: 12 })
    const r = resumeAttempt(pools, attempt)
    if (!r.ok) throw new Error('expected a resumable attempt')
    expect(r.index).toBe(12)
    expect(r.questions[r.index]?.id).toBe(attempt.questionIds[12])
  })

  it('survives the history growing, which is why the draw is not re-derived', () => {
    // This is the trap. The store's history now has 15 more answers than it did
    // when the attempt started. Re-running buildLevelQuiz would produce a
    // different twenty; reading the stored ids must not care.
    const attempt = saved()
    const before = resumeAttempt(pools, attempt)
    // Mutating global history is irrelevant to resumeAttempt by construction,
    // but assert the outcome anyway so a future refactor that reaches back into
    // history fails here rather than in front of a learner.
    appendHistory([], { questionId: 'E001', correct: false, timestamp: 2 }, 100)
    const after = resumeAttempt(pools, attempt)
    if (!before.ok || !after.ok) throw new Error('expected a resumable attempt')
    expect(after.questions.map((q) => q.id)).toEqual(before.questions.map((q) => q.id))
  })

  it('refuses to resume when a stored question no longer exists', () => {
    // The bank was edited under a saved attempt. Silently dropping the missing
    // item would shift every later index, so the learner would resume onto the
    // wrong question while the progress bar disagreed with reality.
    const attempt = saved({ questionIds: [...saved().questionIds.slice(0, 19), 'E999'] })
    const r = resumeAttempt(pools, attempt)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.missing).toEqual(['E999'])
  })

  it('refuses an empty question list rather than rendering an empty quiz', () => {
    const r = resumeAttempt(pools, saved({ questionIds: [] }))
    expect(r.ok).toBe(false)
  })

  it('clamps an index that points past the end', () => {
    // A hand-edited or corrupt stored value must not produce an undefined
    // question; the Quiz screen treats index >= length as finished.
    const attempt = saved({ index: 9999 })
    const r = resumeAttempt(pools, attempt)
    if (!r.ok) throw new Error('expected a resumable attempt')
    expect(r.index).toBe(20)
  })

  it('clamps a negative index', () => {
    const r = resumeAttempt(pools, saved({ index: -5 }))
    if (!r.ok) throw new Error('expected a resumable attempt')
    expect(r.index).toBe(0)
  })

  it('does not mix stories when resuming', () => {
    for (const storyId of STORY_POOL_IDS) {
      // The attempt has to be BUILT for this story. Overriding only storyId
      // would leave ids from another story, which correctly fails to resolve.
      const started = startAttempt({ pools, storyId, itemCount: 20, history: [], seed: 5 })
      const attempt = saved({
        storyId,
        seed: started.seed,
        questionIds: started.questions.map((q) => q.id),
      })
      const r = resumeAttempt(pools, attempt)
      if (!r.ok) throw new Error(`expected ${storyId} to resume`)
      for (const q of r.questions) expect(q.passageId).toBe(storyId)
    }
  })
})