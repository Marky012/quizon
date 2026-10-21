import { TextBundleSchema, type Passage } from './schemas'

/* ===========================================================================
   SEEDED PASSAGES
   ===========================================================================
   ENGLISH-FIRST (2026-10-01). These passages are in English. A Taglish /
   Filipino version arrives only when the education collaborators supply
   reviewed local material - see the LANGUAGE DECISION block in world.ts and
   the outstanding-material list in System_Notes.txt.

   The education group owns the final content and will replace these through
   the fixed-column template agreed in the meeting brief. What is here is
   enough to demo the whole flow end to end, and it is written to the same
   spec the template uses, so swapping it is a data edit.

   LOCALIZATION: the settings are deliberately Quezon/Tagbina-adjacent -
   Agusan river country, palay (rice), tinola, coastal fishing. Real purok
   names are a later pass once the barangay confirms them.

   GRADE LEVEL: tuned to sit near DepEd Grade 5. Short sentences, one idea per
   sentence, controlled vocabulary, because uneven reading ability is a
   documented secondary cause in the education group's root-cause analysis.

   KEY SENTENCES: indexes into `sentences`, 0-based. They are the ones that
   carry a name, place, date, or number - the sentences a learner should mark
   as important. The content test enforces that these are real indexes.
   =========================================================================== */

export const PASSAGES: Passage[] = [
  {
    id: 'T1',
    title: 'Heavy Rains over Agusan Island',
    textType: 'news',
    purpose: 'inform',
    sentences: [
      'Heavy rain fell on Quezon, Tagbina, on Wednesday night.',
      'Several roads inside the town were flooded within two hours.',
      'Goods were being carried to the low-lying areas.',
      'No casualties have been reported in the town so far.',
      'The Barangay said not to travel to the flooded areas.',
    ],
    keySentences: [0, 1, 3, 4],
    gradeLevel: 'Grade 5',
    sourceNote: 'Seed text. Replace with a real local news item.',
  },
  {
    id: 'T2',
    title: 'Rice Price Drops at the Market',
    textType: 'news',
    purpose: 'inform',
    sentences: [
      'The price of rice fell at the Tagbina market on Wednesday.',
      'One kilo of ordinary rice now costs sixty pesos.',
      'It was seventy pesos per kilo before.',
      'It is not yet clear if the drop will continue next week.',
      'Farmers from other towns do not come to Quezon to buy.',
    ],
    keySentences: [0, 1, 2],
    gradeLevel: 'Grade 5',
    sourceNote: 'Seed text. Figures are illustrative, not real prices.',
  },
  {
    id: 'T3',
    title: 'How to Plant Rice',
    textType: 'howto',
    purpose: 'instruct',
    sentences: [
      'First, prepare a field wide enough for the rice plants.',
      'Second, soak the seeds in water one night before planting.',
      'Third, plant the seeds in rows one metre apart.',
      'Fourth, do not cover the seeds at first, because they must sprout.',
      'Fifth, after three days, add fertilizer and remove the extra water.',
    ],
    keySentences: [0, 1, 2, 4],
    gradeLevel: 'Grade 5',
    sourceNote: 'Seed text. Replace with a teacher-validated procedure.',
  },
  {
    id: 'T4',
    title: 'How to Cook Tinolang Bahay',
    textType: 'howto',
    purpose: 'instruct',
    sentences: [
      'First, wash three cups of rice and rinse it three times.',
      'Second, add one tablespoon of salt to the pot.',
      'Third, add three stalks of kalamansi leaves to the pot.',
      'Fourth, cover it tightly and boil over medium heat.',
      'Fifth, open the lid after one hour so the soup can settle.',
    ],
    keySentences: [0, 1, 2],
    gradeLevel: 'Grade 5',
    sourceNote: 'Seed text. Tinolang bahay is a real Surigao dish.',
  },
  {
    id: 'T5',
    title: 'The Agusan River',
    textType: 'description',
    purpose: 'inform',
    sentences: [
      'The Agusan River is a long river that runs through eastern Mindanao.',
      'Its water is clear and shallow for most of the year.',
      'The river swells because of heavy rain during the wet season.',
      'Many fish and shells can be seen in its water.',
      'Many people also depend on fishing for their living.',
    ],
    keySentences: [0, 1, 3, 4],
    gradeLevel: 'Grade 5',
    sourceNote: 'Seed text. Replace with a teacher-validated description.',
  },
  {
    id: 'T6',
    title: 'A Night by the Shore',
    textType: 'narrative',
    purpose: 'entertain',
    sentences: [
      'The shore of Quezon was quiet on that night.',
      'She stood near the sea, looking for the light on the road.',
      'She was still wearing the shirt with fish scales in the pocket.',
      'A new star suddenly shone above the water.',
      'She lay down and thought that they would only hear the news tomorrow.',
    ],
    keySentences: [0, 1, 4],
    gradeLevel: 'Grade 5',
    sourceNote: 'Seed text. Narrative exists to contrast with the other three types.',
  },
]

const parsed = TextBundleSchema.safeParse({ passages: PASSAGES })

if (!parsed.success) {
  throw new Error(
    `QuizOn passage bundle is invalid:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')}`,
  )
}

export const PASSAGE_BY_ID = Object.fromEntries(PASSAGES.map((p) => [p.id, p]))

/** Joined body text, for display. */
export function passageText(p: Passage): string {
  return p.sentences.join(' ')
}