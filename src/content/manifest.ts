import { ManifestSchema, type Skill, type Teacher } from './schemas'

/* ===========================================================================
   CONTENT MANIFEST - the single source of truth for the eight skills.
   ===========================================================================

   ENGLISH-FIRST (2026-10-01). Skill names, rules, and hints are in English.
   A Taglish pass is deferred until the education collaborators deliver local
   passages and reviewed Taglish hint copy. See the LANGUAGE DECISION block in
   world.ts. Skill NAMES are also the join key for `skillTested` on every
   question, so changing a name here means changing it in questions.ts too -
   the content test fails loudly if they drift apart.

   THE FIX for the reference project's biggest maintenance flaw: adding a skill
   there required editing seven separate places, and missing one caused a
   SILENT runtime failure (undefined hint, missing explanation, blank screen).
   Here, one array drives the skill cards, the lessons, the hints, the
   pre-test buckets, the earned pack, the statistics breakdown, and the report.

   Adding a ninth skill means adding ONE entry to `skills` below. The schema
   validation at the bottom fails loudly at boot if anything is missing.
   =========================================================================== */

export const SKILLS: Skill[] = [
  {
    id: 'text-type',
    name: 'Text Type',
    purpose: 'Learn to recognise what kind of text you are reading.',
    symbol: 'paper-fold',
    pup: {
      id: 'tala',
      name: 'Tala',
      accent: 'turquoise',
      breed: 'Shiba Inu',
      ears: 'small upright pointed triangular ears',
      cap: 'a small cream cap perched between the ears',
      outfit: 'a turquoise bandana and a round open-book badge',
      trait: 'bright turquoise, cheerful and curious, energetic posture',
    },
    rule: 'A news report tells about something that happened. A how-to gives steps to follow. A description shows what something is like. A narrative tells a story.',
    hint: 'Look at the shape of the text. Does it say "reported" or "reported in"? It can also be upside down.',
  },
  {
    id: 'purpose',
    name: 'Purpose',
    purpose: 'Learn why a text was written.',
    symbol: 'speech',
    pup: {
      id: 'pipoy',
      name: 'Pipoy',
      accent: 'violet',
      breed: 'Basset Hound',
      ears: 'very long low drooping ears that hang past the jaw',
      cap: 'a violet beret sitting between the long ears',
      outfit: 'a violet vest and a round badge',
      trait: 'deep violet, thoughtful and wise, head tilted as if listening',
    },
    rule: 'Four purposes: to inform, to persuade, to instruct, to entertain. Words like "according to" and "here is" often point to informing.',
    hint: 'Ask yourself: why was this written? To inform? To persuade? To instruct? To entertain?',
  },
  {
    id: 'main-topic',
    name: 'Main Topic',
    purpose: 'Learn what the whole text is about.',
    symbol: 'magnifier',
    pup: {
      id: 'max',
      name: 'Max',
      accent: 'yellow',
      breed: 'Golden Retriever',
      ears: 'medium floppy ears folded forward at the tips',
      cap: 'a navy flat cap worn forwards',
      outfit: 'a cream sweater and a round badge',
      trait: 'sunburst yellow, focused and precise, calm and observant',
    },
    rule: 'The title and the headings tell you the main topic. The last paragraph usually supports it too.',
    hint: 'Read the title and the headings first. What does the text keep coming back to?',
  },
  {
    id: 'key-details',
    name: 'Key Details',
    purpose: 'Mark which sentences carry the important information.',
    symbol: 'hand-point',
    pup: {
      id: 'kobe',
      name: 'Kobe',
      accent: 'lime',
      breed: 'English Pointer',
      ears: 'low-set medium-length floppy ears',
      cap: 'a lime cap worn backwards',
      outfit: 'a round badge only, no vest',
      trait: 'lime green, decisive, one front paw raised as if selecting',
    },
    rule: 'Key details carry a name, a place, a date, or a number. The rest is supporting detail and can be removed.',
    hint: 'Look for the name of a person or place, and for the date. The details are there.',
  },
  {
    id: 'sequence',
    name: 'Sequence',
    purpose: 'Put steps or events in the right order.',
    symbol: 'stepping-stones',
    pup: {
      id: 'scarlett',
      name: 'Scarlett',
      accent: 'indigo',
      breed: 'Rough Collie',
      ears: 'semi-erect ears tipped forward',
      cap: 'an indigo visor cap',
      outfit: 'a cream scarf and a round badge',
      trait: 'solid indigo, orderly and patient, standing neatly in sequence',
    },
    rule: 'Time markers guide you: first, next, then, after that, last. If there are none, follow the cause and effect.',
    hint: 'Look for the words "first", "then", and "last".',
  },
  {
    id: 'wh-questions',
    name: 'Wh-Questions',
    purpose: 'Find who, what, when, and where - usually in the first paragraph.',
    symbol: 'eye-bracket',
    pup: {
      id: 'waffle',
      name: 'Waffle',
      accent: 'navy',
      breed: 'Papillon',
      ears: 'huge fringed butterfly ears',
      cap: 'a navy cap fitted between the enormous fringed ears',
      outfit: 'a navy bow tie and a round badge',
      trait: 'navy blue, alert and watchful, upright and scanning',
    },
    rule: 'Who, what, when, where, why. In a news report almost all of them sit in the first paragraph. It is quick to read.',
    hint: 'Answer these: who? what? when? where? Each one is in the first paragraph.',
  },
  {
    id: 'fact-opinion',
    name: 'Fact or Opinion',
    purpose: 'Tell the truth apart from what the writer believes.',
    symbol: 'scale',
    pup: {
      id: 'franky',
      name: 'Franky',
      accent: 'cream',
      breed: 'Pug',
      ears: 'small rose-folded ears',
      cap: 'a cream cap perched on the crown of the head',
      outfit: 'a navy collar with a circular tag, no vest',
      trait: 'cream and white coat, navy outline, serious and balanced',
    },
    rule: 'A fact can be checked with data and a source. An opinion carries words like: I think, in my view, should, and the best.',
    hint: 'Check it: "according to the study" means fact. "I believe" means opinion.',
  },
  {
    id: 'characters',
    name: 'Characters',
    purpose: 'Work out who is speaking and who is being talked about.',
    symbol: 'speech-overlap',
    pup: {
      id: 'coco',
      name: 'Coco',
      accent: 'turquoise-deep',
      breed: 'Philippine Aspin',
      ears: 'semi-erect ears, one standing and one flopped',
      cap: 'a deep turquoise cap tilted back off the forehead',
      outfit: 'a deep turquoise bandana and a round badge',
      trait: 'deep turquoise, social and curious, head turned to one side',
    },
    rule: 'The voice of the writer, the person quoted, and the person being talked about can all be different. Check who is speaking before you answer.',
    hint: 'Check who is speaking, and who is being talked about.',
  },
]

