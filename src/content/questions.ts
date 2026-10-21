import { BankSchema, type Question } from './schemas'
import { SKILL_NAMES } from './manifest'
import { PASSAGE_BY_ID } from './texts'
import { WORLD, TIER_ORDER, STORY_POOL_IDS } from './world'
import { S, o } from './questionParts'
import { easyExtra } from './questionsEasy'
import { mediumExtra } from './questionsMedium'
import { hardExtra } from './questionsHard'

/* ===========================================================================
   QUESTION BANK
   ===========================================================================
   ENGLISH-FIRST (2026-10-01). Every prompt, option, errorTag, and explanation
   below is in English, tuned to DepEd Grade 5: short sentences, one idea per
   sentence, controlled vocabulary. A Taglish / Filipino pass is DEFERRED until
   the education collaborators supply the real material - local passages and
   reviewed per-skill Taglish hint copy. See the LANGUAGE DECISION block in
   world.ts and the outstanding-material list in System_Notes.txt. Do not
   guess or machine-translate the Taglish layer: a wrong hint teaches a wrong
   rule.

   The education group owns the final content and will replace this through
   the fixed-column template from the meeting brief. What is here is a
   complete, playable seed.

   TWO RULES THAT DIFFER FROM THE REFERENCE PROJECT, ON PURPOSE:

   1. explanation is AUTHORED per question, in English, and says why THIS
      answer is right. The reference generated every explanation from a
      template that restated the rule no matter how the learner misapplied
      it, which flattered the learner and taught nothing.

   2. Every WRONG option carries an errorTag saying specifically what is wrong
      with it. On a wrong answer the app shows the errorTag as the
      "why your answer is wrong" line, so the feedback reads
      "A description only shows what one thing is like. This text has steps."
      instead of a generic restatement of the rule.

   skillTested holds the skill NAME and is the join key into the manifest, so
   the values in S below must match SKILL_NAMES exactly.
   =========================================================================== */

/* `S` and `o` now live in ./questionParts so the tier expansion files can use
   them too. See the note in that file about why they are not imported from
   here: these files import questions.ts's siblings, not questions.ts, but the
   direction still has to stay one-way to keep the graph acyclic. */

/* ===========================================================================
   PRE-TEST - 5 items per skill. A PERFECT 5/5 earns that skill's pup.
   Free, unlimited retries, so perfection is fair rather than punishing.
   =========================================================================== */

