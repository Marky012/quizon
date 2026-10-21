/* ===========================================================================
   WORLD CONFIG - every place, level, and character name in one file.

   PLACE NAMES ARE BUILT FROM SPECIES_NAME, NOT TYPED AS LITERALS. The helpers
   were renamed Alon -> Woof on 2026-10-04 and "Alon School" existed as a bare
   string in four places, which is exactly the kind of copy that half-migrates.
   Import the word instead and a rename is one edit. See schemas.ts.
   ===========================================================================

   LANGUAGE DECISION (2026-10-01, user instruction)
   ----------------------------------------------
   ENGLISH-FIRST. The whole game ships in English for now. A Taglish / Filipino
   pass comes LATER, and only once the education collaborators supply the real
   material: local passages, per-skill Taglish hint copy, and a teacher review
   of the wording. Do not guess or machine-translate the Taglish layer - a wrong
   hint teaches a wrong rule. Until that material exists, this file and
   manifest.ts stay in English.

   WHAT TO CHANGE WHEN THE COLLABORATOR MATERIAL ARRIVES
   -----------------------------------------------------
   LOCALIZATION SWAP INSTRUCTIONS
   These names are PLACEHOLDERS. When the real Barangay Quezon, Tagbina
   names arrive (centre purok, landmarks, tourist spots), edit ONLY this file.
   No logic anywhere else references these strings, so the swap is a text edit
   and never a refactor. Search for `WORLD.` to find every consumer.

   The thing that must stay stable is the `id` fields - `SKILLS[].id`,
   `SKILLS[].pup.id` and the tier ids - because THOSE are what lands in
   persisted learner progress (gameStore, persist version 1).

   THE STAGE KEYS ARE NOT PERSISTED, despite what this file claimed until
   2026-10-05. It asserted that `training, preTest, arena, chronicle` were
   persisted identifiers, which made deleting a stage look like it needed a data
   migration. It does not: `StageIdSchema` exists only to derive the `Stage`
   type, and the sole consumer of that type is the local array in Hub.tsx.
   Nothing in the store ever reads a stage key. `preTest` was therefore deleted
   outright with no migration and no orphaned progress.

   DO NOT rename an `id` or a `pup.id` to localise. Those are persisted. Stage
   keys and display strings are free to change.
   =========================================================================== */

import { z } from 'zod'
import { SPECIES_NAME } from './schemas'

export const TierIdSchema = z.enum(['easy', 'medium', 'hard'])
/** Consumers import this as a TYPE. The zod value is `TierIdSchema`. */
export type TierId = z.infer<typeof TierIdSchema>
export type Tier = TierId

export const StageIdSchema = z.enum(['training', 'arena', 'chronicle'])
export type Stage = z.infer<typeof StageIdSchema>

/** Stable iteration order. The `id` values, not the display names. */
export const TIER_ORDER = ['easy', 'medium', 'hard'] as const

/**
 * The story ids any learner can be assigned.
 *
 * This lives in world.ts, not questions.ts, and that placement is load-bearing
 * for startup performance. The game store needs these six strings in order to
 * assign a story, and the store is imported by Boot - the first screen on every
 * visit. When this list lived in questions.ts, importing it dragged all 360
 * questions into the main chunk, because the module graph is all-or-nothing at
 * the import boundary. Here it costs nothing.
 *
 * If you find yourself wanting to import a question bank from the store or from
 * any eagerly-loaded module, do not. Make the question screen load the bank.
 */
export const STORY_POOL_IDS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'] as const