/* ===========================================================================
   TEACHER REYES - character 9.

   She congratulates every success and speaks on retry. She is NOT a ninth
   skill: she owns no reading strategy, so she has no hint, no rule and no
   pre-test, and she never appears mid-quiz. She is a person in the room.

   ADDRESS IS A SINGLE CONSTANT. The user's education collaborator has been
   asked whether the learner's Grade 5 teacher is a woman or a man; a female
   teacher is assumed meanwhile. Confirm with the collaborator, then flip
   address below and change one string. Nothing else in the app reads it.
   =========================================================================== */

export const TEACHER = {
  id: 'teacher-reyes',
  name: 'Teacher Reyes',
  address: "Ma'am",
  accent: 'indigo',
  trait:
    'warm and encouraging, clipboard in hand, standing upright at the front of the room, open posture',
  holds: 'a clipboard and a wooden pointer, never a reading instrument',
} as const satisfies Teacher

/* ===========================================================================
   BOOT VALIDATION - fail loudly, at startup, not at click time.
   =========================================================================== */

const parsed = ManifestSchema.safeParse({ skills: SKILLS })

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  throw new Error(
    `QuizOn content manifest is invalid. Fix these before the app runs:\n${issues}`,
  )
}

const skillIds = new Set<string>()
const skillNames = new Set<string>()
for (const s of SKILLS) {
  if (skillIds.has(s.id)) throw new Error(`Duplicate skill id: ${s.id}`)
  if (skillNames.has(s.name)) throw new Error(`Duplicate skill name: ${s.name}`)
  skillIds.add(s.id)
  skillNames.add(s.name)
}

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<
  string,
  Skill
>
/** Lookup by name, because skillTested on a question holds the NAME. */
export const SKILL_BY_NAME = Object.fromEntries(SKILLS.map((s) => [s.name, s])) as Record<
  string,
  Skill
>
export const PUP_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.pup.id, s.pup]))
export const SKILL_IDS = SKILLS.map((s) => s.id)
export const SKILL_NAMES = SKILLS.map((s) => s.name)

/**
 * Skill id -> pup. Separate map from PUP_BY_ID because a caller asking "which
 * pup is this skill" is asking a different question from "what pup is this".
 */
export const PUP_BY_SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s.pup]))

/* --- Letter mnemonic, locked 2026-10-03 --------------------------------- */

/**
 * EVERY pup name starts with the same letter as the skill it teaches.
 * T Tala | P Pipoy | M Max | K Kobe | S Scarlett | W Waffle | F Franky
 * | C Coco
 *
 * This is why two skills were renamed. "Text Type" and "The 5W" both began
 * with T, and "The 5W" and "Who Is Who" both began with W, so three skills
 * competed for two letters and the mnemonic broke. Wh-Questions (W) and
 * Characters (C) give all eight a distinct letter.
 *
 * REVERSING EITHER RENAME RE-BREAKS THIS. Change the skill name and you must
 * change the pup name to match, or the memory hook stops working.
 */
export const SKILL_INITIALS = Object.fromEntries(SKILLS.map((s) => [s.id, s.name.charAt(0)])) as Record<
  string,
  string
>

const mismatched = SKILLS.filter((s) => s.pup.name.charAt(0).toUpperCase() !== s.name.charAt(0))
if (mismatched.length > 0) {
  const list = mismatched.map((s) => `${s.name} -> ${s.pup.name}`).join(', ')
  throw new Error(
    `Pup name must start with the same letter as its skill. Offenders: ${list}`,
  )
}

/* --- Cross-file referential integrity -----------------------------------
   WORLD.intro in world.ts references pups by id. That is a plain string in
   another module, so zod cannot catch a stale one, and a rename would have
   left the intro panels pointing at pups that no longer exist with no error
   anywhere. It already happened once: the panels still said kulay and sukat
   after the 2026-10-03 cast change. */

export function assertKnownPupId(pupId: string, where: string): void {
  if (!PUP_BY_ID[pupId]) {
    throw new Error(
      `${where} references pup "${pupId}", which is not in SKILLS. Known pups: ${Object.keys(PUP_BY_ID).join(', ')}`,
    )
  }
}