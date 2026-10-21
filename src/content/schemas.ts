import { z } from 'zod'

/* ===========================================================================
   SCHEMAS
   The reference project had NO validation on its import paths, and its
   content was spread across ~7 files per concept so a single missed edit
   caused a silent runtime failure. These schemas are the fix: content lives
   in data, is validated at boot, and fails loudly and immediately.
   =========================================================================== */

export const SYMBOL_IDS = [
  'paper-fold',
  'speech',
  'magnifier',
  'hand-point',
  'stepping-stones',
  'eye-bracket',
  'scale',
  'speech-overlap',
] as const

export const ACCENTS = [
  'turquoise',
  'violet',
  'yellow',
  'lime',
  'indigo',
  'navy',
  'cream',
  'turquoise-deep',
] as const

/**
 * THE SPECIES. Locked 2026-10-04.
 *
 * The eight helpers are DOGS. For several iterations the code, the UI copy and
 * the world config all said pup while the art bible still said bird, and nothing
 * caught it because species was never a field anywhere - it was only prose in a
 * text file. Two places said "wing" while eight said "pup".
 *
 * SPECIES_NAME is the word used in world copy ("Woof School", "The Woof Pack").
 * It is exported rather than written into world.ts as a literal so that a
 * rename cannot half-happen again.
 */
export const SPECIES_NAME = 'Woof'
export const SPECIES_KIND = 'dog'

export const PupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  accent: z.enum(ACCENTS),
  /**
   * Appearance fields, all of them present because the generation prompts in
   * UI_ART_BIBLE 14.2 are built from this file and must not be able to drift
   * away from the data the app runs on. A prompt that names a breed the
   * manifest does not know about is a silent lie.
   *
   * BREED drives silhouette. EARS are the primary read at the 88px roster size,
   * which is why they are broken out of `trait` and tested separately.
   */
  breed: z.string().min(1),
  ears: z.string().min(1),
  cap: z.string().min(1),
  outfit: z.string().min(1),
  /** Personality prompt fragment, used when generating the character art. */
  trait: z.string().min(1),
})
export type Pup = z.infer<typeof PupSchema>

export const SkillSchema = z.object({
  id: z.string().min(1),
  /** Taglish display name. The training order is array order. */
  name: z.string().min(1),
  /** One line, Taglish, describing what this skill is for. */
  purpose: z.string().min(1),
  symbol: z.enum(SYMBOL_IDS),
  pup: PupSchema,
  /**
   * The pup's SINGLE hint. Teaches the rule, never reveals the answer.
   * Art bible section 13.4.
   */
  hint: z.string().min(1),
  /** Rule statement shown on the lesson header and in post-answer feedback. */
  rule: z.string().min(1),
})
export type Skill = z.infer<typeof SkillSchema>

export const ManifestSchema = z.object({ skills: z.array(SkillSchema).min(1) })

/* --- Teacher ------------------------------------------------------------- */

/**
 * Character 9. Deliberately NOT a Skill: she owns no reading strategy, so she
 * has no `hint`, no `rule`, and no pre-test. Putting her in SKILLS[] would make
 * her the ninth skill and put her in every skills list, stats breakdown and
 * roster. She is a person in the room, not a tool.
 */
export const TeacherSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** How the app addresses her. Flips between Ma'am and Sir. See TEACHER. */
  address: z.enum(['Ma\'am', 'Sir']),
  accent: z.enum(ACCENTS),
  /** Personality fragment for the character art prompt. */
  trait: z.string().min(1),
  /**
   * She carries a clipboard or pointer, NEVER one of the eight reading
   * instruments. An instrument would collide with a skill pup.
   */
  holds: z.string().min(1),
})
export type Teacher = z.infer<typeof TeacherSchema>

/* --- Questions ---------------------------------------------------------- */

export const OptionSchema = z.object({
  text: z.string().min(1),
  /**
   * ONLY on a wrong option. Says WHY it is wrong, in Taglish, so feedback is
   * specific rather than a generic restatement of the rule. This is the fix
   * for the reference's misleading template explanations.
   */
  errorTag: z.string().optional(),
})
export type QuestionOption = z.infer<typeof OptionSchema>

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    /** THE JOIN KEY. Must match a Skill.name exactly. */
    skillTested: z.string().min(1),
    /** Links to a bundled passage in texts.ts. */
    passageId: z.string().optional(),
    prompt: z.string().min(1),
    options: z.array(OptionSchema).min(2).max(4),
    /** Single-answer form. Mutually exclusive with correctIndices. */
    correctIndex: z.number().int().min(0).optional(),
    /** Multi-select form, e.g. "tap the sentences that are KEY details". */
    correctIndices: z.array(z.number().int().min(0)).optional(),
    /**
     * Authored, Taglish, specific to this question. Not generated at runtime.
   */
    explanation: z.string().min(1),
  })
  .refine(
    (q) => (q.correctIndex === undefined) !== (q.correctIndices === undefined),
    { message: 'Question needs exactly one of correctIndex or correctIndices' },
  )
  .refine(
    (q) =>
      q.correctIndex === undefined ||
      q.correctIndex < q.options.length,
    { message: 'correctIndex is out of range for options' },
  )
  .refine(
    (q) =>
      q.correctIndices === undefined ||
      (q.correctIndices.length > 0 &&
        q.correctIndices.every((i) => i < q.options.length)),
    { message: 'correctIndices out of range for options' },
  )
export type Question = z.infer<typeof QuestionSchema>

/** Bucket name per difficulty tier, keyed by tier id. */
export const BankSchema = z.object({
  /**
   * PER-STORY POOLS, keyed by passageId.
   *
   * Each tier holds one pool per story, so a learner assigned story T1 in the
   * Easy level only ever sees T1 questions. The three levels deliberately
   * share the same six stories and differ only in DEPTH on that text, which
   * means a learner's three results describe how deeply they read the same
   * six texts rather than three unrelated topics.
   */
  easy: z.record(z.string(), z.array(QuestionSchema)),
  medium: z.record(z.string(), z.array(QuestionSchema)),
  hard: z.record(z.string(), z.array(QuestionSchema)),
  /** preTest is keyed by SKILL NAME, because that is what skillTested holds. */
  preTest: z.record(z.string(), z.array(QuestionSchema)),
})
export type QuestionBank = z.infer<typeof BankSchema>

/** The per-tier shape: passageId -> questions about that passage. */
export type TierPools = Record<string, Question[]>

/* --- Passages ----------------------------------------------------------- */

export const PassageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  textType: z.enum(['news', 'howto', 'description', 'narrative']),
  purpose: z.enum(['inform', 'persuade', 'instruct', 'entertain']),
  /**
   * Body as an ARRAY of sentences, not one string. The key-details skill
   * needs to address individual sentences for multi-select questions, and
   * splitting prose at runtime is fragile.
   */
  sentences: z.array(z.string().min(1)).min(1),
  /** Indices into `sentences`. Drives the "key details" multi-select. */
  keySentences: z.array(z.number().int().min(0)),
  gradeLevel: z.string().min(1),
  sourceNote: z.string().min(1),
})
export type Passage = z.infer<typeof PassageSchema>

export const TextBundleSchema = z.object({ passages: z.array(PassageSchema) })
