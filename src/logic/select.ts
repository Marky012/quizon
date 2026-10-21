import type { Question } from '@/content/schemas'

/* ===========================================================================
   PURE ADAPTIVE + RANDOMISATION LOGIC
   ===========================================================================
   These are the functions that most need tests and, in the reference project,
   had none. They are deliberately PURE and dependency-free so they can be
   tested without a store, a DOM, or a render.
   =========================================================================== */

export interface HistoryEntry {
  questionId: string
  correct: boolean
  timestamp: number
}

/**
 * Fisher-Yates on a copy. Never mutates the input.
 *
 * `rand` is injectable so a seeded caller can reproduce the exact permutation.
 * See @/lib/random for why an attempt has to be reproducible. Omitting it keeps
 * the original Math.random behaviour, so existing callers are unaffected.
 */
export function shuffleArray<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    // Swapped via locals rather than destructuring assignment so both sides
    // are treated as T under noUncheckedIndexedAccess.
    const a = out[i] as T
    const b = out[j] as T
    out[i] = b
    out[j] = a
  }
  return out
}

/**
 * Shuffles the options AND remaps correctIndex.
 *
 * Without the remap, positional bias is possible: a learner who learns "the
 * answer is always A" scores well without reading. This makes that impossible.
 *
 * For a multi-select question, correctIndices is remapped instead.
 */
export function shuffleQuestionOptions(q: Question, rand: () => number = Math.random): Question {
  const order = shuffleArray(q.options.map((_, i) => i), rand)
  const options = order.map((i) => q.options[i] as Question['options'][number])

  if (q.correctIndices) {
    const set = new Set(q.correctIndices)
    return { ...q, options, correctIndices: order.map((orig, now) => (set.has(orig) ? now : -1)).filter((i) => i >= 0) }
  }

  const correctIndex = order.indexOf(q.correctIndex ?? 0)
  return { ...q, options, correctIndex }
}

/**
 * THE ADAPTIVE ENGINE. A question the learner got wrong twice is 5x more
 * likely to come back. Everything else is untouched.
 *
 *   miss  = +1 per wrong history entry, -1 per right
 *   weight = 1 + max(0, miss) * 2
 *   roulette-wheel draw without replacement until `limit`
 *
 * Stateless: it reads a history array, it does not own one.
 */
export function weightedShuffle(
  questions: readonly Question[],
  history: readonly HistoryEntry[],
  limit: number,
  rand: () => number = Math.random,
): Question[] {
  if (limit <= 0 || questions.length === 0) return []

  const missById = new Map<string, number>()
  for (const h of history) {
    missById.set(h.questionId, (missById.get(h.questionId) ?? 0) + (h.correct ? -1 : 1))
  }

  const pool = questions.map((q) => ({
    q,
    weight: 1 + Math.max(0, missById.get(q.id) ?? 0) * 2,
  }))

  const out: Question[] = []
  const n = Math.min(limit, pool.length)

  for (let draw = 0; draw < n; draw++) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let ticket = rand() * total
    let chosen = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      ticket -= (pool[i] as { weight: number }).weight
      if (ticket <= 0) {
        chosen = i
        break
      }
    }
    const [taken] = pool.splice(chosen, 1)
    if (taken) out.push(taken.q)
  }

  return out
}

/** Ring-buffer append, capped. */
export function appendHistory(
  history: readonly HistoryEntry[],
  entry: HistoryEntry,
  limit: number,
): HistoryEntry[] {
  const next = [...history, entry]
  return next.length > limit ? next.slice(next.length - limit) : next
}

/* ===========================================================================
   STORY ASSIGNMENT - one story per learner, per level
   ===========================================================================
   Confirmed design 2026-10-01: every level draws from the same six core
   stories, each learner is given ONE of them, and all items in that level's
   quiz are about that one text.

   THE ASSIGNMENT MUST BE STORED, NOT RE-ROLLED. A learner who retries a level
   has to sit the same story, otherwise attempt 2 measures a different text
   from attempt 1 and the stored best score is meaningless. So this function
   is called ONCE per tier and the result is persisted by the store.
   =========================================================================== */

/** Picks one story from the pool. Deterministic when given a seeded `rand`. */
export function assignStory(
  pool: readonly string[],
  rand: () => number = Math.random,
): string {
  if (pool.length === 0) throw new Error('Cannot assign a story from an empty pool.')
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(rand() * pool.length)))
  return pool[index] as string
}

/**
 * Narrows a set of pools down to the ONE story this learner is sitting.
 * Returns [] rather than falling back to the whole tier: silently mixing
 * stories back in would undo the one-story rule without anyone noticing.
 */
export function poolsForStory(
  pools: Readonly<Record<string, Question[]>>,
  storyId: string,
): Question[] {
  return pools[storyId] ?? []
}

/**
 * Builds one level's quiz: 20 items about a single story, drawn adaptively.
 *
 * Order of operations matters. The adaptive draw happens FIRST so a question
 * the learner previously missed is more likely to be selected, and only the
 * SELECTED questions get their options shuffled. Shuffling before the draw
 * would remap correctIndex on the whole pool and make the adaptive weights
 * depend on rendering order.
 *
 * `rand` threads through BOTH stages: the weighted draw, then each selected
 * item's option shuffle. One seeded generator therefore reproduces the whole
 * attempt - same items, same order, same option order - which is what makes an
 * interrupted attempt resumable. See @/lib/random.
 */
export function buildLevelQuiz(
  pools: Readonly<Record<string, Question[]>>,
  storyId: string,
  itemCount: number,
  history: readonly HistoryEntry[] = [],
  rand: () => number = Math.random,
): Question[] {
  const pool = poolsForStory(pools, storyId)
  return weightedShuffle(pool, history, itemCount, rand).map((q) => shuffleQuestionOptions(q, rand))
}

/**
 * TRUE when the assigned story cannot fill the level without repeating items.
 * Surfaced to the UI as a content warning, not thrown: a thin pool must not
 * block a learner from playing while the bank is still being authored.
 */
export function storyPoolIsThin(
  pools: Readonly<Record<string, Question[]>>,
  storyId: string,
  itemCount: number,
): boolean {
  return poolsForStory(pools, storyId).length < itemCount
}
