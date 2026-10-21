import type { Question } from './schemas'
import { S, o } from './questionParts'

/* ===========================================================================
   EASY TIER - EXPANSION (E037 - E120)

   Added 2026-10-04. The seed bank shipped 6 items per pool; the design calls for
   20 so a learner's Easy level never has to repeat itself. This file adds 14
   per story, which brings all six Easy pools to exactly 20.

   WHAT "EASY" MEANS HERE, stated once so the tier ladder stays honest:

   - The answer is stated in ONE sentence of the passage. A learner who can
     point at the line and read it gets it. No combining two sentences, no
     reasoning about why the writer chose a word.
   - Wording in the question closely matches wording in the passage. Easy does
     NOT mean babyish; it means findable.
   - Distractors are near-misses that a learner can rule out by looking again,
     not by knowing more than the text.

   Every question here is grounded in a sentence that actually exists in
   texts.ts. Nothing is invented about the river, the market or the storm: a
   question the passage cannot answer is a question with no correct option,
   and the item test in questions.ts throws at boot if that happens.

   Coverage rule for this file: each of the eight skills appears at least twice
   in every one of the six pools, so a learner assigned any story still meets
   every helper. 14 items over 8 skills = 2 each, with 2 left over per pool
   going to the skills that carry the most reading weight in that text.
   =========================================================================== */

