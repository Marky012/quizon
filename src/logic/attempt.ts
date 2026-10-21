import type { Question } from '@/content/schemas'
import type { HistoryEntry } from '@/logic/select'
import { poolsForStory, shuffleQuestionOptions, weightedShuffle } from '@/logic/select'
import { mulberry32, randomSeed, seedFromString } from '@/lib/random'
import type { TierId } from '@/content/world'

/* ===========================================================================
   STARTING AND RESUMING AN ATTEMPT.

   Lives here, in @/logic, rather than inside the Quiz screen, for two reasons:
   it is pure and therefore testable without a DOM, and because getting it wrong
   is silent. A resume that rebuilds a *slightly different* quiz still renders
   a perfectly good-looking quiz screen - it just quietly shows the learner
   twenty items they did not choose, and re-asks ones they already answered. No
   error, no crash, no visible symptom. That is exactly the class of bug tests
   are for.

   THE RECONSTRUCTION PROBLEM. A persisted attempt holds a seed and twenty
   question ids. To render them we need the full Question objects back,
   INCLUDING the option order, because "the right answer is always C" is a real
   thing a learner can otherwise learn across a resume.

   Rebuilding by re-running buildLevelQuiz does not work. That function's draw is
   adaptive: it weights items by the learner's miss history. By the time they
   come back, the history has fifteen more answers in it, so the same seed
   yields a different twenty. The draw is not reproducible from the seed alone.

   So the two halves are reconstructed separately, each from something that
   genuinely has not changed:

     item order    from the stored questionIds, verbatim
     option order  from a per-question seed of (attempt seed, question id)

   The option seed is derived rather than stored so it stays correct even if the
   learner resumes, leaves, and resumes again: deriving is idempotent, whereas
   a stored number could go stale against a changed option list.

   BOTH HALVES MUST BE DERIVED THE SAME WAY ON START AND ON RESUME. This was not
   true until 2026-10-04. startAttempt originally shuffled options with the same
   sequential generator that the adaptive draw had already consumed twenty values
   from, while resumeAttempt derived each permutation from optionSeed. The item
   order matched, because it is stored, but every option row came back permuted
   - so a learner who had picked up "the answer is always B" across their first
   few questions found it had become "always C" after a reload. Nothing threw,
   and the pre-existing tests passed, because they compared a resume against
   another resume and resumeAttempt is internally self-consistent. The test that
   catches it has to compare a resume against a FRESH startAttempt.
   =========================================================================== */

/** A newly begun attempt, before it is written to the store. */
export interface StartedAttempt {
  seed: number
  questions: Question[]
}

/**
 * The per-question seed for option shuffling.
 *
 * XOR-ing the attempt seed with a hash of the question id means two different
 * questions never share an option permutation, so a learner does not see the
 * same reshuffle pattern twice in one attempt - which would be its own quiet
 * tell.
 */
export function optionSeed(attemptSeed: number, questionId: string): number {
  return (attemptSeed ^ seedFromString(questionId)) >>> 0
}

/**
 * Builds a fresh 20-item attempt.
 *
 * `seed` is optional so tests are deterministic; production passes nothing and
 * gets a random one.
 */
export function startAttempt(args: {
  pools: Readonly<Record<string, Question[]>>
  storyId: string
  itemCount: number
  history: readonly HistoryEntry[]
  seed?: number
}): StartedAttempt {
  const seed = args.seed ?? randomSeed()

  // The item ORDER comes from the adaptive draw, which must stay sequential and
  // is not reproducible on resume - hence the stored questionIds.
  const pool = poolsForStory(args.pools, args.storyId)
  const drawn = weightedShuffle(pool, args.history, args.itemCount, mulberry32(seed))

  // The option ORDER does NOT come from that same generator. It is derived per
  // question from optionSeed, using the exact call resumeAttempt uses, so the
  // first screen after a resume is byte-identical to the screen before it.
  //
  // It used to be `drawn.map(q => shuffleQuestionOptions(q, rand))` sharing the
  // draw's generator. That is wrong in a way no test caught: resumeAttempt is
  // self-consistent, so comparing a resume to another resume passed, while a
  // learner who had learned a correct-answer position found it permuted across
  // a reload. buildLevelQuiz keeps that shared-generator behaviour for its other
  // callers; resumable attempts must not use it.
  const questions = drawn.map((q) =>
    shuffleQuestionOptions(q, mulberry32(optionSeed(seed, q.id))),
  )

  return { seed, questions }
}

export interface ResumeAttempt {
  /** The persisted attempt, for writing back the same ids. */
  tierId: TierId
  storyId: string
  seed: number
  questionIds: string[]
  index: number
  correct: number
  missedSkills: string[]
  startedAt: number
}

export type ResumeResult =
  | { ok: true; questions: Question[]; index: number }
  /**
   * The attempt cannot be resumed faithfully. `missing` names the ids that no
   * longer resolve, which means the question bank changed under a saved
   * attempt. The caller should start fresh and tell the learner why, rather
   * than silently shortening the quiz.
   */
  | { ok: false; missing: string[] }

/**
 * Rebuilds the exact attempt a learner left.
 *
 * Returns ok:false rather than a partial quiz if ANY stored id no longer
 * resolves. Dropping just the missing ones would shift every later index, so
 * the learner would resume onto the wrong question while the progress bar
 * claimed they were further along than they were.
 */
export function resumeAttempt(
  pools: Readonly<Record<string, Question[]>>,
  attempt: ResumeAttempt,
): ResumeResult {
  if (attempt.questionIds.length === 0) return { ok: false, missing: [] }

  const pool = poolsForStory(pools, attempt.storyId)
  const byId = new Map(pool.map((q) => [q.id, q]))

  const missing: string[] = []
  const questions: Question[] = []

  for (const id of attempt.questionIds) {
    const found = byId.get(id)
    if (!found) {
      missing.push(id)
      continue
    }
    questions.push(shuffleQuestionOptions(found, mulberry32(optionSeed(attempt.seed, id))))
  }

  if (missing.length > 0) return { ok: false, missing }
  if (questions.length === 0) return { ok: false, missing: [] }

  return {
    ok: true,
    questions,
    // Clamped so a corrupt or hand-edited index cannot point past the end. The
    // Quiz screen treats index >= length as "finished", so an out-of-range
    // value has to arrive already clamped rather than crashing a lookup.
    index: Math.max(0, Math.min(attempt.index, questions.length)),
  }
}