export const WORLD = {
  /* --- Brand ---------------------------------------------------------- */
  gameName: 'QuizOn!',
  subtitle: 'The Reading Quest',
  tagline: 'Learn to read the stories of our own town.',
  locality: 'Barangay Quezon, Tagbina',

  /* --- Hub stages -----------------------------------------------------
     THREE, since 2026-10-05. Pup Roster was deleted: the Hub now shows the
     earned pack sitting on the grass bench under the carousel, which is the
     roster, always visible, without a second screen to open. */
  stages: {
    training: {
      name: `${SPECIES_NAME} School`,
      description: 'Learn the eight reading skills.',
      order: 0,
    },
    arena: {
      name: 'Reading Trail',
      description: 'Walk through all three levels.',
      order: 1,
    },
    chronicle: {
      name: 'Your Record',
      description: 'Check how far you have come.',
      order: 2,
    },
  } as const,

  /* --- The three quiz tiers ---------------------------------------------
     THE QUIZ SHAPE (confirmed 2026-10-01)
     -------------------------------------
     Every level uses the SAME six core stories (the T1-T6 passages in
     texts.ts), which satisfies the "at least five stories or topics" bar.
     Each learner is randomly assigned exactly ONE story per level, and all
     20 items in that level's quiz are about that one story. The assignment is
     STORED, not re-rolled, so a retry re-sits the same story and the score
     means the same thing on the second attempt as on the first.

     The three levels differ in DEPTH ON THE SAME TEXT, not in which text:
       easy   - one skill per item, one obvious cue, stated in the text
       medium - two skills combined in one item, detail spans two paragraphs
       hard   - trap options that look plausible, cues implied not stated

     itemCount is 20 in all three tiers so the 70% pass mark is 14/20
     everywhere. Comparable scores are the point; a longer Hard quiz would
     make the three percentages mean different things.
     --------------------------------------------------------------------- */
  tiers: {
    easy: {
      id: 'easy' as const,
      name: 'Garden of Words',
      tagalog: 'Hardin ng Mga Salita',
      blurb: 'A quiet corner where every word has room to grow.',
      itemCount: 20,
      backdrop: '/assets/world/sky-easy.svg',
    },
    medium: {
      id: 'medium' as const,
      name: 'Canteen of Riddles',
      tagalog: 'Kanteen ng Mga Saloobin',
      blurb: 'Riddles on the tray. Read carefully before you answer.',
      itemCount: 20,
      backdrop: '/assets/world/forest-medium.svg',
    },
    hard: {
      id: 'hard' as const,
      name: 'Throne of Answers',
      tagalog: 'Angono ng Mga Sagot',
      blurb: 'Your turn to stand up and answer. Every word counts.',
      itemCount: 20,
      backdrop: '/assets/world/night-hard.svg',
    },
  } as const,

  /* --- No opponents, and why ---------------------------------------------
     Three named antagonists (Katabing the Distractor, Urong Panlahat,
     Balot ng Maling Sabit) were removed on 2026-10-03.

     They had two problems. They were never more than 6 unused blocks in
     world.ts, while costing 9 SVG files to draw. And every level named
     itself after terrain you fought ACROSS - Town of Stars, Forest of Fierce
     Wind, Summit of Night - which makes no sense with nothing to fight.

     THE TEACHING THEY DID WAS REAL AND IS NOT LOST. Each one stood for a
     specific reading failure:
       Katabing   -> sentences that do not belong      -> distractor options
       Urong      -> a headline that misleads          -> purpose distractors
       Balot      -> opinion passed off as fact        -> fact/opinion traps
     All three are now MECHANISM, not character. The errorTag field on every
     wrong option already says why that option is wrong, which is exactly
     what an antagonist blurb was gesturing at, and it is specific per
     option instead of per level.

     Result language is now pass / not yet. There is no lose state, because a
     learner who currently fails most items should not open the app and be
     told they lost.
     ---------------------------------------------------------------------- */

  /** The shared story pool every level draws from. Passages live in texts.ts. */
  storyPool: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'] as const,

  /* --- Story intro (3 panels) ----------------------------------------- */
  /* pupId values MUST match a pup id in manifest.ts. They were kulay/tala/
     sukat before the 2026-10-03 cast change and were left behind by it. */
  intro: [
    {
      title: 'A Storm Over Quezon',
      body: 'A strong storm came at night. The streetlights in the town went out, and we lost track of the news about our own village.',
      pupId: 'tala',
      backdrop: '/assets/world/sky-easy.svg',
    },
    {
      title: 'The Stories Fell Out of Order',
      body: 'The articles, the instructions, and the reports were all mixed up. We need to find out: why was each text written in the first place?',
      pupId: 'pipoy',
      backdrop: '/assets/world/forest-medium.svg',
    },
    {
      title: `The ${SPECIES_NAME} Pack`,
      body: `Eight ${SPECIES_NAME}s are on the move. Each one knows a different skill. Together they will visit every text and bring you back the right answer.`,
      pupId: 'max',
      backdrop: '/assets/world/night-hard.svg',
    },
  ] as const,
} as const

export type World = typeof WORLD