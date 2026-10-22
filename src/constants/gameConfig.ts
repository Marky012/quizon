import type { TierId } from '@/content/world'

/* ===========================================================================
   TUNABLE GAME RULES
   ===========================================================================
   Two DIFFERENT gates, deliberately. This separation is the pedagogical spine
   of the whole project:

     PRE-TEST  demands PERFECTION.  5 items, concept-scoped, unlimited free
               retries. It guards a single pup, and it is cheap enough that
               perfection is genuinely achievable for a Grade 5 learner.
     QUIZ     demands 70%.  20 items, cumulative, 3 attempts before the
              "needs attention" flag. All three levels are 20 items so the
              pass mark is 14/20 everywhere and scores are comparable.

   "Content mastery" and "cumulative assessment" are different things and get
   different instruments. Keep them different.
   =========================================================================== */

export const PASSING_SCORE = 70
export const MAX_ATTEMPTS = 3

export const PRETEST_QUESTION_COUNT = 5
/** Must be a perfect score to earn the pup. */
export const PRETEST_PASSING_SCORE = PRETEST_QUESTION_COUNT

/** ONE hint per level. The pupil is bound to that level's tier. */
export const HINTS_PER_LEVEL = 1

/** Feedback pause before auto-advancing, ms. */
export const ANSWER_FEEDBACK_DELAY = 2000

/** Ring-buffer cap on adaptive answer history. */
export const QUESTION_HISTORY_LIMIT = 200

/* --- The two names --------------------------------------------------------
   THE OFFICIAL NAME and THE IN-GAME ALIAS are different fields with
   different rules, and both caps are enforced by the store rather than only
   by the input, so a value arriving from anywhere else is trimmed too.

   The official name is generous: "Maria Santos Reyes" is 17 characters, and
   Filipino names with a middle name run longer than that. 60 is room for
   "Juanito Santos dela Cruz Jr." and still short enough to live in one
   database column and one dashboard cell.

   The alias is short on purpose. It is a nickname: it fits on a badge, in a
   greeting, and on a line of a report, and a long one defeats all three. */
export const MAX_FULL_NAME = 60
export const MAX_NICKNAME = 12

/* --- Tiers are DATA, not a union type baked into the store. --------------
   The reference project hardcoded easy/medium/hard in four separate places
   (the store's type, getStudentReport's indexes [0][1][2], the difficulty
   config, and the report's levels array). Adding a fourth tier meant editing
   all four. Here a tier is a row, and unlock / attempt-limit / report logic
   reads the table. Adding a fourth level is one line.                     */

export interface TierRule {
  id: TierId
  /** Fraction of items in this tier, in the order they must be beaten. */
  order: number
  /** How many pups must be earned before this tier unlocks. */
  requiresPups: number
  /** How many earlier tiers must be passed before this one unlocks. */
  requiresTiersPassed: number
}

export const TIERS: TierRule[] = [
  { id: 'easy', order: 0, requiresPups: 8, requiresTiersPassed: 0 },
  { id: 'medium', order: 1, requiresPups: 8, requiresTiersPassed: 1 },
  { id: 'hard', order: 2, requiresPups: 8, requiresTiersPassed: 2 },
]

export const TIER_ORDER: TierId[] = TIERS.map((t) => t.id).sort(
  (a, b) =>
    (TIERS.find((t) => t.id === a)?.order ?? 0) -
    (TIERS.find((t) => t.id === b)?.order ?? 0),
)
