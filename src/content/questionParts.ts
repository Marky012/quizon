import type { QuestionOption } from './schemas'

/* ===========================================================================
   SHARED QUESTION AUTHORING PARTS

   Extracted 2026-10-04 so the tier expansion files can build options with the
   same two helpers the original bank uses, without importing questions.ts.

   That last part matters: questions.ts imports the expansion files, so if they
   imported anything back from questions.ts the module graph would be circular
   and one of the two would get an undefined binding at load. These two symbols
   are the entire shared surface, so they live here instead.

   `S` is the skill-name map. The values MUST match Skill.name in manifest.ts
   exactly, because skillTested is the join key: a typo here does not fail
   loudly, it silently produces an undefined helper name in the hint card.
   =========================================================================== */

/** Skill names, kept as a const map so a typo is a compile error, not a string. */
export const S = {
  type: 'Text Type',
  purpose: 'Purpose',
  topic: 'Main Topic',
  details: 'Key Details',
  order: 'Sequence',
  fivew: 'Wh-Questions',
  fact: 'Fact or Opinion',
  who: 'Characters',
} as const

/**
 * Build one option.
 *
 * The errorTag is the whole reason this helper exists. Every WRONG option must
 * say specifically what is wrong with THAT option, because the app shows it as
 * the "why your answer is wrong" line. An option with no errorTag is only legal
 * when it is the correct answer.
 */
export const o = (text: string, errorTag?: string): QuestionOption =>
  errorTag ? { text, errorTag } : { text }