export const easyExtra: Question[] = [
  /* ---------------------------------------------------------------------------
     T1 - "Heavy Rains over Agusan Island" (news, inform)
     A short disaster report. The natural Easy weight is on locating facts
     (who/where/when/how many) and on purpose, so details + purpose + wh- get
     the spare items.
     --------------------------------------------------------------------------- */
  {
    id: 'E037',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'How soon did the roads inside the town flood?',
    options: [
      o('Within two hours'),
      o('Within two days', 'The text says hours, not days. Read the line about the roads again.'),
      o('Within two minutes', 'The text says hours. Two minutes is not what the passage says.'),
      o('After three days', 'Three days appears later in the text, but it belongs to planting rice in T3, not to the flooding here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The passage says the roads were flooded "within two hours" of the rain starting.',
  },
  {
    id: 'E038',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'Why was this text written?',
    options: [
      o('To warn readers about the flood'),
      o('To entertain readers with a story', 'Nothing here is a story with a character. There is no lose state in this app and none in this text.'),
      o('To sell something to readers', 'There is no product being advertised here. Nothing is for sale.'),
      o('To give steps for a task', 'A how-to gives steps. This text has none, it only reports what happened.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The last line tells people not to travel to the flooded areas. A text that warns you is written to warn you.',
  },
  {
    id: 'E039',
    skillTested: S.fivew,
    passageId: 'T1',
    prompt: 'When did the heavy rain fall?',
    options: [
      o('Wednesday night'),
      o('Wednesday morning', 'The text says night, not morning. Look at the very first sentence.'),
      o('Tuesday night', 'The text names Wednesday. Tuesday is a different day.'),
      o('Three days later', 'Three days is not a time given for the rain. That number belongs to a different passage.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first sentence says the rain fell on Wednesday night.',
  },
  {
    id: 'E040',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'What had happened to the people in the town, according to the text?',
    options: [
      o('No casualties had been reported'),
      o('Many people were hurt', 'The text says no casualties have been reported. Read that line again before choosing.'),
      o('The roads were all closed', 'The text says roads were flooded. It does not say they were closed.'),
      o('The town lost all its goods', 'Goods were being carried to the low-lying areas. Nothing says they were lost.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text says no casualties have been reported in the town so far. So far is important, it means this may change.',
  },
  {
    id: 'E041',
    skillTested: S.who,
    passageId: 'T1',
    prompt: 'Who gave the instruction not to travel to the flooded areas?',
    options: [
      o('The Barangay'),
      o('The farmers', 'Farmers are mentioned in another passage about the market. They gave no instruction here.'),
      o('The news writer', 'The writer reports the instruction but is not the one who gave it.'),
      o('The bus drivers', 'No drivers appear anywhere in this passage.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The last sentence says the Barangay said not to travel to the flooded areas.',
  },
  {
    id: 'E042',
    skillTested: S.topic,
    passageId: 'T1',
    prompt: 'What is this text mostly about?',
    options: [
      o('Heavy rain and flooding in Quezon'),
      o('The price of rice at the market', 'That is the subject of T2, a different passage.'),
      o('How to plant rice', 'That is the subject of T3, a how-to with steps.'),
      o('A night by the shore', 'That is the subject of T6, a narrative.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Almost every line is about the rain, the flooded roads and the warning, so that is the main topic.',
  },
  {
    id: 'E043',
    skillTested: S.type,
    passageId: 'T1',
    prompt: 'Which text type is "Heavy Rains over Agusan Island"?',
    options: [
      o('News Report'),
      o('How-To', 'A how-to gives steps in order. This text has no steps at all.'),
      o('Description', 'A description only shows what something is like. This text reports an event that happened.'),
      o('Narrative', 'A narrative tells a story with a character. There is no character here, only a report.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It reports something that happened, and it names a day and a place, which is what news does.',
  },
  {
    id: 'E044',
    skillTested: S.order,
    passageId: 'T1',
    prompt: 'Which happened first?',
    options: [
      o('The heavy rain fell'),
      o('The roads were flooded', 'This happened after the rain. The passage lists the rain first, then the flooding.'),
      o('Goods were carried to the low-lying areas', 'Carrying the goods came after the flooding, not before it.'),
      o('The Barangay said not to travel', 'The instruction is the last event in the passage.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The rain came first, then the flooding, then carrying goods, then the warning.',
  },
  {
    id: 'E045',
    skillTested: S.fact,
    passageId: 'T1',
    prompt: 'Which statement about this text is a fact?',
    options: [
      o('The roads were flooded within two hours'),
      o('The rain was the worst in the whole island', 'Nothing in the text compares this storm to others. This is a guess, not a fact.'),
      o('People should have left earlier', 'That is an opinion about what people should do. The text makes no judgement like that.'),
      o('The town needs better roads', 'That is an opinion about what should be fixed. The text does not say it.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It can be checked against the passage, which states it directly. The others add judgements the writer never made.',
  },
  {
    id: 'E046',
    skillTested: S.fivew,
    passageId: 'T1',
    prompt: 'Where did the heavy rain fall?',
    options: [
      o('Quezon, Tagbina'),
      o('The Agusan River', 'The river is in a different passage about a description.'),
      o('The market in Tagbina', 'The market belongs to T2, about rice prices.'),
      o('Eastern Mindanao', 'That is where the river runs, not where this rain fell.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first sentence says the rain fell on Quezon, Tagbina.',
  },
  {
    id: 'E047',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'What were people doing with the goods?',
    options: [
      o('Carrying them to the low-lying areas'),
      o('Selling them at the market', 'Selling is what happens in T2. Here the goods were being carried.'),
      o('Storing them in a warehouse', 'No warehouse is mentioned anywhere in this passage.'),
      o('Throwing them away', 'Nothing says the goods were destroyed.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The passage says goods were being carried to the low-lying areas.',
  },
  {
    id: 'E048',
    skillTested: S.order,
    passageId: 'T1',
    prompt: 'Read the events in the order the text gives them. Which list is right?',
    options: [
      o('Rain, flooding, carrying goods, warning'),
      o('Warning, rain, flooding, carrying goods', 'The warning comes last in the passage, not first.'),
      o('Flooding, rain, warning, carrying goods', 'The rain came before the flooding. Reversing those two makes this wrong.'),
      o('Carrying goods, warning, rain, flooding', 'This reverses the whole passage.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! That is the order of the sentences, from the rain on Wednesday night to the instruction not to travel.',
  },
  {
    id: 'E049',
    skillTested: S.who,
    passageId: 'T1',
    prompt: 'Who is affected by the flooding in this text?',
    options: [
      o('The people of Quezon, Tagbina'),
      o('The readers of another country', 'The text is about one town, not about people far away.'),
      o('The farmers of other towns', 'Farmers from other towns appear in T2. They are not the ones affected here.'),
      o('Nobody at all', 'The roads flooded and the Barangay warned people. Someone was affected.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The rain fell on Quezon, Tagbina, and the town itself reported the flooding, so the people there are the ones affected.',
  },
  {
    id: 'E050',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'Why does the text say "so far" about the casualties?',
    options: [
      o('Because the information may still change'),
      o('Because many casualties were hidden', 'Nothing is hidden here. The text is a plain report.'),
      o('Because the writer was not sure of the town', 'The writer names the town clearly. So far is about the casualty count.'),
      o('Because the Barangay did not know', 'The Barangay is the one quoted later. So far is the writer being careful, not the Barangay guessing.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! "So far" tells you the report is only up to this moment, so more could be reported later.',
  },

  /* ---------------------------------------------------------------------------
     T2 - "Rice Price Drops at the Market" (news, inform)
     Numbers and a comparison. Easy weight goes to details and wh- questions,
     because that is what a market report is made of.
     --------------------------------------------------------------------------- */
  {
    id: 'E051',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'How much does one kilo of ordinary rice cost now?',
    options: [
      o('Sixty pesos'),
      o('Seventy pesos', 'Seventy pesos was the price BEFORE. The text says the price fell.'),
      o('Fifty pesos', 'Fifty pesos is not a figure that appears in this passage.'),
      o('One hundred pesos', 'One hundred pesos is not given anywhere in the text.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The text says one kilo of ordinary rice now costs sixty pesos.',
  },
  {
    id: 'E052',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'What was the price of rice before?',
    options: [
      o('Seventy pesos per kilo'),
      o('Sixty pesos per kilo', 'Sixty pesos is the price NOW. The before price was higher.'),
      o('Thirty pesos per kilo', 'Thirty pesos appears nowhere in the passage.'),
      o('Eighty pesos per kilo', 'Eighty pesos is not mentioned.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The text says it was seventy pesos per kilo before.',
  },
  {
    id: 'E053',
    skillTested: S.fivew,
    passageId: 'T2',
    prompt: 'Where did the price of rice fall?',
    options: [
      o('At the Tagbina market'),
      o('In Quezon town hall', 'The town hall is not mentioned. The market is.'),
      o('At the Agusan River', 'The river is a different passage, T5.'),
      o('In a school canteen', 'No canteen appears in this passage.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first sentence says the price fell at the Tagbina market.',
  },
  {
    id: 'E054',
    skillTested: S.topic,
    passageId: 'T2',
    prompt: 'What is this text mostly about?',
    options: [
      o('The drop in the price of rice'),
      o('Heavy rain in Quezon', 'That is T1.'),
      o('How to cook tinolang', 'That is T4, a how-to.'),
      o('The fish in the Agusan River', 'That is T5, a description.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Four of the five lines are about the price of rice and how it changed, so that is the topic.',
  },
  {
    id: 'E055',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'What does the text say about next week?',
    options: [
      o('It is not clear if the price drop will continue'),
      o('The price will rise again next week', 'The text says nothing certain about next week, and it does not predict a rise.'),
      o('The price will stay at sixty pesos', 'That is a promise the text does not make. It only says it is not clear.'),
      o('Farmers will bring more rice', 'Nothing about farmers bringing more rice is said here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text says it is not yet clear if the drop will continue next week. Not clear is the honest answer.',
  },
  {
    id: 'E056',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Which statement is a fact?',
    options: [
      o('One kilo of ordinary rice now costs sixty pesos'),
      o('Sixty pesos is a fair price for rice', 'That is an opinion. The text reports a number but never calls it fair.'),
      o('Farmers are losing money', 'The text says nothing about farmers earning or losing. That is a guess.'),
      o('The market should lower its prices more', 'That is an opinion about what the market should do.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! A fact can be checked against the passage. The other three add opinions or claims the text never made.',
  },
  {
    id: 'E057',
    skillTested: S.purpose,
    passageId: 'T2',
    prompt: 'Why was this text written?',
    options: [
      o('To inform readers about a change in price'),
      o('To persuade readers to buy rice', 'The text reports and does not argue. There is no call to buy anything.'),
      o('To instruct readers how to plant rice', 'That is T3, and it has steps. This has none.'),
      o('To tell a story about a farmer', 'There is no character and no story in this text.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It tells readers a price changed and gives the figures. That is informing.',
  },
  {
    id: 'E058',
    skillTested: S.fivew,
    passageId: 'T2',
    prompt: 'When did the price of rice fall?',
    options: [
      o('On Wednesday'),
      o('On Monday', 'The text names Wednesday only.'),
      o('Last year', 'No year is given, and last year is not in the text.'),
      o('Next week', 'Next week is mentioned but only as an unknown, not as when the drop happened.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first sentence says the price fell on Wednesday.',
  },
  {
    id: 'E059',
    skillTested: S.who,
    passageId: 'T2',
    prompt: 'Who does the text say does NOT come to Quezon to buy rice?',
    options: [
      o('Farmers from other towns'),
      o('The people of Quezon', 'The text does not say the people of Quezon stay away. They are the market they are in.'),
      o('The fishers of the river', 'No fishers appear in this passage at all.'),
      o('The students', 'No students are mentioned.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The last line says farmers from other towns do not come to Quezon to buy.',
  },
  {
    id: 'E060',
    skillTested: S.order,
    passageId: 'T2',
    prompt: 'What does the text mention right after the new price of sixty pesos?',
    options: [
      o('That it was seventy pesos before'),
      o('That farmers do not come to Quezon', 'That is the last line, not the one right after the price.'),
      o('That the market is in Tagbina', 'The market is named in the first sentence, before the prices.'),
      o('That the price may rise next week', 'The text says it is not clear if the drop will continue. It does not say the price will rise.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The old price comes straight after the new one, which is how a report shows that a price changed.',
  },
  {
    id: 'E061',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'By how much did the price drop?',
    options: [
      o('Ten pesos'),
      o('Twenty pesos', 'The drop is from seventy to sixty, which is ten pesos, not twenty.'),
      o('Five pesos', 'Five pesos is not the difference between seventy and sixty.'),
      o('Sixty pesos', 'Sixty is the new price, not the amount of the drop.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Seventy pesos before minus sixty pesos now equals a drop of ten pesos per kilo.',
  },
  {
    id: 'E062',
    skillTested: S.type,
    passageId: 'T2',
    prompt: 'Which text type is "Rice Price Drops at the Market"?',
    options: [
      o('News Report'),
      o('How-To', 'There are no steps here, only a report of a price change.'),
      o('Narrative', 'No character does anything in this text.'),
      o('Description', 'It does not paint what the market looks like.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! A news report tells about something that happened, and this tells about a price falling on Wednesday.',
  },
  {
    id: 'E063',
    skillTested: S.who,
    passageId: 'T2',
    prompt: 'Who buys rice at the Tagbina market, according to this text?',
    options: [
      o('People who live in Quezon'),
      o('Only farmers from other towns', 'The text says the opposite. Farmers from other towns do not come.'),
      o('Nobody at all', 'A market where a price changed has buyers. The text only excludes farmers from other towns.'),
      o('Only the fishers', 'No fishers are mentioned in this passage.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text excludes farmers from other towns, so the buyers it points to are the people of Quezon.',
  },
  {
    id: 'E064',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Which of these can be checked against the text?',
    options: [
      o('The price was seventy pesos before'),
      o('The market is well managed', 'Nobody says that about the market. It cannot be checked.'),
      o('Rice is healthy food', 'That may be true, but this text does not say it, so it cannot be checked here.'),
      o('Farmers should sell more rice', 'That is an opinion, and the text does not say it.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Only the first one is written in the passage. The others are opinions or outside knowledge.',
  },

  /* ---------------------------------------------------------------------------
     T3 - "How to Plant Rice" (howto, instruct)
     All five sentences are numbered steps. Easy weight goes to sequence and
     wh-, which is what a how-to is made of.
     --------------------------------------------------------------------------- */
  {
    id: 'E065',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Which step comes third?',
    options: [
      o('Plant the seeds in rows one metre apart'),
      o('Prepare a field', 'Preparing the field is the first step.'),
      o('Soak the seeds in water', 'Soaking is the second step.'),
      o('Add fertilizer after three days', 'Fertilizer is the fifth and last step.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! First prepare, second soak, third plant in rows.',
  },
  {
    id: 'E066',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Which step comes last?',
    options: [
      o('Add fertilizer and remove the extra water'),
      o('Prepare a field', 'Preparing the field is the first step.'),
      o('Soak the seeds one night', 'Soaking is the second step.'),
      o('Plant the seeds in rows', 'Planting is the third step.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Fifth comes after three days: add fertilizer and remove the extra water. That is the last step.',
  },
  {
    id: 'E067',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'How long should the seeds be soaked?',
    options: [
      o('One night'),
      o('Three days', 'Three days is when fertilizer is added, not how long the seeds are soaked.'),
      o('One week', 'One week is not mentioned anywhere in this how-to.'),
      o('Three hours', 'The text says one night, not a few hours.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The second step says to soak the seeds in water one night before planting.',
  },
  {
    id: 'E068',
    skillTested: S.fivew,
    passageId: 'T3',
    prompt: 'How far apart should the seeds be planted?',
    options: [
      o('One metre apart'),
      o('One inch apart', 'The text says one metre, not one inch.'),
      o('Three metres apart', 'Three days is a time, not a distance. Nothing here says three metres.'),
      o('Ten metres apart', 'Ten metres is not in the passage.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The third step says to plant the seeds in rows one metre apart.',
  },
  {
    id: 'E069',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'Why was this text written?',
    options: [
      o('To tell readers how to plant rice'),
      o('To report that rice prices fell', 'That is T2, a news report about the market.'),
      o('To describe a river', 'That is T5, and there is no river in this text.'),
      o('To persuade readers to buy rice', 'There is no argument and nothing being sold here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It is a how-to. The words First, Second, Third tell you it is meant to be followed step by step.',
  },
  {
    id: 'E070',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'Why should the seeds not be covered at first?',
    options: [
      o('Because they must sprout'),
      o('Because fertilizer is too strong', 'Fertilizer is added later, on the fifth step. That is not the reason.'),
      o('Because the field is too small', 'The field only needs to be wide enough. Size is not the reason.'),
      o('Because birds will eat them', 'No birds are mentioned anywhere in this how-to.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The fourth step gives the reason: the seeds must sprout, so do not cover them yet.',
  },
  {
    id: 'E071',
    skillTested: S.type,
    passageId: 'T3',
    prompt: 'How can you tell this text is a how-to?',
    options: [
      o('It uses the words First, Second, Third, Fourth and Fifth'),
      o('It describes what a rice plant looks like', 'Nothing here describes appearance. That would be a description.'),
      o('It reports an event on a named day', 'No day is named, and no event is reported. That would be news.'),
      o('It tells a story about a farmer', 'There is no character and no action in this text.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Step words in order are the clearest signal of a how-to, and this text uses five of them.',
  },
  {
    id: 'E072',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'You have just soaked the seeds. What do you do next?',
    options: [
      o('Plant them in rows one metre apart'),
      o('Add fertilizer', 'Fertilizer comes after three days, much later. It is not the next step.'),
      o('Prepare the field', 'The field is prepared first, before soaking.'),
      o('Remove the extra water', 'Removing water is part of the last step, after the seeds have sprouted.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Step two is soaking and step three is planting in rows, so planting comes next.',
  },
  {
    id: 'E073',
    skillTested: S.fact,
    passageId: 'T3',
    prompt: 'Which statement about this text is a fact?',
    options: [
      o('The text gives five steps'),
      o('Planting rice is easy work', 'The text never says how hard it is. That is an opinion.'),
      o('Everyone in Quezon should plant rice', 'That is an opinion about what people should do.'),
      o('Fertilizer is the best thing to use', 'The text says to add fertilizer but never calls it the best. That is an opinion.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text really does contain five steps, which anyone can count. The rest are opinions it never states.',
  },
  {
    id: 'E074',
    skillTested: S.topic,
    passageId: 'T3',
    prompt: 'What is this text mostly about?',
    options: [
      o('The steps for planting rice'),
      o('The cost of rice in the market', 'Prices are T2.'),
      o('Cooking rice in a pot', 'Cooking tinolang bahay is T4.'),
      o('Flooding after heavy rain', 'That is T1.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Every line is one step in planting rice, so that is the main topic.',
  },
  {
    id: 'E075',
    skillTested: S.who,
    passageId: 'T3',
    prompt: 'Who is expected to follow the steps in this text?',
    options: [
      o('Someone who wants to plant rice'),
      o('Someone who wants to read a story', 'Nobody is being told a story here.'),
      o('Someone who wants to buy rice', 'Buying is T2. This text tells you how to grow it, not where to get it.'),
      o('Someone who wants to cook tinolang', 'Cooking is T4, a different set of steps.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! A how-to is addressed to the person who will do the task, and the task here is planting rice.',
  },
  {
    id: 'E076',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'When is fertilizer added?',
    options: [
      o('After three days'),
      o('Before planting', 'Nothing is added before planting. The first step is only preparing the field.'),
      o('One night before planting', 'One night is how long the seeds are soaked, not when fertilizer goes in.'),
      o('After one week', 'One week is not mentioned in this passage.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The fifth step says that after three days you add fertilizer and remove the extra water.',
  },
  {
    id: 'E077',
    skillTested: S.fivew,
    passageId: 'T3',
    prompt: 'What must happen before the seeds can sprout?',
    options: [
      o('The seeds must not be covered'),
      o('The field must be very wide', 'The field only needs to be wide enough. That is not about sprouting.'),
      o('The water must be removed', 'Water is removed AFTER three days, together with the fertilizer.'),
      o('Fertilizer must be added', 'Fertilizer comes at the fifth step, after the seeds have already sprouted.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The seeds must stay uncovered so they can sprout. That is exactly what step four says.',
  },
  {
    id: 'E078',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'What is the MAIN job of this text?',
    options: [
      o('To give instructions the reader can follow'),
      o('To report a price change', 'Reporting is what news does. This is not news.'),
      o('To paint a picture of a river', 'Painting a picture is what a description does.'),
      o('To argue that rice is important', 'There is no argument here, only steps.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The main job of a how-to is to be followed. This one can be followed exactly as written.',
  },

  /* ---------------------------------------------------------------------------
     T4 - "How to Cook Tinolang Bahay" (howto, instruct)
     Same shape as T3, so the questions stay on order and detail and do not
     repeat T3's wording. Ingredients and quantities are the easy handles here.
     --------------------------------------------------------------------------- */
  {
    id: 'E079',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'How much rice does the recipe need?',
    options: [
      o('Three cups'),
      o('One cup', 'One tablespoon is the salt, not the rice.'),
      o('Three tablespoons', 'Tablespoons are used for the salt, not for measuring rice.'),
      o('Ten cups', 'Ten cups of rice is not in this recipe.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first step says to wash three cups of rice.',
  },
  {
    id: 'E080',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'How many times should the rice be rinsed?',
    options: [
      o('Three times'),
      o('Once', 'Once is not what the recipe says. It says three.'),
      o('Ten times', 'Ten times is not mentioned.'),
      o('It should not be rinsed', 'Washing and rinsing are the first step, so it is rinsed.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first step says to wash three cups of rice and rinse it three times.',
  },
  {
    id: 'E081',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'Which step comes second?',
    options: [
      o('Add one tablespoon of salt'),
      o('Wash and rinse the rice', 'Washing is the first step.'),
      o('Add the kalamansi leaves', 'The leaves are the third step.'),
      o('Open the lid after one hour', 'Opening the lid is the last step.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Second is the salt, right after washing the rice.',
  },
  {
    id: 'E082',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'How long should the pot cook before the lid is opened?',
    options: [
      o('One hour'),
      o('One night', 'One night is the soaking time in T3, not the cooking time here.'),
      o('Three days', 'Three days belongs to the rice planting passage.'),
      o('Ten minutes', 'Ten minutes is not the cooking time given.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The last step says to open the lid after one hour.',
  },
  {
    id: 'E083',
    skillTested: S.purpose,
    passageId: 'T4',
    prompt: 'Why was this text written?',
    options: [
      o('To instruct readers how to cook tinolang bahay'),
      o('To report that rice got cheaper', 'That is the market news in T2.'),
      o('To describe the Agusan River', 'There is no river in this recipe.'),
      o('To entertain with a kitchen story', 'There is no character and no story here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It is written to be cooked from. Following the five steps is the whole point of it.',
  },
  {
    id: 'E084',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'Why does the recipe say to open the lid after one hour?',
    options: [
      o('So the soup can settle'),
      o('So the rice can sprout', 'Rice does not sprout in a pot. That idea belongs to the planting passage.'),
      o('So the pot can be washed', 'Washing is not the reason given for opening the lid.'),
      o('So the leaves can be removed', 'Nothing says the kalamansi leaves are taken out.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The last step gives the reason: so the soup can settle.',
  },
  {
    id: 'E085',
    skillTested: S.fivew,
    passageId: 'T4',
    prompt: 'What kind of heat should the pot be on?',
    options: [
      o('Medium heat'),
      o('High heat', 'The recipe says medium, not high.'),
      o('Low heat', 'Low is not what the text says.'),
      o('No heat at all', 'The pot is boiled, so heat is needed.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The fourth step says to cover it tightly and boil over medium heat.',
  },
  {
    id: 'E086',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'You have just added the kalamansi leaves. What is the next step?',
    options: [
      o('Cover the pot tightly and boil over medium heat'),
      o('Wash the rice', 'The rice was washed first, before the leaves.'),
      o('Add the salt', 'Salt came before the leaves.'),
      o('Open the lid after one hour', 'That is the step after this one.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Third is the leaves and fourth is covering and boiling, so covering comes next.',
  },
  {
    id: 'E087',
    skillTested: S.type,
    passageId: 'T4',
    prompt: 'Which text type is "How to Cook Tinolang Bahay"?',
    options: [
      o('How-To'),
      o('News Report', 'Nothing is reported as having happened on a named day.'),
      o('Description', 'It does not describe what the dish looks like.'),
      o('Narrative', 'No character appears and no story is told.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It has First, Second, Third, Fourth, Fifth. Those step words make it a how-to.',
  },
  {
    id: 'E088',
    skillTested: S.topic,
    passageId: 'T4',
    prompt: 'What is this text mostly about?',
    options: [
      o('The steps for cooking tinolang bahay'),
      o('The steps for planting rice', 'Planting is T3. The ingredients here are different.'),
      o('The price of rice', 'Prices are T2.'),
      o('A night by the shore', 'That is the narrative in T6.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! Every line is a step in one recipe, so that is the topic.',
  },
  {
    id: 'E089',
    skillTested: S.who,
    passageId: 'T4',
    prompt: 'Who is this recipe meant for?',
    options: [
      o('Someone who wants to cook tinolang bahay'),
      o('Someone who wants to plant rice', 'Planting is a different text with different steps.'),
      o('Someone who wants to buy rice', 'This tells you how to cook, not where to buy.'),
      o('Someone who wants to fish', 'There is no fishing in this recipe.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! A how-to is written for the person doing the task, and the task here is cooking this one dish.',
  },
  {
    id: 'E090',
    skillTested: S.fact,
    passageId: 'T4',
    prompt: 'Which statement about this text is a fact?',
    options: [
      o('The recipe uses kalamansi leaves'),
      o('Tinolang bahay is the best soup', 'The text never calls it the best. That is an opinion.'),
      o('Salt makes food healthier', 'Nothing about health is said in this passage.'),
      o('Everyone in Quezon eats this every week', 'The text says nothing about how often anyone eats it.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Only the first is in the text. The rest are opinions or claims the recipe never makes.',
  },
  {
    id: 'E091',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'How much salt does the recipe use?',
    options: [
      o('One tablespoon'),
      o('Three tablespoons', 'Three is the number of cups of rice, not the salt.'),
      o('One cup', 'The salt is measured in tablespoons, not cups.'),
      o('Three stalks', 'Three stalks counts the kalamansi leaves, not the salt.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The second step says to add one tablespoon of salt to the pot.',
  },
  {
    id: 'E092',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'Which step happens after the pot has boiled for one hour?',
    options: [
      o('The lid is opened so the soup can settle'),
      o('The rice is washed', 'The rice is washed at the very start.'),
      o('The salt is added', 'Salt goes in early, before boiling.'),
      o('The kalamansi leaves are added', 'The leaves go in before boiling too.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! After one hour you open the lid so the soup can settle. That is the fifth and last step.',
  },

  /* ---------------------------------------------------------------------------
     T5 - "The Agusan River" (description, inform)
     A description, so the easy handles are what-is-it-like and fact/opinion.
     --------------------------------------------------------------------------- */
  {
    id: 'E094',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'What is the water of the Agusan River like for most of the year?',
    options: [
      o('Clear and shallow'),
      o('Deep and muddy', 'The text says shallow for most of the year. It only swells in the wet season.'),
      o('Warm and salty', 'Salty would make it seawater, and this is a river. The text says clear.'),
      o('Frozen and white', 'This is in Mindanao and nowhere is ice mentioned.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The second sentence says the water is clear and shallow for most of the year.',
  },
  {
    id: 'E095',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'Why does the river swell?',
    options: [
      o('Because of heavy rain during the wet season'),
      o('Because of the fish and shells', 'Fish and shells are in the river. They do not make it swell.'),
      o('Because people fish for a living', 'Fishing depends on the river. It is not the cause of the swelling.'),
      o('Because of the hot weather', 'Hot weather is not mentioned. Heavy rain in the wet season is.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The third sentence says the river swells because of heavy rain during the wet season.',
  },
  {
    id: 'E096',
    skillTested: S.topic,
    passageId: 'T5',
    prompt: 'What is this text mostly about?',
    options: [
      o('The Agusan River and the people who depend on it'),
      o('The price of rice at the market', 'That is T2.'),
      o('Heavy rain in Quezon town', 'That is T1, and it is about one town.'),
      o('How to cook tinolang bahay', 'That is T4.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It describes the river, what is in it, and how many people rely on it. That is all one subject.',
  },
  {
    id: 'E097',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Which statement is a fact?',
    options: [
      o('Many fish and shells can be seen in the river'),
      o('The river is the best river in Mindanao', 'Nobody says that here. It is an opinion and cannot be checked from the text.'),
      o('Everyone in the area should fish more', 'That is an opinion about what people should do.'),
      o('Fishing is a fun job', 'The text says people depend on fishing. It does not call it fun.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The first is stated in the passage. The others add judgements about worth and fun that the writer never made.',
  },
  {
    id: 'E098',
    skillTested: S.type,
    passageId: 'T5',
    prompt: 'Which text type is "The Agusan River"?',
    options: [
      o('Description'),
      o('News Report', 'No event on a named day is reported here.'),
      o('How-To', 'There are no steps. Nothing is being done in this text.'),
      o('Narrative', 'There is no character and no action.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It shows what the river is like. That is what a description does, and it is why the purpose is to inform.',
  },
  {
    id: 'E099',
    skillTested: S.who,
    passageId: 'T5',
    prompt: 'Who depends on fishing for their living?',
    options: [
      o('Many people'),
      o('Nobody at all', 'The last sentence says many people depend on fishing. So somebody does.'),
      o('Only the visitors', 'Visitors are not mentioned in this passage.'),
      o('Only the children', 'Children are not mentioned. It says many people.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The last sentence says many people also depend on fishing for their living.',
  },
  {
    id: 'E100',
    skillTested: S.purpose,
    passageId: 'T5',
    prompt: 'Why was this text written?',
    options: [
      o('To inform readers about the river'),
      o('To persuade readers to go fishing', 'There is no argument here. The fishing is mentioned as a fact, not as an invitation.'),
      o('To instruct readers how to fish', 'No fishing method is given anywhere in this text.'),
      o('To tell a story about the river', 'There is no character and no events. It is a description.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It tells readers what the river is like and who uses it. That is informing.',
  },
  {
    id: 'E101',
    skillTested: S.fivew,
    passageId: 'T5',
    prompt: 'Where does the Agusan River run?',
    options: [
      o('Through eastern Mindanao'),
      o('Through Quezon town only', 'The river is not said to run through the town. It runs through eastern Mindanao.'),
      o('Through a rice field', 'A rice field is T3. It is not where this river runs.'),
      o('Through the market', 'The market belongs to T2.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The first sentence says it is a long river that runs through eastern Mindanao.',
  },
  {
    id: 'E102',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'What can be seen in the water of the river?',
    options: [
      o('Fish and shells'),
      o('Cars and buses', 'No vehicles appear in this passage.'),
      o('Rice plants', 'Rice is planted in fields, not seen in a river. That is T3.'),
      o('Boats with nets', 'Nothing about boats or nets is said here.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The fourth sentence says many fish and shells can be seen in its water.',
  },
  {
    id: 'E103',
    skillTested: S.order,
    passageId: 'T5',
    prompt: 'Why does the text mention fishing after describing the fish in the river?',
    options: [
      o('To explain that people use the river to earn a living'),
      o('Because fishing is the first thing in the text', 'Fishing is in the last sentence, not the first.'),
      o('To show the river is very deep', 'Depth is never mentioned. The water is described as shallow.'),
      o('To warn people not to fish', 'Nothing here warns anyone away from the river.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text moves from what the river is, to what is in it, to how people use it. Fishing comes last for that reason.',
  },
  {
    id: 'E104',
    skillTested: S.fivew,
    passageId: 'T5',
    prompt: 'When does the river get bigger?',
    options: [
      o('During the wet season, when there is heavy rain'),
      o('During the dry season', 'The text says the opposite. The river swells in the wet season.'),
      o('Every night', 'Nothing about night appears in this passage.'),
      o('Never', 'It does swell. The text says it swells because of heavy rain.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! It swells because of heavy rain during the wet season.',
  },
  {
    id: 'E105',
    skillTested: S.who,
    passageId: 'T5',
    prompt: 'Which group of people does this text care about?',
    options: [
      o('People who rely on the river for work'),
      o('People who sell rice', 'Rice sellers belong to the market passage, T2.'),
      o('People who cook tinolang', 'Cooking is T4.'),
      o('People who travel by boat', 'No boats are mentioned in this description.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text ends on the people who depend on fishing, which is who the description is really about.',
  },
  {
    id: 'E106',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Which of these can be checked against this text?',
    options: [
      o('The water is clear and shallow for most of the year'),
      o('The river should be cleaned', 'Nobody says the river should be cleaned. It cannot be checked here.'),
      o('Fishing is dangerous', 'The text does not say it is dangerous either way.'),
      o('Mindanao has many rivers', 'That may well be true, but this text only describes one, so it cannot be checked here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Only the first is in the text. The others are opinions or outside knowledge that this passage does not support.',
  },
  {
    id: 'E107',
    skillTested: S.topic,
    passageId: 'T5',
    prompt: 'Which title best matches this text?',
    options: [
      o('The Agusan River'),
      o('Rice Price Drops at the Market', 'That title belongs to T2.'),
      o('How to Plant Rice', 'That title belongs to T3.'),
      o('A Night by the Shore', 'That title belongs to T6.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text is titled "The Agusan River" and every line describes that river.',
  },

  /* ---------------------------------------------------------------------------
     T6 - "A Night by the Shore" (narrative, entertain)
     The only story. Easy weight goes to characters and sequence, which is what
     a narrative gives you, plus the feeling question.
     --------------------------------------------------------------------------- */
  {
    id: 'E108',
    skillTested: S.who,
    passageId: 'T6',
    prompt: 'Who is the story mainly about?',
    options: [
      o('A girl standing by the sea'),
      o('The farmer from the market', 'Farmers are in T2. No farmer appears here.'),
      o('The cook of tinolang', 'Cooking is T4. Nobody cooks in this story.'),
      o('The fishers of the river', 'The river is T5. No fisher appears in this story.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! She stands by the sea, wears the shirt, sees the star and lies down. She is the one story.',
  },
  {
    id: 'E109',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'What happened just before she saw the new star?',
    options: [
      o('She stood near the sea looking for the light on the road'),
      o('She lay down', 'Lying down comes after the star, in the last sentence.'),
      o('She decided to go home', 'Going home is not in the story at all.'),
      o('She ate her supper', 'No food is mentioned anywhere in this passage.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! She was standing by the sea looking for a light, and then the new star shone above the water.',
  },
  {
    id: 'E110',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'What was in the pocket of the shirt she was wearing?',
    options: [
      o('Fish scales'),
      o('A key', 'No key is mentioned in this story.'),
      o('A phone', 'No phone appears in this passage.'),
      o('A letter', 'No letter is mentioned. Only fish scales are named.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The text says she was still wearing the shirt with fish scales in the pocket.',
  },
  {
    id: 'E111',
    skillTested: S.fivew,
    passageId: 'T6',
    prompt: 'What was she looking for?',
    options: [
      o('The light on the road'),
      o('A star above the water', 'The star appeared on its own afterwards. She was not looking for it.'),
      o('Fish in the water', 'The fish scales are in her pocket, not something she went looking for.'),
      o('Rice at the market', 'The market is in T2 and she never goes there.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The text says she was looking for the light on the road.',
  },
  {
    id: 'E112',
    skillTested: S.type,
    passageId: 'T6',
    prompt: 'Which text type is "A Night by the Shore"?',
    options: [
      o('Narrative'),
      o('News Report', 'Nothing here is reported as a public event.'),
      o('How-To', 'There are no steps to follow.'),
      o('Description', 'It does not only paint a scene. Things happen to her.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Someone does something, in an order, over one night. That makes it a story, and its purpose is to entertain.',
  },
  {
    id: 'E113',
    skillTested: S.purpose,
    passageId: 'T6',
    prompt: 'Why was this text written?',
    options: [
      o('To entertain with a story'),
      o('To inform about the shoreline', 'It is not a report about the shore. It follows one girl.'),
      o('To instruct the reader', 'Nobody is being told to do anything here.'),
      o('To persuade the reader', 'There is no argument being made.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The purpose of a narrative is to entertain, and this one is written like a short evening scene.',
  },
  {
    id: 'E114',
    skillTested: S.topic,
    passageId: 'T6',
    prompt: 'What is this text mostly about?',
    options: [
      o('A girl waiting by the sea on a quiet night'),
      o('A river in eastern Mindanao', 'The river is T5.'),
      o('The price of rice', 'The price is T2.'),
      o('Planting rice in a field', 'Planting is T3.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Every line is one quiet moment of her night by the shore, so that is the topic.',
  },
  {
    id: 'E115',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'Which list puts the events in the right order?',
    options: [
      o('Quiet shore, she waits, star appears, she lies down'),
      o('She waits, quiet shore, star appears, she lies down', 'The shore being quiet is the opening, before she does anything.'),
      o('Star appears, she waits, quiet shore, she lies down', 'The star comes after she is already waiting.'),
      o('She lies down, star appears, she waits, quiet shore', 'This reverses the whole story.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The shore is quiet, then she stands and waits, then the star shines, then she lies down.',
  },
  {
    id: 'E116',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'Where did the new star shine?',
    options: [
      o('Above the water'),
      o('Inside her pocket', 'The pocket holds fish scales. Nothing shines inside it.'),
      o('Behind the market', 'The market is in another passage entirely.'),
      o('Under the road', 'The text says she looked for the light on the road. The star shone above the water.'),
    ],
    correctIndex: 0,
    explanation: 'Correct! The text says a new star suddenly shone above the water.',
  },
  {
    id: 'E117',
    skillTested: S.fivew,
    passageId: 'T6',
    prompt: 'When did the star appear?',
    options: [
      o('Suddenly, during the night'),
      o('In the morning', 'The story is set at night and no morning is mentioned.'),
      o('Last week', 'No days are named in this short scene.'),
      o('Before she left home', 'The story begins with her already at the shore.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The text says a new star suddenly shone above the water, in a scene set on that night.',
  },
  {
    id: 'E118',
    skillTested: S.who,
    passageId: 'T6',
    prompt: 'Who did she think would hear the news?',
    options: [
      o('They, the next day'),
      o('Only herself', 'She already knows the news. The text says they would hear it, not her.'),
      o('The fish in the water', 'The fish are not people and are not said to hear anything.'),
      o('The farmer at the market', 'No farmer appears in this story.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! She thought they would only hear the news tomorrow, so other people are the ones who would learn it.',
  },
  {
    id: 'E119',
    skillTested: S.fact,
    passageId: 'T6',
    prompt: 'Which statement about this text is a fact?',
    options: [
      o('The shore was quiet on that night'),
      o('The night was very romantic', 'Nobody calls it romantic. That is a reader feeling, not a fact in the text.'),
      o('She was waiting for a boat', 'No boat is mentioned. She was looking for the light on the road.'),
      o('The story is sad', 'Nobody says it is sad. That is an opinion about the mood.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The first is written in the passage. The rest are opinions about mood that the writer never states.',
  },
  {
    id: 'E120',
    skillTested: S.purpose,
    passageId: 'T6',
    prompt: 'What is the MAIN job of this text?',
    options: [
      o('To tell a short story about one night'),
      o('To give steps the reader can follow', 'Nothing here is an instruction.'),
      o('To report a price change', 'That is the job of the news passage in T2.'),
      o('To list facts about a river', 'Listing facts about a river is the job of T5.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Its main job is to tell a story about one girl on one night, which is what a narrative does.',
  },
{
    id: 'E093',
    skillTested: S.fact,
    passageId: 'T6',
    prompt: 'Which statement about this story can be checked against the text?',
    options: [
      o('She was still wearing the shirt with fish scales in the pocket'),
      o('The night was beautiful', 'Nobody calls the night beautiful in the story. That is a reader feeling, so it cannot be checked from the text.'),
      o('She should have gone home earlier', 'That is an opinion about what she should do. The text never judges her.'),
      o('The star was a lucky sign', 'That is a meaning the text never gives the star. It only says the star shone.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The shirt and the fish scales are written in the story, so anyone can check them. The other three add feelings or judgements the writer never states.',
  },
]