const preTest: Record<string, Question[]> = {
  [S.type]: [
    {
      id: 'PT_T1',
      skillTested: S.type,
      passageId: 'T1',
      prompt: 'What kind of text is "Heavy Rains over Agusan Island"?',
      options: [
        o('News Report'),
        o('How-To', 'A how-to gives steps. There are no steps here, only news.'),
        o('Description', 'A description only shows what something is like. This text reports something that happened, so it is news.'),
        o('Narrative', 'A narrative tells a story of events. This is straight news.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! It is a news report because it tells about something that happened on Wednesday night.',
    },
    {
      id: 'PT_T2',
      skillTested: S.type,
      passageId: 'T3',
      prompt: 'What kind of text is "How to Plant Rice"?',
      options: [
        o('News Report', 'A news report talks about something that happened. There is none here.'),
        o('How-To'),
        o('Description', 'A description only shows what one thing is like. This text has steps.'),
        o('Narrative', 'A narrative has a character and an action. This is only steps, one after another.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! It has "First, Second, Third". Those are clear steps in order.',
    },
    {
      id: 'PT_T3',
      skillTested: S.type,
      passageId: 'T5',
      prompt: 'What kind of text is "The Agusan River"?',
      options: [
        o('News Report', 'A news report gives a date and a place for an event. This one only describes.'),
        o('How-To', 'There are no steps in this text. It describes a river.'),
        o('Narrative', 'There is no character and no action here. It is a description.'),
        o('Description'),
      ],
      correctIndex: 3,
      explanation: 'Correct! It paints the shape and the state of the river. There is no event and no step here.',
    },
    {
      id: 'PT_T4',
      skillTested: S.type,
      passageId: 'T6',
      prompt: 'What kind of text is "A Night by the Shore"?',
      options: [
        o('News Report', 'It has no news date and no news place. It is a narrative.'),
        o('How-To', 'There are no steps. This is the story of one night.'),
        o('Description', 'It tells what happens. It does more than show one thing.'),
        o('Narrative'),
      ],
      correctIndex: 3,
      explanation: 'Correct! It has a character, a place (the shore), and things that happen. Those are the marks of a narrative.',
    },
    {
      id: 'PT_T5',
      skillTested: S.type,
      passageId: 'T4',
      prompt: 'What is the clearest sign that a text is a how-to?',
      options: [
        o('It has news in it', 'A news report gives a date and a place. This text gives steps.'),
        o('It talks about something that happened', 'This is one set of instructions after another, not news.'),
        o('It has numbered steps'),
        o('It only describes one thing', 'It teaches. It does not describe. The sign of a how-to is steps in order: first, second, third.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! Steps in order are the best clue. The numbers are only one way to show them.',
    },
  ],

  [S.purpose]: [
    {
      id: 'PT_P1',
      skillTested: S.purpose,
      passageId: 'T3',
      prompt: 'Why was "How to Plant Rice" written?',
      options: [
        o('To tell about events', 'No event is reported here. It teaches a method.'),
        o('To teach'),
        o('To please the reader', 'The purpose is practical. It teaches a task. It may be a little fun, but teaching is the main purpose.'),
        o('To make people buy', 'It has no view on why you should buy anything. It teaches.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The purpose is to teach. It says how to do a task.',
    },
    {
      id: 'PT_P2',
      skillTested: S.purpose,
      passageId: 'T2',
      prompt: 'What is the purpose of the news report "Rice Price Drops at the Market"?',
      options: [
        o('To report the change in the price'),
        o('To teach how to buy rice', 'It does not teach any buying process.'),
        o('To encourage people to harvest palay', 'It does not ask anyone to plant or to harvest.'),
        o('To please the reader', 'It is short and full of data. It is not written to please.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! It gives real figures about the price. Passing on facts like that is informing.',
    },
    {
      id: 'PT_P3',
      skillTested: S.purpose,
      passageId: 'T1',
      prompt: 'What is the purpose of "Heavy Rains over Agusan Island"?',
      options: [
        o('To teach the farmers', 'It does not teach any process.'),
        o('To report the event and give a warning'),
        o('To make people buy', 'There is no product in it that it is selling.'),
        o('To entertain the children', 'This news is about safety, not about fun.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! It tells what happened and it gives a warning. That is informing.',
    },
    {
      id: 'PT_P4',
      skillTested: S.purpose,
      passageId: 'T6',
      prompt: 'Why was the narrative "A Night by the Shore" written?',
      options: [
        o('To teach about travelling', 'There is no lesson and no instruction in it.'),
        o('To tell the price of fish', 'There is no price and no market data in it.'),
        o('To encourage planting', 'It does not teach how to plant anything.'),
        o('To entertain the reader'),
      ],
      correctIndex: 3,
      explanation: 'Correct! It is not pushing anything. Its purpose is only to let the reader enjoy the story.',
    },
    {
      id: 'PT_P5',
      skillTested: S.purpose,
      passageId: 'T5',
      prompt: 'If "The Agusan River" were turned into a news report, the purpose would change. What is the purpose now?',
      options: [
        o('To teach how to swim', 'It does not teach anyone how to swim.'),
        o('To tell about the qualities of the river'),
        o('To persuade the leaders', 'There is no opinion and no call in the text.'),
        o('To say that people should drink the water', 'It gives no advice at all to the reader.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! A description can still inform. But it does not teach and it does not persuade.',
    },
  ],

  [S.topic]: [
    {
      id: 'PT_M1',
      skillTested: S.topic,
      passageId: 'T1',
      prompt: 'What is the whole report "Heavy Rains over Agusan Island" about?',
      options: [
        o('About the price of rice', 'There is a different article about the price of rice.'),
        o('About the flooding caused by the heavy rain'),
        o('About the growth of fish in the Agusan River', 'Fish is not mentioned here.'),
        o('About teaching farming', 'This is a news report, not a how-to.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The title and the headings point to the rain and the flooding.',
    },
    {
      id: 'PT_M2',
      skillTested: S.topic,
      passageId: 'T2',
      prompt: 'What is the main topic of "Rice Price Drops at the Market"?',
      options: [
        o('The price of rice in Tagbina'),
        o('The farmers in Quezon', 'The farmers are only mentioned at the end. They are not the topic.'),
        o('The problem with the traffic', 'Traffic is not mentioned here.'),
        o('The kinds of rice', 'It does say "ordinary", but the topic is the price, not the kind.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! The price is mentioned again and again. That is the main topic.',
    },
    {
      id: 'PT_M3',
      skillTested: S.topic,
      passageId: 'T5',
      prompt: 'What does "The Agusan River" say all through the text?',
      options: [
        o('How to swim in the Agusan River', 'It gives no travel or swimming instruction.'),
        o('About the politics of Mindanao', 'It raises no political issue.'),
        o('About the Agusan River'),
        o('About the fish in Quezon', 'The fish is only one part of the description. It is not the topic.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! From the first line to the last, it is about the Agusan River.',
    },
    {
      id: 'PT_M4',
      skillTested: S.topic,
      passageId: 'T4',
      prompt: 'What is the main topic of "How to Cook Tinolang Bahay (a local Surigao chicken soup)"?',
      options: [
        o('The ingredients of tinola', 'Ingredients are used, but the topic is the cooking process.'),
        o('The history of tinola', 'There is no history in it. It is all instructions.'),
        o('The steps for cooking tinola'),
        o('The people in the kitchen', 'There is no character in the text.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! The text is one part of a process - cooking tinolang bahay.',
    },
    {
      id: 'PT_M5',
      skillTested: S.topic,
      passageId: 'T6',
      prompt: 'What is the main topic of "A Night by the Shore"?',
      options: [
        o('The journey on the Agusan River', 'It is not about a journey on the river.'),
        o('One night at the shore'),
        o('The kinds of fish', 'The kinds of fish are not mentioned.'),
        o('The weather forecast', 'Nothing else is discussed in the text. The topic is the night at the shore.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! It is about one night at the shore. That is the main topic.',
    },
  ],

  [S.details]: [
    {
      id: 'PT_D1',
      skillTested: S.details,
      passageId: 'T1',
      prompt: 'Which of these are KEY DETAILS in the report?',
      options: [
        o('Several roads inside the town were flooded within two hours.'),
        o('The Barangay said not to travel to the flooded areas.'),
        o('The weather will stay clear for three days.', 'This is not in the report. A detail must come from the text. It cannot be made up.'),
      ],
      correctIndices: [0, 1],
      explanation: 'Correct! The first two are real details from the report - the roads and the warning. The last one is not in the text.',
    },
    {
      id: 'PT_D2',
      skillTested: S.details,
      passageId: 'T2',
      prompt: 'Which detail has to do with the price of rice?',
      options: [
        o('The price of rice fell at the Tagbina market on Wednesday.'),
        o('It was seventy pesos per kilo before.'),
        o('Farmers from other towns do not come to Quezon to buy.', 'This is about the people, not the price. The detail must connect to what the question asks about.'),
      ],
      correctIndices: [0, 1],
      explanation: 'Correct! The first two have to do with the price. The last one is about the farmers, not the amount.',
    },
    {
      id: 'PT_D3',
      skillTested: S.details,
      passageId: 'T5',
      prompt: 'Which one is the MOST IMPORTANT in the description of the Agusan River?',
      options: [
        o('The water is clear and shallow for most of the year.'),
        o('The river swells because of the rain in the wet season.', 'That is true, but it only describes a change in one season. The biggest description is about the water itself.'),
        o('Many people also depend on fishing for their living.', 'That is about the people, not about the river itself. The question is about the state of the water.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! The state of the water comes first. That is where the shape of the river shows.',
    },
    {
      id: 'PT_D4',
      skillTested: S.details,
      passageId: 'T3',
      prompt: 'Which one is NOT needed to plant rice, according to the text?',
      options: [
        o('Prepare a field', 'This is the first step. It is needed.'),
        o('Soak the seeds in water', 'This is a step. It is needed.'),
        o('Buy a new tractor'),
        o('Plant the seeds in rows', 'This is a step. It is needed.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! There is no tractor in the text. It goes against what the text says.',
    },
    {
      id: 'PT_D5',
      skillTested: S.details,
      passageId: 'T4',
      prompt: 'Which detail tells us how long the tinola takes to cook?',
      options: [
        o('One tablespoon of salt', 'That is an ingredient, not a time.'),
        o('Put it on the fire', 'That is about heat, not about time.'),
        o('After one hour'),
        o('Three cups of rice', 'That is the amount of an ingredient, not the time.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! The time is the detail that says how long the cooking takes.',
    },
  ],

  [S.order]: [
    {
      id: 'PT_O1',
      skillTested: S.order,
      passageId: 'T3',
      prompt: 'Which is the FIRST step in planting palay (rice)?',
      options: [
        o('Soak the seeds in water', 'That is only the second step.'),
        o('Prepare a field'),
        o('Add fertilizer', 'That is the last step.'),
        o('Plant the seeds', 'That is only the third step.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The text says: "First, prepare a field."',
    },
    {
      id: 'PT_O2',
      skillTested: S.order,
      passageId: 'T3',
      prompt: 'Which is the LAST step?',
      options: [
        o('Plant the seeds', 'That is third. It is not the last.'),
        o('Prepare a field', 'That is first. It is not the last.'),
        o('Feed the animals', 'That step is not in the text.'),
        o('After three days, add fertilizer'),
      ],
      correctIndex: 3,
      explanation: 'Correct! The fifth step is the last one on the list.',
    },
    {
      id: 'PT_O3',
      skillTested: S.order,
      passageId: 'T4',
      prompt: 'What happens after you close the tinola tightly and cover it?',
      options: [
        o('Wait for it to thicken', 'That step is not in the text.'),
        o('Put it on the fire'),
        o('Soak the seeds in water', 'That is for palay, not for tinola.'),
        o('Wash the rice three times', 'That happens before you cover it.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! After you close the lid, the tinola is cooked over the fire.',
    },
    {
      id: 'PT_O4',
      skillTested: S.order,
      passageId: 'T4',
      prompt: 'Which is the LAST step in cooking tinola, according to the text?',
      options: [
        o('Add the tablespoon of salt', 'That is second. It is not the last.'),
        o('Add the kalamansi leaves (a small sour citrus fruit)', 'That is third. It is not the last.'),
        o('Wash the rice three times', 'That is first. It is not the last.'),
        o('Open the lid after one hour'),
      ],
      correctIndex: 3,
      explanation: 'Correct! Opening the lid after one hour is the last step.',
    },
    {
      id: 'PT_O5',
      skillTested: S.order,
      passageId: 'T1',
      prompt: 'What is the longest time mentioned in the report?',
      options: [
        o('Three days', 'That time is not in the report. It only says "within two hours".'),
        o('One hour', 'That time is not in the report. It only says "within two hours".'),
        o('Two hours'),
        o('One week', 'No week is mentioned in the report.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! The flooding lasted two hours. That is longer than one hour or three days.',
    },
  ],

  [S.fivew]: [
    {
      id: 'PT_W1',
      skillTested: S.fivew,
      passageId: 'T1',
      prompt: 'WHERE did it happen? According to the text, where did the rain fall?',
      options: [
        o('In Quezon, Tagbina'),
        o('At the Agusan River', 'The Agusan River is not mentioned in this report.'),
        o('At the Tagbina market', 'That is the place in the rice price report, not in the rain report.'),
        o('In Manila', 'Manila is not mentioned here.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! The first sentence says the rain "fell on Quezon, Tagbina".',
    },
    {
      id: 'PT_W2',
      skillTested: S.fivew,
      passageId: 'T1',
      prompt: 'WHEN did the report happen?',
      options: [
        o('Today', 'The text does not say it happened today.'),
        o('On Wednesday'),
        o('On Wednesday morning', 'The text says night, not morning.'),
        o('Last year', 'No year is mentioned.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The text says the rain fell on "Wednesday night".',
    },
    {
      id: 'PT_W3',
      skillTested: S.fivew,
      passageId: 'T2',
      prompt: 'WHAT did the report give the people?',
      options: [
        o('The kinds of rice', 'That is a kind, not news. The report does not say it.'),
        o('The price of rice'),
        o('The farmers of Quezon', 'The farmers are only mentioned at the end.'),
        o('The price of gasoline', 'Gasoline is not mentioned here.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The "what" here is the price of rice.',
    },
    {
      id: 'PT_W4',
      skillTested: S.fivew,
      passageId: 'T1',
      prompt: 'WHY did the Barangay warn the people?',
      options: [
        o('Because people need to buy rice', 'No need to buy rice is mentioned.'),
        o('Because the flooded place is wide and deep'),
        o('Because they have a new school', 'No school is mentioned.'),
        o('Because there is a river to drink from', 'That is not the reason for the warning.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The "why" is that the low area is already flooded.',
    },
    {
      id: 'PT_W5',
      skillTested: S.fivew,
      passageId: 'T2',
      prompt: 'WHERE did the information about the price of rice come from?',
      options: [
        o('From the Tagbina market'),
        o('From Quezon', 'Quezon is mentioned, but not as the source of the information.'),
        o('From the Agusan River', 'The Agusan River is not mentioned here.'),
        o('From Manila', 'Manila is not mentioned.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! The information came from the Tagbina market.',
    },
  ],

  [S.fact]: [
    {
      id: 'PT_F1',
      skillTested: S.fact,
      passageId: 'T2',
      prompt: 'Which one is a FACT?',
      options: [
        o('One kilo of ordinary rice now costs sixty pesos.'),
        o('I believe the rice is too expensive.', 'It has the words "I believe". That is an opinion.'),
        o('Rice should break in price.', 'It has "should" and "break". That is a view.'),
        o('Rice tastes better in other places.', 'That is about taste. It is an opinion.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! It is a number you can check. That makes it a fact.',
    },
    {
      id: 'PT_F2',
      skillTested: S.fact,
      passageId: 'T1',
      prompt: 'Which one is an OPINION in the report?',
      options: [
        o('Several roads inside the town were flooded within two hours.', 'That is data you can check. It is a fact.'),
        o('No casualties have been reported in the town so far.', 'That is a report from the authorities. It is a fact.'),
        o('The places along the shore are the most beautiful places in the whole Philippines.'),
        o('Do not travel to the flooded areas.', 'That is a warning from the Barangay. Inside the report it is a fact.'),
      ],
      correctIndex: 2,
      explanation: 'Correct! It has no data and it praises. That is the sign of an opinion.',
    },
    {
      id: 'PT_F3',
      skillTested: S.fact,
      passageId: 'T2',
      prompt: 'Which word is the best sign of an opinion?',
      options: [
        o('costs', 'That word is about data. It is not an opinion.'),
        o('believe'),
        o('pesos', 'That is the unit of money. It is a fact.'),
        o('Wednesday', 'That is the name of a day. It is a fact.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! "Believe" always shows a personal view. It is not data.',
    },
    {
      id: 'PT_F4',
      skillTested: S.fact,
      passageId: 'T2',
      prompt: 'The statement "It is not yet clear if the drop will continue" - what is that?',
      options: [
        o('An opinion', 'It is a fact. It says that nobody knows yet.'),
        o('A fact'),
        o('A view', 'It does not praise or blame anything. It only describes the situation.'),
        o('A question', 'It is a statement, not a question. It holds the word "if", but it is still a statement.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! It is a fact because it honestly says that nobody knows yet.',
    },
    {
      id: 'PT_F5',
      skillTested: S.fact,
      passageId: 'T1',
      prompt: 'Why is "Heavy rain fell" not an opinion?',
      options: [
        o('Because it has no word like "should"', 'That is not the reason. Many opinions have no "should" in them.'),
        o('Because it can be checked and reported'),
        o('Because it is in the first paragraph', 'That is not the reason. The first paragraph can hold an opinion too.'),
        o('Because it is the name of a place', 'Not that. "Quezon, Tagbina" is the name of the place, and that comes at the end.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! What we check is the data, not where it sits or how short it is.',
    },
  ],

  [S.who]: [
    {
      id: 'PT_C1',
      skillTested: S.who,
      passageId: 'T1',
      prompt: 'WHO ordered people not to travel to the flooded area?',
      options: [
        o('The readers', 'The readers only listen.'),
        o('The Barangay'),
        o('The goods', 'The goods are the ones being helped. They did not give the order.'),
        o('The farmers', 'No farmer who gave the order is named in the text.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The Barangay is the one that spoke, so it gave the order.',
    },
    {
      id: 'PT_C2',
      skillTested: S.who,
      passageId: 'T2',
      prompt: 'Who is the report "Rice Price Drops at the Market" meant for?',
      options: [
        o('The farmer in Quezon', 'The farmers are only mentioned at the end as the edge of the market. They are not the ones the report is for.'),
        o('The people who care about the price of rice'),
        o('The Tagbina market', 'The market is the source of the information, not the subject.'),
        o('The readers who will not buy', 'The news is for the people who want to buy, not for those who only watch and will not.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The news is for the people who care about the price - the buyers.',
    },
    {
      id: 'PT_C3',
      skillTested: S.who,
      passageId: 'T1',
      prompt: 'Who is the report talking about?',
      options: [
        o('The people in the low-lying areas'),
        o('The people in the high places', 'The news is for the ones hit by the flooding - the people in the low-lying areas.'),
        o('The ones waiting in line', 'The text names no character or group that is lining up.'),
        o('Only the people inside their houses', 'That is not who the report is about.'),
      ],
      correctIndex: 0,
      explanation: 'Correct! The news is for the people in the low-lying areas, because that is where the goods are being brought.',
    },
    {
      id: 'PT_C4',
      skillTested: S.who,
      passageId: 'T6',
      prompt: 'Whose voice speaks in "A Night by the Shore"?',
      options: [
        o('The reader', 'The reader is the one listening, not the one speaking.'),
        o('The character with the story'),
        o('The fish', 'The fish is only part of the scene.'),
        o('The stars', 'Only the stars are described. They do not speak.'),
      ],
      correctIndex: 1,
      explanation: 'Correct! The character is the voice in a narrative. Here, she is the one with the story.',
    },
    {
      id: 'PT_C5',
      skillTested: S.who,
      passageId: 'T6',
      prompt: 'Who is the narrative ABOUT?',
      options: [
        o('The journey on the Agusan River', 'The Agusan River is not mentioned here.'),
        o('The kinds of fish', 'The kinds of fish are not mentioned.'),
        o('One night at the shore', 'That is only the place. A narrative is about a person, not about a place.'),
        o('The character with the story'),
      ],
      correctIndex: 3,
      explanation: 'Correct! The character is the mark of a narrative. That is who the writer tells us about.',
    },
  ],
}

/* ===========================================================================
   QUIZ BANK
   ===========================================================================
   SEEDED AND DELIBERATELY THIN. Each tier needs enough items to draw
   WORLD.tiers[tier].itemCount without visible repetition, which needs
   roughly 300+ authored items across the three tiers. The education group
   supplies those through the template. The counts below are what a working
   demo needs so nothing crashes; bankSizeIsThin() warns the teacher UI.
   =========================================================================== */

const easy: Question[] = [
  {
    id: 'E001',
    skillTested: S.type,
    passageId: 'T1',
    prompt: 'What kind of text is this?',
    options: [
      o('News Report'),
      o('How-To', 'There are no steps here.'),
      o('Narrative', 'There is no character and no action.'),
      o('Description', 'It reports something that happened.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! It is a news report because it has a date, a place, and something that happened.',
  },
  {
    id: 'E002',
    skillTested: S.purpose,
    passageId: 'T2',
    prompt: 'The purpose of the text:',
    options: [
      o('To tell the price of rice'),
      o('To teach how to plant', 'It does not teach how to plant anything.'),
      o('To encourage families', 'It has no view about families.'),
      o('To entertain', 'The tone is serious and full of data.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! It gives data so that buyers will know.',
  },
  {
    id: 'E003',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'Which one matters most in the details of the report?',
    options: [
      o('Several roads inside the town were flooded within two hours.'),
      o('The Barangay said not to travel to the flooded areas.', 'True and related, but this one repeats a detail from another card. The most important one is the event itself - the roads flooding.'),
      o('It has nothing to do with the flooding.', 'Look again: the "roads" and the "flooded" are both results of the rain. This one is clearly related.'),
      o('It has nothing to do with helping the town.', 'The goods are what the Barangay is helping. It is related to how the town pulls together.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The roads flooding is the most important news here.',
  },
  {
    id: 'E004',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Which one is a fact?',
    options: [
      o('Rice is too expensive.', 'It has "too" and gives no source. That is a view.'),
      o('One kilo of rice now costs sixty pesos.'),
      o('I believe this is a big change.', 'It has "I believe". That is an opinion.'),
      o('Everyone should buy.', 'It has "should". That is an opinion.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! It is a number you can check at the market. That makes it a fact.',
  },
  {
    id: 'E005',
    skillTested: S.fivew,
    passageId: 'T1',
    prompt: 'When did the rain fall?',
    options: [
      o('This morning', 'The text says night, not morning.'),
      o('On Wednesday'),
      o('On Saturday', 'The text does not say Saturday.'),
      o('The text does not say', 'It does say: "on Wednesday night".'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The first sentence gives the day and the time.',
  },
  {
    id: 'E006',
    skillTested: S.topic,
    passageId: 'T4',
    prompt: 'What is the main topic of the text?',
    options: [
      o('The history of tinola', 'There is no history in it. It is only steps, one after another.'),
      o('The steps for cooking tinola'),
      o('The price of the ingredients', 'There is no price here. This is a how-to.'),
      o('The people in the kitchen', 'There is no character in the text.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The whole text is one set of cooking steps. Tinola is a local Surigao chicken soup, and that is the topic.',
  },
  {
    id: 'E007',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Which is the FIRST step in planting palay (rice)?',
    options: [
      o('Soak the seeds in water', 'That is only the second step.'),
      o('Prepare a field'),
      o('Add fertilizer', 'That is the last step.'),
      o('Plant the seeds', 'That is only the third step.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The text says: "First, prepare a field."',
  },
  {
    id: 'E008',
    skillTested: S.who,
    passageId: 'T1',
    prompt: 'Who ordered people not to travel to the flooded area?',
    options: [
      o('The goods', 'The goods are the ones being helped. They did not give the order.'),
      o('The Barangay'),
      o('The farmers', 'No farmer who gave the order is named in the text.'),
      o('The readers', 'The readers only listen.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The Barangay is the one that spoke, so it gave the order.',
  },
  {
    id: 'E009',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'What is the purpose of this text?',
    options: [
      o('To tell what happened and to warn the people'),
      o('To teach how to repair the roads', 'The text never gives repair steps. It only reports what happened and warns.'),
      o('To entertain the reader', 'The text is serious. It reports a flood, not a funny story.'),
      o('To make people buy rice', 'No product is being sold here. The text reports a flood.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first lines report what happened, and the last line is a warning from the Barangay. Reporting and warning is informing.',
  },
  {
    id: 'E010',
    skillTested: S.fact,
    passageId: 'T1',
    prompt: 'Which one is a fact from the report?',
    options: [
      o('No casualties have been reported in the town so far.'),
      o('The flood was the worst in the whole country.', 'The text never compares this flood with any other one. That is only a guess.'),
      o('The Barangay should send more helpers.', 'It has "should". That is an opinion, and no helper is mentioned.'),
      o('Everyone in Quezon stayed dry and safe.', 'Nobody is described as dry. The roads were flooded, so this goes past the text.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! "No casualties have been reported" can be checked with the authorities, so it is a fact and not a view.',
  },
  {
    id: 'E011',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'Which detail gives a NUMBER in this report?',
    options: [
      o('The price of rice fell at the Tagbina market on Wednesday.', 'This gives a day and a place. Look for the amount instead.'),
      o('One kilo of ordinary rice now costs sixty pesos.'),
      o('It is not yet clear if the drop will continue next week.', 'This gives a time, not a number. There is no amount in it.'),
      o('Farmers from other towns do not come to Quezon to buy.', 'No number here. It only says where the farmers do not go.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! One kilo and sixty pesos are numbers, and a key detail should carry a name, a place, a date, or a number.',
  },
  {
    id: 'E012',
    skillTested: S.fivew,
    passageId: 'T2',
    prompt: 'WHERE did the price of rice fall?',
    options: [
      o('At the Agusan River', 'The Agusan River is in a different text, the one that describes the river itself.'),
      o('In Quezon, Tagbina', 'Quezon and Tagbina are named in the text, but the market is where the price fell.'),
      o('At the Tagbina market'),
      o('In Manila', 'Manila is not named anywhere in this report.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The first sentence says the price fell "at the Tagbina market". That is the place.',
  },
  {
    id: 'E013',
    skillTested: S.topic,
    passageId: 'T2',
    prompt: 'What is this text mostly about?',
    options: [
      o('The price of rice in Tagbina'),
      o('How farmers catch fish', 'Fishing is not in this report. There is a separate text about the Agusan River.'),
      o('The roads that were flooded', 'The flooded roads are in a separate report about heavy rain.'),
      o('How to cook tinolang bahay', 'The cooking steps are in a separate how-to. This one gives amounts.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Nearly every sentence is about one thing: what rice costs at the Tagbina market.',
  },
  {
    id: 'E014',
    skillTested: S.type,
    passageId: 'T2',
    prompt: 'What kind of text is this?',
    options: [
      o('How-To', 'There are no steps to follow here, only a reported change and some figures.'),
      o('News Report'),
      o('Description', 'A description only shows what something is like. This text reports a change that happened.'),
      o('Narrative', 'A narrative has a character. No person is acting in this text.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! It reports something that happened and it names a day, so it is a news report.',
  },
  {
    id: 'E015',
    skillTested: S.type,
    passageId: 'T3',
    prompt: 'What kind of text is this?',
    options: [
      o('News Report', 'There is no date and no reported event here. It is one step after another.'),
      o('How-To'),
      o('Description', 'A description shows what something is like. This text tells you what to do.'),
      o('Narrative', 'There is no character and no story here, only instructions.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! Every sentence begins with a step word - First, Second, Third - so this text is a how-to.',
  },
  {
    id: 'E016',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'Which one is a step in this how-to?',
    options: [
      o('Buy a bag of fertilizer from the market.', 'No buying appears in the text. A step has to come from the instructions given.'),
      o('Ask the neighbours to help you dig.', 'No neighbour and no digging are mentioned anywhere in this text.'),
      o('Third, plant the seeds in rows one metre apart.'),
      o('Wait for the rainy season to end.', 'No rainy season is named here. Only the wet-season river text mentions one.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! It is one of the numbered steps, and it carries the number "one metre" that you can measure.',
  },
  {
    id: 'E017',
    skillTested: S.fact,
    passageId: 'T3',
    prompt: 'Which one is a fact?',
    options: [
      o('Rice grows better in a very deep field.', 'The text says nothing about how deep a field should be, so this cannot be checked.'),
      o('The seeds are planted in rows one metre apart.'),
      o('Everyone should plant rice in the wet season.', 'It has "should". That is an opinion, and no season is named for planting.'),
      o('Fertilizer is the best food for seeds.', 'It has "best". That is a personal view, and no figure from the text backs it.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! One metre is a measurement you can check, so this sentence is a fact and not an opinion.',
  },
  {
    id: 'E018',
    skillTested: S.topic,
    passageId: 'T3',
    prompt: 'What is the main topic of this text?',
    options: [
      o('How to plant rice'),
      o('The price of rice in the market', 'The price is in a separate news report. This text only gives steps.'),
      o('The kinds of fish in the river', 'Fish is not mentioned in this text at all.'),
      o('The history of palay farming', 'There is no history here. The text is only steps.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The title and all five steps are about one job: planting rice.',
  },
  {
    id: 'E019',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'Why was this how-to written?',
    options: [
      o('To teach the steps for planting rice'),
      o('To tell a funny story about rice', 'There is no character and no funny event. It is a set of instructions.'),
      o('To persuade people to buy rice', 'It never asks anyone to buy anything. It only gives steps.'),
      o('To report a flood in a field', 'No flood is reported here. The flood is in the heavy rain report.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A how-to is written so that the reader can do the task, and that task here is planting rice.',
  },
  {
    id: 'E020',
    skillTested: S.type,
    passageId: 'T4',
    prompt: 'What kind of text is this?',
    options: [
      o('How-To'),
      o('News Report', 'There is no date of an event here. It is one cooking step after another.'),
      o('Narrative', 'No person speaks and no story happens. It is only instructions.'),
      o('Description', 'A description shows what something is like. This text tells you what to do.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The words "First" and "Second" show the steps, and steps in order make a how-to.',
  },
  {
    id: 'E021',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'Which step comes after washing the rice?',
    options: [
      o('Add three stalks of kalamansi leaves.', 'That is the third step. It comes after the salt, not straight after the washing.'),
      o('Open the lid after one hour.', 'That is the fifth and last step, much later than washing the rice.'),
      o('Add one tablespoon of salt to the pot.'),
      o('Boil it over medium heat.', 'Boiling belongs to the fourth step. The step right after washing is adding salt.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! Washing the rice is first, and the very next step in the text is adding one tablespoon of salt.',
  },
  {
    id: 'E022',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'Which detail gives an AMOUNT in this how-to?',
    options: [
      o('Cover it tightly', 'That tells you what to do. It carries no amount at all.'),
      o('Boil over medium heat', 'Medium heat tells you how to cook it. It is not an amount to measure.'),
      o('Three cups of rice'),
      o('So the soup can settle', 'That tells why the lid is opened. It holds no amount and no number.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! Three cups is an amount you can measure, and key details carry numbers like this one.',
  },
  {
    id: 'E023',
    skillTested: S.fivew,
    passageId: 'T4',
    prompt: 'HOW LONG does the tinola cook before the lid is opened?',
    options: [
      o('Three times', 'That is how many times the rice is rinsed. It is not a cooking time.'),
      o('One night', 'A night appears in the rice-planting how-to. This tinola takes an hour, not a night.'),
      o('The text does not say', 'It does say it: "open the lid after one hour".'),
      o('One hour'),
    ],
    correctIndex: 3,
    explanation: 'Correct! The last step says to open the lid after one hour, so that is the cooking time.',
  },
  {
    id: 'E024',
    skillTested: S.purpose,
    passageId: 'T4',
    prompt: 'Why was this text written?',
    options: [
      o('To teach how to cook tinolang bahay'),
      o('To report that a dish was sold', 'Nothing about selling is in the text, and there is no reported event.'),
      o('To persuade people to eat kalamansi', 'It never asks anyone to eat anything. It only gives cooking steps.'),
      o('To describe what a river looks like', 'A river is in a different text. This one is a recipe in steps.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Tinolang bahay is a local Surigao soup, and the five steps teach the reader how to cook it.',
  },
  {
    id: 'E025',
    skillTested: S.type,
    passageId: 'T5',
    prompt: 'What kind of text is "The Agusan River"?',
    options: [
      o('News Report', 'There is no date and no reported event here. It only shows what the river is like.'),
      o('How-To', 'There are no steps in the text. It does not teach an action.'),
      o('Narrative', 'There is no character and no event. It shows one thing and its qualities.'),
      o('Description'),
    ],
    correctIndex: 3,
    explanation: 'Correct! The text shows what the river and its water are like, and that is what a description does.',
  },
  {
    id: 'E026',
    skillTested: S.purpose,
    passageId: 'T5',
    prompt: 'What is the purpose of this text?',
    options: [
      o('To tell the reader what the Agusan River is like'),
      o('To teach how to catch fish', 'It gives no fishing steps. It shows the river and says people fish in it.'),
      o('To persuade people to visit the river', 'There is no invitation and no opinion here. It only informs.'),
      o('To report an accident in the river', 'No accident is reported. The text describes the river in general.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Every sentence shows a quality of the river or of its water, so the purpose is to inform.',
  },
  {
    id: 'E027',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'Which detail tells us about the water of the river?',
    options: [
      o('Many people also depend on fishing for their living.', 'That is about the people and their work, not about the water itself.'),
      o('The river runs through eastern Mindanao.', 'That tells where the river is. The question is about the water.'),
      o('Its water is clear and shallow for most of the year.'),
      o('The river swells because of heavy rain.', 'That tells why the level changes. It does not describe the water you can see.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! It says the water is clear and shallow, and that is a description of the water itself.',
  },
  {
    id: 'E028',
    skillTested: S.fivew,
    passageId: 'T5',
    prompt: 'WHERE does the Agusan River run?',
    options: [
      o('Through Quezon, Tagbina', 'Quezon and Tagbina are named in the rain report and in the shore story, not here.'),
      o('Through eastern Mindanao'),
      o('At the Tagbina market', 'A market is not where a river runs. The market is in the rice price report.'),
      o('The text does not say', 'It does say it: the river "runs through eastern Mindanao".'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The first sentence gives the place for the river: eastern Mindanao.',
  },
  {
    id: 'E029',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Which one is a FACT?',
    options: [
      o('The water is clear and shallow for most of the year.'),
      o('The Agusan River is the most beautiful river in the world.', 'Nothing supports that. It praises and gives no source, so it is an opinion.'),
      o('People should not fish in the Agusan River.', 'It has "should" and no source. It is a view, and the text does not say it.'),
      o('I think the fish in the river taste wonderful.', 'It has "I think". That is a personal view, not something you can check.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Clear and shallow are qualities you can check by looking at the river, so this is a fact.',
  },
  {
    id: 'E030',
    skillTested: S.topic,
    passageId: 'T5',
    prompt: 'What is the main topic of this text?',
    options: [
      o('How to cook tinolang bahay', 'The cooking steps are in a separate how-to. There are no steps in this text.'),
      o('The price of rice at a market', 'The prices are in a separate news report. No amount is named here.'),
      o('The Agusan River'),
      o('One night at the shore', 'The night at the shore is a separate story, and it has a character in it.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! From the first line to the last, the text keeps coming back to the Agusan River.',
  },
  {
    id: 'E031',
    skillTested: S.type,
    passageId: 'T6',
    prompt: 'What kind of text is "A Night by the Shore"?',
    options: [
      o('News Report', 'There is no news date and no reported event. It tells a story instead.'),
      o('How-To', 'There are no steps to follow here, only things that happen.'),
      o('Description', 'A description only shows what one thing is like. This text has a character and events.'),
      o('Narrative'),
    ],
    correctIndex: 3,
    explanation: 'Correct! It has a character, a place, and things that happen to her, so it is a narrative.',
  },
  {
    id: 'E032',
    skillTested: S.purpose,
    passageId: 'T6',
    prompt: 'Why was this story written?',
    options: [
      o('To entertain the reader'),
      o('To teach how to cook fish', 'No cooking steps are in the story, and no dish is described.'),
      o('To report the price of fish', 'No price and no market appear anywhere in this text.'),
      o('To give instructions for planting rice', 'There is no step and no field in the story. It only tells one night.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Nothing is taught, sold, or reported here. The story is only there to be enjoyed.',
  },
  {
    id: 'E033',
    skillTested: S.who,
    passageId: 'T6',
    prompt: 'WHO is standing near the sea in this story?',
    options: [
      o('The reader', 'The reader only listens to the story. The reader is not the one by the sea.'),
      o('The writer', 'The writer tells the story but is not in the scene by the sea.'),
      o('She - the woman in the story'),
      o('The people who will hear the news', 'They are the ones she is thinking about. They are not the one standing there.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The story follows one woman, so she is the character who is standing near the sea.',
  },
  {
    id: 'E034',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'Which detail is a KEY detail in this story?',
    options: [
      o('The sky was full of bright stars that night.', 'There is only one new star in the story. Many bright stars are made up.'),
      o('The road was made of smooth white stones.', 'The road is only mentioned as a place with a light. It says nothing about stones.'),
      o('She stood near the sea, looking for the light on the road.'),
      o('She was carrying a heavy basket of fish.', 'She is wearing a shirt with fish scales in the pocket. She carries no basket.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! It holds a place and a clear action, so it is one of the key sentences of the story.',
  },
  {
    id: 'E035',
    skillTested: S.fivew,
    passageId: 'T6',
    prompt: 'WHERE does the story take place?',
    options: [
      o('In a rice field in Mindanao', 'No field and no rice are in this story. The field is in the planting how-to.'),
      o('At the shore of Quezon'),
      o('At the Tagbina market', 'The market is in the rice price report. This story is set at the shore.'),
      o('Inside a house in Manila', 'She does lie down, but the scene is by the sea. Manila is never named.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The first sentence places the scene at the shore of Quezon.',
  },
  {
    id: 'E036',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'What happens LAST in the story?',
    options: [
      o('A new star suddenly shines above the water.', 'That is the event just before she lies down. It is not the last thing.'),
      o('She lies down and thinks about the news tomorrow.'),
      o('She stands near the sea and looks for the light.', 'That happens at the start of the night, right after it is quiet.'),
      o('The shore of Quezon is quiet.', 'That is the first sentence. It is the beginning of the story, not the end.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The last sentence says she lay down and thought about the news, so that closes the story.',
  },
]

const medium: Question[] = [
  {
    id: 'M001',
    skillTested: S.topic,
    passageId: 'T1',
    prompt: 'What is the main topic?',
    options: [
      o('The journey along the river', 'The Agusan River is not mentioned here.'),
      o('The effects of the heavy rain'),
      o('The value of rice', 'There is a separate article about rice.'),
      o('The farmers', 'They are not mentioned in the article.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The title and the headings point to the rain and to what it caused.',
  },
  {
    id: 'M002',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Which is the right order of the first two steps?',
    options: [
      o('Plant, then prepare the field', 'No. Prepare the field first.'),
      o('Prepare the field, then soak the seeds'),
      o('Add fertilizer, then plant', 'Wrong. The fertilizer comes last.'),
      o('Soak the seeds, then prepare the field', 'No. Prepare the field first.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! First: prepare a field. Second: soak the seeds in water.',
  },
  {
    id: 'M003',
    skillTested: S.who,
    passageId: 'T1',
    prompt: 'Who leads the report - who gave the order and who is being helped?',
    options: [
      o('The Barangay gave the order; the people in the low-lying areas are being helped'),
      o('The people in the low-lying areas gave the order; the Barangay is being helped', 'The roles are swapped. The authority gave the order, not the ones affected.'),
      o('They are both being helped', 'No. They are two, and the roles differ: one gave the order, the other is being helped.'),
      o('They have nothing to do with each other', 'They are connected. The Barangay warns the people in the low-lying areas.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The authority gave the order, and the people in the low-lying areas are the ones being helped.',
  },
  {
    id: 'M004',
    skillTested: S.fact,
    passageId: 'T4',
    prompt: 'Which one is an opinion among the cooking steps?',
    options: [
      o('"Add one tablespoon of salt"', 'That is an instruction, not an opinion.'),
      o('"Add three stalks of kalamansi leaves"', 'That is an instruction, not an opinion.'),
      o('"The tinola tastes better with kalamansi"'),
      o('"Cover it tightly"', 'That is an instruction.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! "Tastes better if" is a personal view. It is not one of the steps.',
  },
  {
    id: 'M005',
    skillTested: S.purpose,
    passageId: 'T5',
    prompt: 'Why is the purpose of "The Agusan River" to inform?',
    options: [
      o('Because it has an invitation', 'It has no view and no call to invite anyone. It only informs.'),
      o('Because it only describes the state of the river'),
      o('Because it is a news report', 'It is a description, not a news report. It has no date and no event.'),
      o('Because it is very clear', 'How clear the text looks is not a sign of purpose. The meaning decides it, not the look.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! Describing the river aims to tell you its state, not to sell you a product.',
  },
  {
    id: 'M006',
    skillTested: S.type,
    passageId: 'T4',
    prompt: 'What kind of text is this?',
    options: [
      o('How-To'),
      o('News Report', 'There is no date or event here. It is one step after another.'),
      o('Narrative', 'There is no character and no action. It is only instructions.'),
      o('Description', 'It teaches a process. It does not describe a state.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! It has steps in order. That makes it a how-to.',
  },
  {
    id: 'M007',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'Which detail has to do with the price of rice? Choose all that apply.',
    options: [
      o('The price of rice fell at the Tagbina market on Wednesday.'),
      o('It was seventy pesos per kilo before.'),
      o('Farmers from other towns do not come to Quezon to buy.', 'This is about the people, not the price. It touches the market, but not the price itself.'),
    ],
    correctIndices: [0, 1],
    explanation: 'Correct! The first two have to do with the price. The last one is about the farmers.',
  },
  {
    id: 'M008',
    skillTested: S.fivew,
    passageId: 'T2',
    prompt: 'Which part is the "why" in the article? Why is the price not clear?',
    options: [
      o('Because people need to buy rice', 'No need to buy rice is mentioned. That answers "who", not "why".'),
      o('It is not yet clear if the drop will continue'),
      o('Because a new harvest came in', 'No product and no change in the supply is mentioned here.'),
      o('There is no reason given', 'It does say one: it is not yet clear if the drop will continue. That is the "why".'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The report explains why the price is still not certain. That is the "why".',
  },
  {
    id: 'M009',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'The report is about the flood. Which sentences are the KEY details? Choose all that apply.',
    options: [
      o('Heavy rain fell on Quezon, Tagbina, on Wednesday night.'),
      o('Goods were being carried to the low-lying areas.', 'That sentence carries no name, no place, no date, and no number. It is only supporting detail about the help.'),
      o('No casualties have been reported in the town so far.'),
      o('The Barangay said not to travel to the flooded areas.'),
    ],
    correctIndices: [0, 2, 3],
    explanation: 'Correct! The first, the fourth, and the fifth sentences carry the place, the day, the checkable news, and the warning. The sentence about the goods is only supporting detail.',
  },
  {
    id: 'M010',
    skillTested: S.fivew,
    passageId: 'T1',
    prompt: 'Read the whole report. WHO gave the warning, and WHERE was it about?',
    options: [
      o('The readers, and it is about the Tagbina market.', 'The market belongs to the rice price report. Nobody in this report is at a market.'),
      o('The Barangay, and it is about the flooded areas in Quezon, Tagbina.'),
      o('The Barangay, and it is about the roads in Manila.', 'The text names Quezon and Tagbina, never Manila. Read the place again.'),
      o('The farmers, and it is about the flooded areas.', 'No farmer gives the warning in this report. Only the Barangay is quoted.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The last sentence names the Barangay as the speaker, and the first sentence names Quezon and Tagbina as the place of the flood.',
  },
  {
    id: 'M011',
    skillTested: S.order,
    passageId: 'T1',
    prompt: 'A reader tells a friend the story of the flood. Which order is right?',
    options: [
      o('Barangay warned -> rain fell -> roads flooded', 'The warning comes last in the text. Nobody warns people before the rain falls.'),
      o('Rain fell -> roads flooded -> Barangay warned'),
      o('Roads flooded -> rain fell -> Barangay warned', 'The roads cannot flood before the rain falls. The cause comes before the effect.'),
      o('Rain fell -> Barangay warned -> roads flooded', 'The warning is only useful once the roads are flooded, so it cannot come second.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! Cause first - the rain falls. Then the effect - the roads flood. Only then does the Barangay warn people.',
  },
  {
    id: 'M012',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'The text is short and sounds like a description. Why do you read it as a news report?',
    options: [
      o('It reports a change in a place and a time, and it ends with a warning from the Barangay.'),
      o('Because it is short and has no character.', 'Many texts are short. Length alone never decides the text type.'),
      o('Because it describes the roads in detail.', 'A description only shows what something is like. The roads here are reported as news.'),
      o('Because it mentions water and rain.', 'The Agusan River text also mentions water and rain, and that one is a description.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A description would only show what a place is like. This text reports what happened on a day and then gives a warning.',
  },
  {
    id: 'M013',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Which sentence holds an OPINION dressed as a fact?',
    options: [
      o('Farmers from other towns do not come to Quezon to buy.', 'That is something the report can check. It belongs in a news report.'),
      o('Rice in Quezon is the cheapest rice in all of Mindanao.'),
      o('One kilo of ordinary rice now costs sixty pesos.', 'That is an amount you can check at the market. It is a fact.'),
      o('It was seventy pesos per kilo before.', 'That is the old amount from the report. It is a fact.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! "Cheapest in all of Mindanao" compares this price with every other place, and the text never makes that comparison. It sounds like a fact because it talks about price.',
  },
  {
    id: 'M014',
    skillTested: S.order,
    passageId: 'T2',
    prompt: 'A buyer wants the whole price story. Which order is right?',
    options: [
      o('Price fell -> sixty pesos now -> it was seventy pesos before -> not yet clear for next week'),
      o('Seventy pesos before -> price fell -> not yet clear -> sixty pesos now', 'The old price comes before the drop, and the doubt comes after the figures. This order scrambles all four.'),
      o('Price fell -> it was seventy pesos before -> sixty pesos now -> not yet clear', 'The seventy pesos is the price before the drop, so it must come before the sixty pesos.'),
      o('Not yet clear -> price fell -> seventy pesos before -> sixty pesos now', 'Nobody can doubt the drop before it is even reported. The report opens with the drop.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The report gives the drop first, then the new price, then the old price for comparison, and only then the doubt about next week.',
  },
  {
    id: 'M015',
    skillTested: S.who,
    passageId: 'T2',
    prompt: 'Who is this news meant to help, and why is the last sentence in the report?',
    options: [
      o('The buyers in Quezon; it warns them that the lower price may not last.'),
      o('The farmers from other towns; it tells them to stop selling rice.', 'The report never asks the farmers to do anything. It only says they do not come to buy.'),
      o('The buyers in Quezon; it tells them to go to Manila to buy rice.', 'Manila is never named, and a doubt about next week is not an invitation to travel.'),
      o('The Tagbina market; it tells the market to lower its prices again.', 'The market is where the price was checked. It is not the one being warned.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The buyers care most about the price, and the last sentence tells them the drop may not continue next week.',
  },
  {
    id: 'M016',
    skillTested: S.type,
    passageId: 'T2',
    prompt: 'This text and the flood report look similar. What makes this one a news report?',
    options: [
      o('It reports a change with a day and figures attached.'),
      o('It is about rice, and rice is always news.', 'The subject alone does not decide the type. A how-to about rice is still a how-to.'),
      o('It has five sentences, and a description must be shorter.', 'The number of sentences does not decide the text type at all.'),
      o('It mentions Quezon, so it must be a news report.', 'A place name alone is not enough. The shore story also names Quezon.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A reported change with a day and figures is what makes it news. The subject and the length prove nothing.',
  },
  {
    id: 'M017',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Put these three steps back in the order the text gives them.',
    options: [
      o('Plant them in rows -> soak the seeds -> do not cover them at first', 'Soaking is the second step, before planting. You cannot plant seeds that were not soaked.'),
      o('Do not cover them at first -> soak the seeds -> plant them in rows', 'Leaving the seeds open comes after planting. It is the fourth step, not the first.'),
      o('Soak the seeds -> plant them in rows -> do not cover them at first'),
      o('Soak the seeds -> do not cover them at first -> plant them in rows', 'Leaving the seeds open comes only after they are in the ground. Planting must come before that.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The text says soak second, plant third, and leave the seeds open fourth, so that is the only order that works.',
  },
  {
    id: 'M018',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'Why is the fourth step unusual - do not cover the seeds at first?',
    options: [
      o('The text gives a reason: the seeds must sprout.'),
      o('Because the seeds are too weak to hold soil.', 'The text never says the seeds are weak. It gives one reason: they must sprout.'),
      o('Because the field is too wet to cover.', 'Nothing about wetness is given. Only the sprouting is given.'),
      o('Because the fertilizer is not ready yet.', 'Fertilizer comes three days later. It has nothing to do with covering the seeds.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The fourth sentence says "do not cover the seeds at first, because they must sprout". That reason comes from the text itself.',
  },
  {
    id: 'M019',
    skillTested: S.fact,
    passageId: 'T3',
    prompt: 'Which of these is an opinion hidden inside a how-to?',
    options: [
      o('"Prepare a field wide enough for the rice plants."', 'That is one of the steps and it can be followed. It is not a view.'),
      o('"Soak the seeds in water one night before planting."', 'That is the second step, with a clear time in it.'),
      o('"Rice always grows best in a very wide field."'),
      o('"After three days, add fertilizer and remove the extra water."', 'That is the fifth step and it carries a number you can follow.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! "Always" and "best" claim more than the text does. Nobody in the five steps says that.',
  },
  {
    id: 'M020',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'Which sentences give the exact steps you must follow? Choose all that apply.',
    options: [
      o('First, prepare a field wide enough for the rice plants.'),
      o('Fourth, do not cover the seeds at first, because they must sprout.'),
      o('Rice farming is the oldest work in the Philippines.', 'That is not in the text at all. Only the numbered steps can be followed.'),
      o('Fifth, after three days, add fertilizer and remove the extra water.'),
    ],
    correctIndices: [0, 1, 3],
    explanation: 'Correct! The first, the fourth, and the fifth sentences are steps with something to measure or to do. The last sentence is not in this how-to.',
  },
  {
    id: 'M021',
    skillTested: S.who,
    passageId: 'T3',
    prompt: 'Nobody is speaking in this text. Then who is the reader, and who is doing the work?',
    options: [
      o('The reader is the farmer, and the farmer does the steps one at a time.'),
      o('The reader is the author, and the author plants the rice on the page.', 'The author writes the steps. Nobody on the page plants anything.'),
      o('The reader is a fertilizer seller, and the farmer buys the seeds.', 'No seller and no buying appear anywhere in this how-to.'),
      o('The reader is a child, and a teacher does the steps for them.', 'No teacher and no child appear in the text. The one acting is the reader.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A how-to has no character, so the reader is the one who acts. That person carries out all five steps.',
  },
  {
    id: 'M022',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'Put these three steps of tinolang bahay in the order the text gives them.',
    options: [
      o('Add kalamansi leaves -> add salt -> cover the pot and boil', 'The salt comes before the leaves. The text puts the salt in the second step.'),
      o('Cover the pot and boil -> add salt -> add kalamansi leaves', 'You cannot cover and boil first. The ingredients must already be in the pot.'),
      o('Add salt -> add kalamansi leaves -> cover the pot and boil'),
      o('Add salt -> cover the pot and boil -> add kalamansi leaves', 'The leaves go in before the pot is covered. Opening the lid later to add them is not a step here.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! Salt is second, the kalamansi leaves are third, and only then is the pot covered and boiled.',
  },
  {
    id: 'M023',
    skillTested: S.purpose,
    passageId: 'T4',
    prompt: 'The text never says "please cook this". Why is the purpose still to instruct?',
    options: [
      o('It gives amounts and times in a fixed order, which is what an instruction does.'),
      o('Because it mentions a dish that many people like.', 'Saying nothing about liking is the point. How well people like a dish cannot instruct anyone.'),
      o('Because it is short enough to read in one minute.', 'A text that short can be a news report too. Length never sets the purpose.'),
      o('Because it describes the taste of the soup.', 'No taste is described at all. The text is only about what to do.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! There is no need to say "please". Steps with amounts and times in order are already an instruction.',
  },
  {
    id: 'M024',
    skillTested: S.fivew,
    passageId: 'T4',
    prompt: 'Spread across the five steps, what is the WHO and the WHAT?',
    options: [
      o('The who is the kalamansi plant, and the what is making leaves.', 'Kalamansi leaves are an ingredient. A plant does not cook and it is not the actor.'),
      o('The who is the rice farmer, and the what is harvesting palay.', 'This is a cooking how-to. The rice here is washed, not harvested on a field.'),
      o('The who is the Barangay, and the what is a news warning.', 'The Barangay speaks in the flood report. It does not appear in this text.'),
      o('The who is the cook, and the what is cooking tinolang bahay.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! No name is given, so the reader is the cook, and the task the text is about is cooking tinolang bahay.',
  },
  {
    id: 'M025',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'Which amounts are the KEY details you need to cook it? Choose all that apply.',
    options: [
      o('One tablespoon of salt'),
      o('Three stalks of kalamansi leaves'),
      o('Four hours of boiling', 'The text boils it for one hour, not four. A detail has to match the text exactly.'),
      o('Three cups of rice'),
    ],
    correctIndices: [0, 1, 3],
    explanation: 'Correct! The three amounts in the text are cups, tablespoons, and stalks. The boiling time is one hour, so four hours is not a detail of this recipe.',
  },
  {
    id: 'M026',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'Which sentences are the KEY details of this description? Choose all that apply.',
    options: [
      o('The Agusan River is a long river that runs through eastern Mindanao.'),
      o('Its water is clear and shallow for most of the year.'),
      o('The river swells because of heavy rain during the wet season.', 'That sentence explains a cause. It carries no name, no place, and no number, so it is only supporting detail.'),
      o('Many fish and shells can be seen in its water.'),
    ],
    correctIndices: [0, 1, 3],
    explanation: 'Correct! The first, second, and fourth sentences carry the place, the quality of the water, and what lives in it. The swelling sentence only explains a cause.',
  },
  {
    id: 'M027',
    skillTested: S.type,
    passageId: 'T5',
    prompt: 'This text has no steps and no reported event. Why is it still not a how-to?',
    options: [
      o('It shows what the river is like; it never tells the reader to do anything.'),
      o('Because it is about water, and a water text is never a how-to.', 'The shore story also has water in it and is a narrative. The subject alone decides nothing.'),
      o('Because it has five sentences, and a how-to needs more.', 'The rice how-to has five sentences too. Count is not what makes a how-to.'),
      o('Because it mentions fish, and fish cannot be cooked.', 'Cooking fish is in a different text. Mentioning fish does not decide the type.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A how-to tells the reader to act. Nothing here asks you to do anything; the text only shows the river.',
  },
  {
    id: 'M028',
    skillTested: S.fivew,
    passageId: 'T5',
    prompt: 'The description has no day for an event. Which 5W is hardest to find, and what does the text give instead?',
    options: [
      o('Where; the text only says "for most of the year".', 'The place is given in the first sentence: eastern Mindanao. The time is the thin one here.'),
      o('When; the text only says "for most of the year" and "during the wet season".'),
      o('Who; the text only says "during the wet season".', 'No person acts in a description, so a missing "who" is normal, not the hardest one to notice.'),
      o('What; the text only says "for most of the year".', 'The text says plainly what it is: a long river. That is the easiest one to find.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! A description has no event day. All it gives is a season and "for most of the year", so "when" is the one you cannot pin down.',
  },
  {
    id: 'M029',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Which sentence is an OPINION dressed up like information?',
    options: [
      o('Many fish and shells can be seen in its water.', 'That is something you can look at in the river, so it is checkable and therefore a fact.'),
      o('The Agusan River is the best river to fish in.'),
      o('Its water is clear and shallow for most of the year.', 'Clear and shallow can be seen and measured. That is a fact, not a view.'),
      o('Many people also depend on fishing for their living.', 'How many people fish for a living can be counted or asked. That makes it a fact.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! "Best" is a personal judgement, and no source in the text supports it. It sounds like information because it talks about fishing.',
  },
  {
    id: 'M030',
    skillTested: S.order,
    passageId: 'T5',
    prompt: 'The description shows the river at different moments. Which order does the text give?',
    options: [
      o('It swells in the wet season -> the water is clear and shallow -> it is a long river', 'The swelling is the third sentence. The text opens with what and where the river is.'),
      o('The water is clear and shallow -> it swells in the wet season -> it is a long river', 'The name and the place of the river come first. A description opens with what the thing is.'),
      o('It is a long river in eastern Mindanao -> the water is clear and shallow -> it swells in the wet season'),
      o('It is a long river in eastern Mindanao -> it swells in the wet season -> the water is clear', 'The text describes the water before it explains the swelling. Read the second sentence again.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The text opens with what and where the river is, then shows the water, and only then explains the swelling.',
  },
  {
    id: 'M031',
    skillTested: S.type,
    passageId: 'T6',
    prompt: 'This text looks like a news report about a night. Why is it a narrative?',
    options: [
      o('It follows one character and what she does; no event is reported for the public.'),
      o('Because it mentions Quezon, and a Quezon text is a narrative.', 'The flood report also names Quezon, and that one is a news report.'),
      o('Because it is short and has no numbers.', 'Many news reports have no numbers. Length and figures do not decide the type.'),
      o('Because it says there is a star, and stars are only in stories.', 'The sky appears in news reports too. A star does not make a text a narrative.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A narrative follows a character. Nothing here is reported for the public, so it is a story and not news.',
  },
  {
    id: 'M032',
    skillTested: S.who,
    passageId: 'T6',
    prompt: 'The word "they" appears in the last sentence. Who is the story really about?',
    options: [
      o('The people who will hear the news; she is only watching the water.', 'She is the one who stands, looks, and lies down. The others are only thought about.'),
      o('The woman by the sea; "they" are the people who will hear the news.'),
      o('The star above the water; the woman is only the setting.', 'A star cannot think about tomorrow. The woman is the character with the story.'),
      o('The reader; "they" and "she" both point outside the text.', 'The reader is listening, not acting. Every action in the story belongs to her.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! She does everything in the story. "They" are people outside the scene who will only hear the news tomorrow.',
  },
  {
    id: 'M033',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'Which sentences are the KEY details of this story? Choose all that apply.',
    options: [
      o('The shore of Quezon was quiet on that night.'),
      o('She stood near the sea, looking for the light on the road.'),
      o('A new star suddenly shone above the water.', 'That is an event in the middle of the night, but it is not one of the key sentences of the story.'),
      o('She lay down and thought that they would only hear the news tomorrow.'),
    ],
    correctIndices: [0, 1, 3],
    explanation: 'Correct! The place and the quiet, her looking for the light, and her last thought are the key sentences. The star is part of the scene, not a key detail.',
  },
  {
    id: 'M034',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'The story moves through one night. Which order is right?',
    options: [
      o('She lies down -> the quiet shore -> she looks for the light -> the star shines', 'Lying down is the last thing she does. The shore being quiet opens the night.'),
      o('The star shines -> she looks for the light -> the quiet shore -> she lies down', 'The star shines in the middle of the night, after she is already standing and looking.'),
      o('Quiet shore -> she looks for the light -> the new star shines -> she lies down'),
      o('Quiet shore -> the new star shines -> she looks for the light -> she lies down', 'She is already looking for the light before the star appears. The text puts the star later.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The shore is quiet first, she stands and looks, the star shines after that, and lying down closes the night.',
  },
  {
    id: 'M035',
    skillTested: S.fact,
    passageId: 'T6',
    prompt: 'Which one of these is a fact that the story supports?',
    options: [
      o('She was waiting for a boat to arrive at the shore.', 'No boat is named anywhere. The story says nothing about leaving or arriving.'),
      o('The light on the road was a car coming to fetch her.', 'A light is named, but what made it is not. Guessing is not reading.'),
      o('She had already told them the good news.', 'The last line says the opposite: they would only hear the news tomorrow.'),
      o('She was still wearing the same shirt, with fish scales in the pocket.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! The story says she was still wearing that shirt, so it is a detail you can point to in the text.',
  },
  {
    id: 'M036',
    skillTested: S.fivew,
    passageId: 'T6',
    prompt: 'The wh-questions of this story are spread out. Which pair is NOT in the story?',
    options: [
      o('The who is only "she", and the why is never explained.'),
      o('The who is "she" and the where is "the shore of Quezon".', 'Both of those are given plainly in the first two sentences of the story.'),
      o('The where is "near the sea" and the what is "the light on the road".', 'Both are named in the second sentence of the story.'),
      o('The when is "on that night" and the what is "a new star".', 'Both are given, in the first sentence and in the fourth.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! She is never named, and the story never says why she is waiting or what the news is. Those two are the missing ones.',
  },
]

const hard: Question[] = [
  {
    id: 'H001',
    skillTested: S.purpose,
    passageId: 'T2',
    prompt: 'How do you know this text is meant to inform and not to persuade?',
    options: [
      o('Because it has an amount and a date.'),
      o('Because the writer has no opinion.', 'There really is no opinion, so it is only fact.'),
      o('Because it names a place.', 'That is a help, but it is not the reason.'),
      o('Because it is short.', 'The length of a text does not decide its purpose.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The price and the date are what an informative text rests on.',
  },
  {
    id: 'H002',
    skillTested: S.fact,
    passageId: 'T1',
    prompt: 'Study the report. Which one is a FACT, not an opinion?',
    options: [
      o('"Do not travel"'),
      o('"The places along the shore are the most beautiful places"', 'It praises a lot and gives no data. That is an opinion.'),
      o('"People should leave"', 'It has "should". That is the view of the writer, not an order from the authority.'),
      o('"The rain was bigger than before"', 'Nothing in the text backs it up. It is only a guess.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! "Do not travel" is an order from the Barangay inside the report. So inside the report it is a fact, not the opinion of the writer.',
  },
  {
    id: 'H003',
    skillTested: S.topic,
    passageId: 'T6',
    prompt: 'If you turned "A Night by the Shore" into a news report, what would the main topic be?',
    options: [
      o('The state of the shore', 'That is only described, not reported as news.'),
      o('The price of fish', 'Fish is only part of the scene. There is no price here.'),
      o('The experience of the character at the shore'),
      o('The stars', 'Only the stars are described. They are not the topic of a news report.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! A news report talks about something that happened. The story of the character would be the news if you wrote it that way.',
  },
  {
    id: 'H004',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'If the first step (washing the rice) was left out, what would happen to the later steps?',
    options: [
      o('Nothing would change. You could still cook.', 'Without washed rice there is no clean grain for the soup. You cannot leave that step out.'),
      o('The tinola would have too little salt', 'Even with too little salt, there would be no grain to base the tinola on.'),
      o('There would be no tinola to eat'),
      o('The tinola would be too sweet', 'No salt would be added and there would be no full grains. That is not the result.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The first step is the base of all the later ones. Without the rice, there is no full tinola.',
  },
  {
    id: 'H005',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'Which is the MOST convincing: does the detail matter to the report? Choose all that matter.',
    options: [
      o('Several roads inside the town were flooded within two hours.'),
      o('No casualties have been reported in the town so far.', 'That is true, but it does not connect to the incident itself. It is a general statement, not a detail.'),
      o('The Barangay said not to travel to the flooded areas.'),
    ],
    correctIndices: [0, 2],
    explanation: 'Correct! The first and the last describe the event directly. "Casualty" is only a general statement. It does not connect to the flooded road.',
  },
  {
    id: 'H006',
    skillTested: S.fivew,
    passageId: 'T2',
    prompt: 'What is the best way to find which wh-question is NOT clear in the article?',
    options: [
      o('Look for the "what" - because the article already answers almost all of the wh-questions.'),
      o('Look for the "why" - because it says it is not clear if the drop will continue', 'That is true and it is right in the text. Good understanding, but not the best method, because the text says it outright.'),
      o('Look for the "who" - because there is no name of a character', 'There is no need to do that. A news report has no character you must know.'),
      o('Look for the "where" - because there is no other province', 'The "where" is in the first sentence and it is clear.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The best one is the "what", because the article already answers almost all of the wh-questions. The item is rice, and that part is clear.',
  },
  {
    id: 'H007',
    skillTested: S.who,
    passageId: 'T6',
    prompt: 'In the narrative, who is speaking and who is the story about?',
    options: [
      o('Nobody speaks. Only the scene tells it.', 'There is a character who speaks. The voice is inside the scene.'),
      o('The reader speaks; the fish is the story', 'The reader only listens. The fish is part of the scene, not the topic.'),
      o('The character speaks, and the story is also about that character.'),
      o('The author speaks; the shore is the story', 'The author is not the voice of the text. The voice is the character.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The character is the voice, and their experience is what the story is about. This is the usual shape of a narrative.',
  },
  {
    id: 'H008',
    skillTested: S.type,
    passageId: 'T3',
    prompt: 'Why is "How to Plant Rice" a how-to and not a news report?',
    options: [
      o('It has a date for planting.', 'It has no date. It is steps in order.'),
      o('It has a price for the seeds.', 'It has no price. It is a how-to.'),
      o('The steps are in order and there is no event being reported.'),
      o('It talks about a place that is named.', 'Naming a place is not enough. A how-to has steps in order.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The two signs - steps in order and no reported event - are what make it a how-to.',
  },
  {
    id: 'H009',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'This looks like a story and it even ends with a command. How do you know the purpose is to inform?',
    options: [
      o('The command comes from the Barangay inside the report, and the rest is reported data.'),
      o('Because the text is short, and a short text cannot persuade.', 'Length decides nothing. A one-line advert can persuade perfectly well.'),
      o('Because a place name sits in the first sentence.', 'A place name also appears in the Agusan River description, which only informs by describing.'),
      o('Because nobody in the report is named.', 'Nobody is named in the rice price report either, and that is still an informative news report.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! "Do not travel" is the Barangay speaking, not the writer arguing. The writer only passes on what happened, so the purpose is to inform.',
  },
  {
    id: 'H010',
    skillTested: S.order,
    passageId: 'T1',
    prompt: 'The sentences were jumbled. Which order rebuilds the report correctly?',
    options: [
      o('Barangay warning -> rain fell -> roads flooded -> goods carried -> no casualties', 'The warning is the last sentence. Nobody warns people before the flood even happens.'),
      o('Rain fell -> roads flooded -> goods carried -> no casualties -> Barangay warning'),
      o('Rain fell -> goods carried -> roads flooded -> no casualties -> Barangay warning', 'The roads had to flood before goods could be carried to the low areas. The effect comes before the action.'),
      o('Roads flooded -> rain fell -> goods carried -> Barangay warning -> no casualties', 'The roads cannot flood first. The report opens with the cause, which is the rain.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! Read cause before effect: the rain falls, the roads flood, help goes in, the count of casualties is given, and the warning closes the report.',
  },
  {
    id: 'H011',
    skillTested: S.fivew,
    passageId: 'T1',
    prompt: 'The wh-questions are spread over the whole report. Which sentence carries the "why" behind the Barangay warning?',
    options: [
      o('"No casualties have been reported in the town so far."', 'That is the good news. It gives no reason for the warning at all.'),
      o('"The Barangay said not to travel to the flooded areas."', 'That is the warning itself. It does not say why it was given.'),
      o('"Heavy rain fell on Quezon, Tagbina, on Wednesday night."', 'That gives the cause of the flood, but the warning is about roads that are already under water.'),
      o('"Several roads inside the town were flooded within two hours."'),
    ],
    correctIndex: 3,
    explanation: 'Correct! The warning is about flooded roads, and the flooded roads are the reason. The two details sit in different parts of the report.',
  },
  {
    id: 'H012',
    skillTested: S.fact,
    passageId: 'T1',
    prompt: 'Which sentence is an OPINION in factual clothing, with no obvious marker at all?',
    options: [
      o('Goods were being carried to the low-lying areas.', 'Carrying goods to the low areas is something an observer can see and check.'),
      o('"The flood was the worst in the whole of eastern Mindanao."'),
      o('"Several roads inside the town were flooded within two hours."', 'The roads and the two hours can both be checked. That makes it a fact.'),
      o('"No casualties have been reported in the town so far."', 'It honestly says nobody has reported casualties, and that can be checked too.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! There is no "I think" and no "should" here, but "the worst in the whole of" is a comparison nobody in the text can support. That makes it an opinion.',
  },
  {
    id: 'H013',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Which one is an OPINION in factual clothing, with no marker word?',
    options: [
      o('"The price of rice fell at the Tagbina market on Wednesday."', 'A day and a place can both be checked at the market, so that one is a fact.'),
      o('"Ordinary rice in Tagbina is now the best deal in the province."'),
      o('"One kilo of ordinary rice now costs sixty pesos."', 'The amount and the kilo can be checked at the market. That makes it a fact.'),
      o('"It was seventy pesos per kilo before."', 'The old amount is given in the report and it can be compared. That is a fact.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! No marker word appears, but "the best deal in the province" needs a comparison the report never makes. Sixty pesos alone is only a fact about one kilo.',
  },
  {
    id: 'H014',
    skillTested: S.purpose,
    passageId: 'T2',
    prompt: 'This text sounds like an advert for cheap rice. Why is it a news report and not persuasion?',
    options: [
      o('It reports figures and admits the price may rise again; it never asks anyone to buy.'),
      o('Because it never uses the word "buy".', 'An advert can sell without the word "buy". Look at what the text actually does.'),
      o('Because cheap rice is good news for buyers, so it must be a report.', 'Pleasant reading is not a test. Plenty of persuasive texts are nice to read.'),
      o('Because it mentions farmers, and an advert never does.', 'An advert can easily talk about farmers in order to sell a product.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! A persuasive text pushes you toward a choice. This one only gives the numbers and admits the drop may not last.',
  },
  {
    id: 'H015',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'You have one line to report the price. Which detail must go in it?',
    options: [
      o('Farmers from other towns do not come to Quezon to buy.', 'It is a fact about the farmers, not about the price. It would not tell a reader what rice costs.'),
      o('It is not yet clear if the drop will continue next week.', 'That is a doubt about next week. It carries no amount for today.'),
      o('One kilo of ordinary rice now costs sixty pesos.'),
      o('The price of rice fell at the Tagbina market on Wednesday.', 'It gives the day and the place, but not the amount. A one-line price report needs the figure.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! Sixty pesos per kilo is the one detail that carries the amount, the kind of rice, and the quantity. The rest only adds context.',
  },
  {
    id: 'H016',
    skillTested: S.who,
    passageId: 'T2',
    prompt: 'A market, a set of buyers, and a set of farmers are all in play. Who is the report talking about?',
    options: [
      o('The farmers from other towns, because they are the last ones named.', 'The last sentence is not the topic. The price of rice is.'),
      o('The Tagbina market itself, because it is the place named first.', 'A place is never the subject of a report. It is only where the news was checked.'),
      o('Nobody in particular; it only reports a number.', 'A news report is written for someone. Here it is for the people who buy rice each week.'),
      o('The buyers at the Tagbina market, because the price is the news.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! The market is the source, the farmers are a side note, and the buyers are the ones who need the price. Those are the people the report serves.',
  },
  {
    id: 'H017',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Someone wrote the step cards in the wrong order. Which line fixes them?',
    options: [
      o('Soak the seeds one night -> prepare a field -> plant the seeds in rows', 'You need a field before you can soak seeds for planting. The field comes first.'),
      o('Prepare a field -> plant the seeds in rows -> soak the seeds one night', 'Soaking happens the night BEFORE planting. Planting cannot come before the soak.'),
      o('Plant the seeds in rows -> soak the seeds one night -> prepare a field', 'Nothing can be planted before the field exists and the seeds are soaked.'),
      o('Prepare a field -> soak the seeds one night -> plant the seeds in rows'),
    ],
    correctIndex: 3,
    explanation: 'Correct! The text numbers them first, second, third: field, soak, plant. Every other line breaks the soaking-before-planting rule.',
  },
  {
    id: 'H018',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'This text never says "you" and never says "please". Why is it still an instruction?',
    options: [
      o('It hands over a fixed order of actions to carry out, which is the whole job of a how-to.'),
      o('Because it is about farming, and a farming text is an instruction.', 'The Agusan River text is about fishing and only describes. The subject does not decide the purpose.'),
      o('Because every sentence begins with a step word.', 'The words help you, but the purpose comes from the actions being handed over, not from the wording.'),
      o('Because it is addressed to farmers, and farmers only read instructions.', 'No reader is named at all in the text, so nothing can be said about who is addressed.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The text never greets the reader, but it hands over five actions in order. Handing over actions is what instructs.',
  },
  {
    id: 'H019',
    skillTested: S.fact,
    passageId: 'T3',
    prompt: 'Which of these is an opinion that is dressed up to look like a step?',
    options: [
      o('"First, prepare a field wide enough for the rice plants."', 'That is exactly the first numbered step, so it can be followed as it stands.'),
      o('"Second, soak the seeds in water one night before planting."', 'That is the second numbered step and it carries a time you can set.'),
      o('"Third, plant the seeds in rows one metre apart."', 'That is the third numbered step and it carries a distance you can measure.'),
      o('"Fifth, add plenty of fertilizer, because more is always better."'),
    ],
    correctIndex: 3,
    explanation: 'Correct! "Plenty" and "more is always better" cannot be followed and cannot be checked, and "always" claims something about every farm. It reads like a step, so the trap works.',
  },
  {
    id: 'H020',
    skillTested: S.fivew,
    passageId: 'T3',
    prompt: 'For this how-to, which wh-question is genuinely missing?',
    options: [
      o('What; the text never says what planting is.', 'The title and the steps make the task plain. It is the "what" that is answered best here.'),
      o('Where; the text never names a single place.', 'No place is named, true, but the first step does say to prepare a field, so the "where" is hinted at.'),
      o('Why; the text never explains a single reason.', 'The fourth step does explain itself: the seeds must sprout. So a reason is given once.'),
      o('When and who; the text gives the task but no day and no name.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! Only "one night" and "after three days" are given as times, and no person is named. The task itself is stated very clearly.',
  },
  {
    id: 'H021',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'One card fell off the step list. Which sentence has to head the list?',
    options: [
      o('Second, soak the seeds in water one night before planting.', 'That is the second step. The question asks for the sentence that goes at the head of the list.'),
      o('Third, plant the seeds in rows one metre apart.', 'That is the third step. The first line of a how-to must be the first action.'),
      o('First, prepare a field wide enough for the rice plants.'),
      o('Sixth, harvest the rice with a machine.', 'There is no sixth step and no machine anywhere in this text. Only five steps are given.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! The list must start with the first action, which is preparing the field. A step that is not in the text cannot head the list.',
  },
  {
    id: 'H022',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'A cook wrote the steps out of order. Which line puts them right?',
    options: [
      o('Add kalamansi leaves -> wash the rice -> add salt -> cover and boil -> open the lid', 'The leaves come third. You wash the rice before any ingredient goes into the pot.'),
      o('Wash the rice -> cover and boil -> add salt -> add kalamansi leaves -> open the lid', 'You cannot cover and boil the pot before the salt and the leaves are already inside it.'),
      o('Open the lid after one hour -> wash the rice -> add salt -> add kalamansi leaves -> cover', 'Opening the lid is the fifth and last step. Nothing may be taken out first.'),
      o('Wash the rice -> add salt -> add kalamansi leaves -> cover and boil -> open the lid'),
    ],
    correctIndex: 3,
    explanation: 'Correct! First to fifth runs: wash, salt, leaves, cover and boil, then open the lid after one hour. Every other line breaks that chain.',
  },
  {
    id: 'H023',
    skillTested: S.fact,
    passageId: 'T4',
    prompt: 'Which line is a writer judgement in factual clothing, not a step you can follow?',
    options: [
      o('"Second, add one tablespoon of salt to the pot."', 'This is a numbered step with a measurement. You can follow it exactly.'),
      o('"Third, add three stalks of kalamansi leaves to the pot."', 'This is a numbered step with a number in it. You can follow it exactly.'),
      o('"Fifth, open the lid after one hour, because the soup always tastes better when it settles."'),
      o('"First, wash three cups of rice and rinse it three times."', 'This is a numbered step with an amount in it. You can follow it exactly.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! "Always tastes better" cannot be checked, and the text never says it. The other three are plain steps you can follow.',
  },
  {
    id: 'H024',
    skillTested: S.purpose,
    passageId: 'T4',
    prompt: 'The text sounds like a recipe card and a news report at the same time. What settles it?',
    options: [
      o('Nothing is reported as having happened on a day; the text only hands over actions to do.'),
      o('The three cups of rice settle it, because numbers mean news.', 'The rice how-to also carries numbers. A number never makes a text a report.'),
      o('The one hour settles it, because a time means news.', 'A cooking time inside a how-to is not a news date. Watch what happens, not what is counted.'),
      o('The dish name settles it, because a named dish is a headline.', 'A name in the title decides nothing. The Agusan River has a name in its title too.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! It is what the text does that settles it, not how many numbers it holds. It gives actions for you to do, so it instructs.',
  },
  {
    id: 'H025',
    skillTested: S.fivew,
    passageId: 'T4',
    prompt: 'Who is the cook in this text, and which wh-question is only partly given?',
    options: [
      o('The who is the writer of the recipe, and the when is completely missing.', 'The writer does not appear in the steps. The one acting is the reader.'),
      o('The who is the person selling kalamansi, and the when is missing.', 'No seller is named. The leaves are used in the text, never sold.'),
      o('The who is the Barangay, and the when is Wednesday night.', 'The Barangay and Wednesday night both come from the flood report, a different text.'),
      o('The who is the reader, and the when is only partly given, as one hour.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! No person is named, so the reader is the cook. The only time the text gives is the one hour of boiling.',
  },
  {
    id: 'H026',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'Three of these are amounts. Which one is the odd one out?',
    options: [
      o('First, wash three cups of rice and rinse it three times.', 'This gives an amount to measure - three cups. It belongs with the other amounts.'),
      o('Fifth, open the lid after one hour so the soup can settle.'),
      o('Second, add one tablespoon of salt to the pot.', 'This gives an amount to measure - one tablespoon. It belongs with the other amounts.'),
      o('Third, add three stalks of kalamansi leaves to the pot.', 'This gives a number to count - three stalks. It belongs with the other amounts.'),
    ],
    correctIndex: 1,
    explanation: 'Correct! The other three give amounts - cups, tablespoons, and stalks. The fifth gives a time instead, so it is the odd one out here.',
  },
  {
    id: 'H027',
    skillTested: S.type,
    passageId: 'T5',
    prompt: 'This text has no steps, no character, and no reported event. What kind of text is it?',
    options: [
      o('A narrative, because it ends by talking about people.', 'A narrative needs a character who acts. Nobody acts anywhere in this text.'),
      o('A how-to, because it explains why the river swells.', 'Explaining a cause is not handing over steps. Nothing here asks you to act.'),
      o('A description, because it shows what the river and its water are like.'),
      o('An instruction, because it names the wet season.', 'It names the wet season as a fact. It never tells you to do anything at all.'),
    ],
    correctIndex: 2,
    explanation: 'Correct! Showing what something is like, with nobody acting and nothing to do, is exactly what a description is.',
  },
  {
    id: 'H028',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Which of these is an OPINION dressed as information, with no marker word?',
    options: [
      o('The Agusan River is a long river that runs through eastern Mindanao.', 'The place and the shape can both be checked on a map. That makes it a fact.'),
      o('Its water is clear and shallow for most of the year.', 'Clear and shallow can be seen and measured on the river itself.'),
      o('Many fish and shells can be seen in its water.', 'What lives in the river is something you can look at, so it can be checked and it is a fact.'),
      o('The Agusan River is the safest and most beautiful river in the region.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! "Safest" and "most beautiful" are judgements with no source behind them. The other three can be seen or checked on the river itself.',
  },
  {
    id: 'H029',
    skillTested: S.fivew,
    passageId: 'T5',
    prompt: 'There is no date anywhere in this description. What does it give you instead of a "when"?',
    options: [
      o('A number of kilometres for the length of the river.', 'No measurement of length is given. The word "long" is not a number.'),
      o('The exact day the river was last checked.', 'No checking day is given anywhere in the text.'),
      o('A date for the last heavy rain.', 'No rain date is given. The river only swells "because of heavy rain", with no date attached.'),
      o('"For most of the year" and "during the wet season".'),
    ],
    correctIndex: 3,
    explanation: 'Correct! A description has no event day, so it offers a season and "for most of the year" in place of a date.',
  },
  {
    id: 'H030',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'Which sentence would you cut without losing what this description is about?',
    options: [
      o('The river swells because of heavy rain during the wet season.'),
      o('The Agusan River is a long river that runs through eastern Mindanao.', 'That sentence carries the name and the place of the river. Cut it and the text has no subject.'),
      o('Its water is clear and shallow for most of the year.', 'That is the clearest quality in the whole description. Losing it loses the river itself.'),
      o('Many fish and shells can be seen in its water.', 'What lives in the river is a key detail. Cut it and you lose what the river holds.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Cut the swelling sentence and you still have what it is, what the water is like, and what lives in it. Those are the heart of the description.',
  },
  {
    id: 'H031',
    skillTested: S.order,
    passageId: 'T5',
    prompt: 'The sentences were shuffled. Which order rebuilds the description?',
    options: [
      o('What lives in it -> who depends on it -> what and where the river is -> the water -> why it swells', 'The text opens with the river itself. The fish and the fishing are the last two ideas, not the first.'),
      o('What and where the river is -> why it swells -> the water -> what lives in it -> who depends on it', 'The text shows the water before it gives the cause. The swelling is the third sentence.'),
      o('The water -> what and where the river is -> what lives in it -> why it swells -> who depends on it', 'The water is described in the second sentence. You cannot show the water before naming the river.'),
      o('What and where the river is -> the water -> why it swells -> what lives in it -> who depends on it'),
    ],
    correctIndex: 3,
    explanation: 'Correct! A description opens with what the thing is and where it is, then shows it, then explains, then adds what it holds and who uses it.',
  },
  {
    id: 'H032',
    skillTested: S.purpose,
    passageId: 'T5',
    prompt: 'No sentence in this text asks you to do anything. How can the purpose still be to inform?',
    options: [
      o('It hands over checkable qualities - clear, shallow, long, eastern Mindanao - and that is informing.'),
      o('Because the text is short, and a short text can only inform.', 'A short advert persuades as well as a long one. Length decides nothing here.'),
      o('Because the word "people" appears near the end.', 'One word does not set a purpose. A text about people can also persuade.'),
      o('Because it never uses the word "should".', 'Many opinions have no "should" in them, so its absence proves nothing.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Informing means handing over true information. Clear, shallow, long, and eastern Mindanao are all checkable, so the purpose is to inform.',
  },
  {
    id: 'H033',
    skillTested: S.purpose,
    passageId: 'T6',
    prompt: 'It sounds like a news report, because it names a shore and something new in the sky. Why is it not news?',
    options: [
      o('Because news reports never mention stars.', 'A sky event can be reported in the news. The star is not what decides the type.'),
      o('Because the text gives no date.', 'The rice report has a day and this story has none, but a story with a date would still be a narrative.'),
      o('Because the text tells you what she felt.', 'It does not name a feeling. What decides it is who acts and what is reported.'),
      o('Nothing is reported for the public and nobody is named; it only follows one character through a night.'),
    ],
    correctIndex: 3,
    explanation: 'Correct! A news report tells the public that something happened. This one only follows a woman through one quiet night.',
  },
  {
    id: 'H034',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'The events of the night were jumbled. Which order rebuilds the story?',
    options: [
      o('She stands and looks -> the shore is quiet -> she lies down -> the new star shines', 'The shore being quiet is the opening line. The star shines before she lies down, not after.'),
      o('The shore is quiet -> the new star shines -> she stands and looks -> she lies down', 'She is already standing and looking for the light before the star appears. The star is the fourth sentence.'),
      o('She lies down -> the new star shines -> the shore is quiet -> she stands and looks', 'Lying down closes the night. It cannot be the opening event of the story.'),
      o('The shore is quiet -> she stands and looks for the light -> the new star shines -> she lies down'),
    ],
    correctIndex: 3,
    explanation: 'Correct! Read the night as the text builds it: a quiet shore, her standing and looking, the new star, and finally her lying down with her thought.',
  },
  {
    id: 'H035',
    skillTested: S.fact,
    passageId: 'T6',
    prompt: 'Which line is a judgement by the writer, not something the story shows?',
    options: [
      o('The quietest night the shore of Quezon has ever known.'),
      o('The shore of Quezon was quiet on that night.', 'The story says exactly that, so it is something you can point to. It is not a judgement.'),
      o('A new star suddenly shone above the water.', 'That is the event the story shows. It is what happened, not an opinion about it.'),
      o('She stood near the sea, looking for the light on the road.', 'The story shows her doing that. It is part of what happens, not a judgement.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! "Ever known" compares this night with every other night, and no one in the story could check that. It is the writer judging, not the story showing.',
  },
  {
    id: 'H036',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'Three people could be in play: the woman, the ones who will hear the news, and the reader. Which lines belong to the woman alone? Choose all that apply.',
    options: [
      o('She stood near the sea, looking for the light on the road.'),
      o('She was still wearing the shirt with fish scales in the pocket.'),
      o('They would only hear the news tomorrow.', 'This one is about the other people, the ones she calls "they". It is not something she does or wears.'),
      o('She lay down and thought that they would only hear the news tomorrow.'),
    ],
    correctIndices: [0, 1, 3],
    explanation: 'Correct! The first three lines are what she does, what she wears, and what she thinks. The last line is about the other people, which is why it is not hers.',
  },
]

/* ===========================================================================
   ASSEMBLY + VALIDATION
   =========================================================================== */

/* --- Flat authoring array -> per-story pools -----------------------------
   Questions are AUTHORED flat, with a `passageId` on each one, and grouped
   into one pool per story when the module loads. An author therefore writes a
   question and it automatically lands in the right story bucket, which is the
   whole point: a learner assigned T1 must only ever see T1 items, and that
   has to be impossible to get wrong by hand-editing.

   The grouping is also validated below - a question whose passageId names no
   bundled passage is a hard failure, so a typo cannot silently build an
   unreachable pool.                                                         */

function byPassage(items: Question[]): Record<string, Question[]> {
  const pools: Record<string, Question[]> = {}
  for (const q of items) {
    if (!q.passageId) {
      throw new Error(
        `Quiz item ${q.id} has no passageId. Every level item must belong to ` +
          `exactly one story, because each learner is assigned one story per level.`,
      )
    }
    ;(pools[q.passageId] ??= []).push(q)
  }
  return pools
}

const bank = {
  easy: byPassage([...easy, ...easyExtra]),
  medium: byPassage([...medium, ...mediumExtra]),
  hard: byPassage([...hard, ...hardExtra]),
  preTest: Object.fromEntries(
    SKILL_NAMES.map((name) => [name, preTest[name] ?? []]),
  ),
}

const parsed = BankSchema.safeParse(bank)

if (!parsed.success) {
  throw new Error(
    `QuizOn question bank is invalid:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')}`,
  )
}

/* --- Referential integrity, checked once at module load -----------------
   The reference had NO validation here, so a question referencing a skill
   name that no longer existed produced an undefined hint and a blank screen
   at click time. Fail immediately instead.                              */

for (const [skillName, list] of Object.entries(bank.preTest)) {
  if (list.length < 5) {
    throw new Error(
      `Pre-test for "${skillName}" has ${list.length} items; a perfect 5/5 must be possible.`,
    )
  }
}

for (const tierId of TIER_ORDER) {
  for (const [passageId, pool] of Object.entries(bank[tierId])) {
    if (!PASSAGE_BY_ID[passageId]) {
      throw new Error(
        `Tier "${tierId}" has a pool for unknown passage "${passageId}".`,
      )
    }
    for (const q of pool) {
      if (!SKILL_NAMES.includes(q.skillTested)) {
        throw new Error(`Question ${q.id} references unknown skill "${q.skillTested}"`)
      }
      // A pool must not hold items about a different story than its key, or a
      // learner assigned T1 would be served a T4 question.
      if (q.passageId !== passageId) {
        throw new Error(
          `Question ${q.id} sits in the "${passageId}" pool but its passageId is ` +
            `"${q.passageId}". Every item in a pool must belong to that story.`,
        )
      }
    }
  }
}

/* --- Every story in the pool must have a pool in every tier ---------------
   If a story is missing from one tier, a learner assigned that story in that
   level gets an empty quiz and a 0/20 with no explanation. That is a silent,
   total failure for that learner, so it fails loudly at boot instead.        */

const STORY_POOL = STORY_POOL_IDS

for (const tierId of TIER_ORDER) {
  for (const storyId of STORY_POOL) {
    if (!bank[tierId][storyId] || bank[tierId][storyId].length === 0) {
      throw new Error(
        `Tier "${tierId}" has no items for story "${storyId}". Every level needs ` +
          `items for all ${STORY_POOL.length} stories, because any of them can be assigned.`,
      )
    }
  }
}

for (const list of Object.values(bank.preTest)) {
  for (const q of list) {
    if (q.passageId && !PASSAGE_BY_ID[q.passageId]) {
      throw new Error(`Pre-test question ${q.id} references unknown passage "${q.passageId}"`)
    }
  }
}

/* --- errorTag must ONLY appear on wrong options ---------------------------
   An errorTag is rendered as "bakit mali ang sagot mo". If it ever sits on
   a CORRECT option, a learner who picks the right answer gets told the
   right answer is wrong. That is worse than no feedback, so it is a hard
   failure rather than a lint warning.                                 */

const allQuestions = [
  ...Object.values(bank.preTest).flat(),
  ...Object.values(bank.easy).flat(),
  ...Object.values(bank.medium).flat(),
  ...Object.values(bank.hard).flat(),
]

/* Collects EVERY problem before throwing, not just the first.

   This used to throw on the first bad item, which made authoring a large
   batch painful: you fix one question, re-run, and find the next one. With a
   252-item expansion that is 252 round trips. Reporting the whole list at once
   means one run tells you everything that is wrong. */
const itemProblems: string[] = []

for (const q of allQuestions) {
  const correct = new Set<number>([
    ...(q.correctIndex === undefined ? [] : [q.correctIndex]),
    ...(q.correctIndices ?? []),
  ])
  q.options.forEach((opt, i) => {
    if (opt.errorTag && correct.has(i)) {
      itemProblems.push(
        `Question ${q.id}: option ${i} ("${opt.text}") is marked correct but carries ` +
          `an errorTag. Feedback would tell a correct answer it is wrong.`,
      )
    }
  })
  if (correct.size === 0) {
    itemProblems.push(`Question ${q.id} has no correct option marked.`)
  }
  const tagged = q.options.filter((opt) => opt.errorTag).length
  if (q.options.length > 2 && tagged === 0) {
    itemProblems.push(
      `Question ${q.id} has ${q.options.length} options and no errorTags. ` +
        `Wrong options must explain what is specifically wrong with them.`,
    )
  }

  /* EVERY wrong option must carry its own errorTag, not merely ONE of them.

     The weaker "at least one tagged" rule passed a batch where seven wrong
     options had been silently stripped of their explanation. Nothing failed,
     because the questions still had other tagged options - but a learner
     picking one of those seven got no reason at all, which is the exact
     failure mode this file exists to prevent. Checked per option so a bulk
     edit cannot quietly remove one. */
  q.options.forEach((opt, i) => {
    if (!correct.has(i) && !opt.errorTag) {
      itemProblems.push(
        `Question ${q.id}: wrong option ${i} ("${opt.text}") has no errorTag. ` +
          `Every wrong option must say what is specifically wrong with it.`,
      )
    }
  })
  for (const i of correct) {
    if (i >= q.options.length) {
      itemProblems.push(
        `Question ${q.id}: correct option ${i} is out of range for ` +
          `${q.options.length} options.`,
      )
    }
  }
}

if (itemProblems.length > 0) {
  throw new Error(
    `QuizOn question bank has ${itemProblems.length} item problem(s):\n` +
      itemProblems.map((p) => `  - ${p}`).join('\n'),
  )
}

export const QUESTION_BANK = bank

/**
 * The shared story pool. Every level draws from these same six texts.
 *
 * Re-exported here for the many existing call sites and tests, but DEFINED in
 * world.ts - see the note there. Import it from '@/content/world' in anything on
 * the eager startup path.
 */
export { STORY_POOL_IDS }

/**
 * Per-story pools for a level: passageId -> items.
 * The shape `buildLevelQuiz` expects.
 */
export function getTierPools(tierId: 'easy' | 'medium' | 'hard'): Record<string, Question[]> {
  return bank[tierId]
}

/** The items for ONE story in ONE level. This is what a learner actually sees. */
export function getStoryQuestions(tierId: 'easy' | 'medium' | 'hard', storyId: string): Question[] {
  return bank[tierId][storyId] ?? []
}

/**
 * True when the assigned story cannot fill the level without repeating items.
 *
 * Reported to the teacher UI, never thrown. A thin pool is an authoring gap
 * that the education group is still filling; it must not block a learner from
 * playing while that happens.
 */
export function storyPoolIsThin(tierId: 'easy' | 'medium' | 'hard', storyId: string): boolean {
  return getStoryQuestions(tierId, storyId).length < (WORLD.tiers[tierId].itemCount ?? 0)
}

/** Item counts per story per tier, for the teacher/admin content view. */
export function bankCoverage(): Record<string, Record<string, number>> {
  return Object.fromEntries(
    TIER_ORDER.map((tierId) => [
      tierId,
      Object.fromEntries(
        STORY_POOL.map((storyId) => [storyId, getStoryQuestions(tierId, storyId).length]),
      ),
    ]),
  )
}

export function getPreTest(skillName: string): Question[] {
  return bank.preTest[skillName] ?? []
}