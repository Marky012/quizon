import type { Question } from './schemas'
import { S, o } from './questionParts'

/* ===========================================================================
   HARD TIER - EXPANSION (H037 - H120)

   Added 2026-10-04. 14 items per story, bringing all six Hard pools to 20 and
   clearing storyPoolIsThin() across the whole bank.

   WHAT "HARD" MEANS HERE, and why it is not just "more Medium":

   - Medium asks what a sentence IMPLIES. Hard asks why the writer chose it.
     "Why did the writer not name the streets?" is Hard. "Low-lying areas
     means lower ground" is Medium.
   - The strongest Hard items put two true things against each other and make
     the learner choose which one the text actually supports. A learner who
     only skims will pick the truer-sounding option and be wrong.
   - Hard also asks about craft: what a phrase is DOING for the reader, and
     what the text pointedly withholds. An omission is evidence.

   THE TRAP: making Hard harder by making the OPTIONS longer or the words
   rarer. A nine-year-old who understands the idea must still be able to get
   it. Every distractor below is defeated by reasoning about the passage, not
   by knowing a longer word, and every wrong option says exactly what is wrong
   with it so the feedback teaches the specific misreading.

   GROUNDING: each item is answerable from its passage alone. Where a question
   needs outside knowledge to be fair (why salt dissolves, why rice sprouts),
   the passage or the option states the premise rather than assuming it.
   =========================================================================== */

export const hardExtra: Question[] = [
  /* ---------------------------------------------------------------------------
     T1 - "Heavy Rains over Agusan Island" (news, inform)
     Hard weight: a news report is mostly EDIT. The writer chooses what to name,
     what to generalise, and where to place the reassurance.
     --------------------------------------------------------------------------- */
  {
    id: 'H037',
    skillTested: S.type,
    passageId: 'T1',
    prompt: 'A classmate says this text is a how-to because it ends with an instruction. Why does that not hold?',
    options: [
      o('Because a how-to can only be about cooking', 'Subject has nothing to do with text type. A how-to can plant rice or fix a road.'),
      o('Because instructions only appear in recipes', 'Instructions appear wherever someone is being told what to do, not only in recipes.'),
      o('Because the instruction comes from the Barangay, and the rest reports what already happened'),
      o('Because the text is written about the past', 'Tense alone does not decide a type. A how-to can describe an action in the past and still instruct.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! One borrowed instruction does not make a how-to. Everything around it reports an event, which is what news does.',
  },
  {
    id: 'H038',
    skillTested: S.type,
    passageId: 'T1',
    prompt: 'Which detail does the MOST to mark this as a news report rather than a description?',
    options: [
      o('It names a town, a day, and something that happened there'),
      o('It is short', 'A description can be just as short. Length decides nothing.'),
      o('It tells readers what to do', 'It gives one instruction from the Barangay, but that is not what makes the report a report.'),
      o('It mentions the word town', 'A description can name a place just as easily. Naming is not the deciding mark.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! A place, a day and an event together are the marks of news. A description only shows what something is like.',
  },
  {
    id: 'H039',
    skillTested: S.topic,
    passageId: 'T1',
    prompt: 'Someone wants to retitle the report "The Goods Rescue". Why is that a poor title for this text?',
    options: [
      o('It is too short to work as a headline', 'Length does not decide a title. A short title can still be accurate.'),
      o('It drops the event that caused everything and leaves only one side detail'),
      o('It uses the word goods, which no reader understands', 'Goods is an ordinary word and the report uses it plainly. That is not the problem.'),
      o('It names no place', 'Plenty of good titles name no place. What matters is whether the title fits the text.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The rain and the flooding are the subject. The goods are one consequence, so a title built on them shrinks the report.',
  },
  {
    id: 'H040',
    skillTested: S.topic,
    passageId: 'T1',
    prompt: 'Which sentence, if cut, would do the most damage to what the report is about?',
    options: [
      o('"No casualties have been reported in the town so far."', 'That line is reassurance. Losing it changes the tone, not the subject.'),
      o('"The Barangay said not to travel to the flooded areas."', 'That is the warning. It is important, but it is the response to the event rather than the event.'),
      o('"Goods were being carried to the low-lying areas."', 'That shows the effect on people, which is worth keeping, but the flooding is still the bigger subject.'),
      o('"Several roads inside the town were flooded within two hours."'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The flooding is what every other line answers or reacts to. Take it away and the rest has nothing to be about.',
  },
  {
    id: 'H041',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'The report gives no advice about repairing roads. Why is it still doing its job?',
    options: [
      o('Reporting an event is the job. Repair instructions belong to a different kind of text.'),
      o('Because road repair is too technical for a news report', 'A news report is not the place for repair steps, but that is not why it counts as complete.'),
      o('Because readers would not understand repair advice', 'Whether readers would understand is beside the point. A report is not an instruction manual.'),
      o('Because the Barangay gave no repair advice to pass on', 'The text never says the Barangay was asked. Do not invent a reason for an absence.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Telling readers what happened is the whole duty here. How to fix it is a different text with a different job.',
  },
  {
    id: 'H042',
    skillTested: S.purpose,
    passageId: 'T1',
    prompt: 'Why give a line to goods being carried, when the report is about rain?',
    options: [
      o('It shows what the flood is doing to people, which is what a reader most needs to know'),
      o('To show that shops were open', 'No shop is named anywhere in this report. The line is about movement of goods, not trade.'),
      o('To warn shopkeepers to close', 'Nobody is warned about shops. The only instruction in the text is about travel.'),
      o('To prove the government responded well', 'No government and no response appear in the text. That reading goes well past what is written.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! A report that only listed rain would be thin. That line shows the consequence in human terms.',
  },
  {
    id: 'H043',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'Which pair of details together says the flooding was serious but not catastrophic?',
    options: [
      o('The rain fell, and the Barangay gave a warning', 'A warning shows the flood was dangerous, but the pair says nothing about how bad the damage was.'),
      o('Several roads flooded, and no casualties were reported'),
      o('Goods were carried to low areas, and the rain fell on Wednesday', 'That pair shows a response and a time. Neither one measures how bad it was.'),
      o('No casualties were reported, and no roads were named', 'Not naming roads is not a detail in the text. The pair also says nothing about severity.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Flooded roads give the scale of the problem, and no casualties limits how far that scale went. Together they hold both halves.',
  },
  {
    id: 'H044',
    skillTested: S.details,
    passageId: 'T1',
    prompt: 'The writer says "low-lying areas" and never names streets. Why?',
    options: [
      o('The writer was hiding the streets from the readers', 'Nothing suggests concealment. The report simply does not go to street level.'),
      o('The streets have no names', 'The text never says the streets are unnamed. Do not invent a fact to explain a phrase.'),
      o('Street names would have made it a description', 'Naming streets would not change the type of text at all.'),
      o('It keeps to the general shape of the problem, and the text does not go street by street'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The phrase describes the kind of place affected. The report stays at that level of detail on purpose.',
  },
  {
    id: 'H045',
    skillTested: S.order,
    passageId: 'T1',
    prompt: 'The casualty line sits before the warning. What does that placement achieve?',
    options: [
      o('It warns people first and softens the news afterwards', 'That is the reverse of the order in the text, and it would be a cold way to open.'),
      o('It buries the warning at the end so few people read it', 'The text does not hide anything, and an ending warning in a short report is read.'),
      o('It reassures first, then gives people something to do'),
      o('It makes the casualty count look like a result of the warning', 'The warning cannot cause a count that is already given. Nothing in the text links them that way.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! News often steadies a reader before asking for action. The order is doing that work, not hiding anything.',
  },
  {
    id: 'H046',
    skillTested: S.order,
    passageId: 'T1',
    prompt: 'If you had to keep only two lines, which pair would still carry a whole report?',
    options: [
      o('The rain line and the casualty line', 'That pair gives a cause and an absence, but nothing about the damage or the response.'),
      o('The goods line and the warning line', 'That pair shows a response and an instruction, but never says what happened in the first place.'),
      o('The rain line and the goods line', 'That gives a cause and a response, but a reader would not know there was a flood.'),
      o('The flooding line and the warning line'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! Those two lines carry what happened and what to do about it. Stripped down further, that is still a complete report.',
  },
  {
    id: 'H047',
    skillTested: S.fivew,
    passageId: 'T1',
    prompt: 'The report never says how deep the water was. Which wh-question is left unanswered?',
    options: [
      o('Where did the rain fall?', 'The first sentence names Quezon and Tagbina, so the where is answered.'),
      o('Who gave the warning?', 'The last sentence names the Barangay, so the who is answered.'),
      o('When did it happen?', 'The first sentence gives Wednesday night, so the when is answered.'),
      o('How deep was the floodwater?'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The text reports that roads flooded but never measures the water. That question simply has no answer here.',
  },
  {
    id: 'H048',
    skillTested: S.fact,
    passageId: 'T1',
    prompt: 'Which claim about this flood COULD the text support?',
    options: [
      o('Flooding began within two hours of the rain'),
      o('This was the worst flooding in the island\'s history', 'That needs a comparison with every other flood, and the text never makes one.'),
      o('The rain was stronger than usual', 'No average or usual rainfall is mentioned, so there is nothing to compare against.'),
      o('The town was completely destroyed', 'The text reports flooded roads and a warning. Nothing describes total destruction.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Two hours is stated in the text, so that claim can be checked against it. The others all need evidence the report never gives.',
  },
  {
    id: 'H049',
    skillTested: S.fact,
    passageId: 'T1',
    prompt: 'A reader says "no casualties" proves the flood was harmless. Why does the text not support that?',
    options: [
      o('No casualties is only one measure, and it says nothing about depth, damage, or how long the water stayed'),
      o('The text actually reports casualties', 'It says the opposite: no casualties have been reported so far. Read the line again.'),
      o('Casualties are never counted in floods', 'That is outside knowledge and the text does not say it. Do not argue from general rules.'),
      o('The word "so far" means the number will grow soon', 'So far limits how complete the news is. It does not predict that casualties will rise.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! An absence of deaths is one fact among several. Using it to prove harmlessness ignores everything the report does say.',
  },
  {
    id: 'H050',
    skillTested: S.who,
    passageId: 'T1',
    prompt: 'Who does the report expect to act on its last line?',
    options: [
      o('The people in the flooded areas, who are the ones being warned'),
      o('The writers of the report', 'A report is not addressed to its own writer. They already know what happened.'),
      o('The Barangay officers', 'The Barangay is the one giving the instruction, not the one receiving it.'),
      o('Readers in other countries', 'The warning is about travelling to these flooded areas. It is aimed locally.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The instruction only makes sense for people who might travel there. That is the audience the last line is built for.',
  },

  /* ---------------------------------------------------------------------------
     T2 - "Rice Price Drops at the Market" (news, inform)
     Hard weight: a report built on TWO numbers. Everything else exists to frame,
     limit, or explain the gap between them.
     --------------------------------------------------------------------------- */
  {
    id: 'H051',
    skillTested: S.type,
    passageId: 'T2',
    prompt: 'This text gives a number, a day, and a place. Why is it still not a how-to?',
    options: [
      o('Because how-to texts never give numbers', 'How-to texts give numbers constantly. Recipes and planting guides are full of them.'),
      o('Because a place name rules out a how-to', 'A how-to can name a place. This planting guide names a field and a season.'),
      o('Because the numbers report a change that already happened, instead of handing over actions'),
      o('Because it is written in English', 'Language does not decide a text type at all.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Numbers can serve either kind of text. What matters is whether the text reports something or tells you to do something.',
  },
  {
    id: 'H052',
    skillTested: S.type,
    passageId: 'T2',
    prompt: 'What would have to change for this text to become persuasive rather than informative?',
    options: [
      o('The numbers would have to be removed', 'Removing the figures would make it vaguer, not more persuasive. Persuasion needs evidence too.'),
      o('It would have to argue that buyers should act now, instead of only reporting the change'),
      o('It would have to name a different market', 'The market is just where the news was checked. Changing the place changes nothing about intent.'),
      o('It would have to be made longer', 'Length follows purpose. Padding a report does not turn it into an argument.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Persuasion pushes toward a choice. This text reports and then admits uncertainty, which is the opposite of arguing.',
  },
  {
    id: 'H053',
    skillTested: S.topic,
    passageId: 'T2',
    prompt: 'The last line is about farmers from other towns. Why does the writer include it?',
    options: [
      o('To shift the subject to farming', 'The subject stays on the price and who it affects. Naming farmers does not make farming the subject.'),
      o('To explain who the price matters to, since Quezon buyers are the ones affected and outside farmers are not'),
      o('It does not belong, because the farmers line is about people and not prices', 'It does belong. It sorts out who the price concerns, which is part of a price report.'),
      o('To argue that farmers should be banned', 'Nobody is banned or argued about anywhere in this text.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! It sorts out who the price affects: Quezon buyers, not farmers from elsewhere. That is still the price story, not a new subject.',
  },
  {
    id: 'H054',
    skillTested: S.topic,
    passageId: 'T2',
    prompt: 'Which title would misdescribe this text most seriously?',
    options: [
      o('Rice Price Drops at the Market', 'That names the subject and the change, and names the place as well.'),
      o('Ordinary Rice in Tagbina', 'That names the subject and the place. It drops the change, but it is not seriously wrong.'),
      o('A Day at the Market'),
      o('What Buyers Should Know', 'That is vaguer still, but it still points at the price as the thing to know.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Every other title still gestures at rice or at buyers. That one could sit over any text at all.',
  },
  {
    id: 'H055',
    skillTested: S.purpose,
    passageId: 'T2',
    prompt: 'Why does the text put the new price before the old one?',
    options: [
      o('So the figure a reader needs comes first, and the old price then explains the change'),
      o('Because the writer thought the old price was unimportant', 'The old price is what makes the drop meaningful. It is placed second for the reader, not dismissed.'),
      o('So readers will think the price is rising', 'Sixty is below seventy. The order cannot turn a fall into a rise.'),
      o('To fill the space before the last line', 'Writers choose order on purpose. This is not a layout decision.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The current figure answers the reader question first, and the earlier figure then shows what changed.',
  },
  {
    id: 'H056',
    skillTested: S.purpose,
    passageId: 'T2',
    prompt: 'The report admits the drop may not last. Why would a writer choose to weaken good news like that?',
    options: [
      o('To make the news sound doubtful on purpose', 'Saying it is unclear is the opposite of sounding doubtful. It protects the reader from over-trusting.'),
      o('To give buyers a reason to wait'),
      o('Because the writer did not believe the drop', 'Believing is not the issue. The text reports a price it has and admits the rest is unknown.'),
      o('To make the article longer', 'One sentence of caution is not padding. It is the honest limit of what is known.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Naming the limit is what a trustworthy report does. It stops a reader treating one week of good news as permanent.',
  },
  {
    id: 'H057',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'The word "ordinary" does real work in this report. What work?',
    options: [
      o('It tells the reader the rice is poor quality', 'Ordinary means the standard kind, not a bad one. The word narrows the price without judging it.'),
      o('It tells the reader the rice is uncooked', 'Cooking is a separate matter. The word says nothing about preparation.'),
      o('It tells the reader the rice came from elsewhere', 'Nothing about importing appears anywhere in this text.'),
      o('It has no work to do, and could be deleted with no loss'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! Without "ordinary" the sixty pesos could belong to any grade at all. The word fixes which rice the figure describes.',
  },
  {
    id: 'H058',
    skillTested: S.details,
    passageId: 'T2',
    prompt: 'You have room for one number in a headline. Which number is the news itself?',
    options: [
      o('Seventy pesos per kilo', 'That is the old price. It is context for the change, not the change itself.'),
      o('Three days', 'No number of days appears anywhere in this report.'),
      o('Sixty pesos per kilo'),
      o('One kilo', 'That is the unit the price is measured in. It carries no price of its own.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Sixty is the figure that exists now. The other numbers either describe the past or describe the unit.',
  },
  {
    id: 'H059',
    skillTested: S.order,
    passageId: 'T2',
    prompt: 'If the uncertainty sentence came FIRST, what would the report do to its own news?',
    options: [
      o('It would make the drop sound temporary before the reader has seen it'),
      o('It would make the report longer', 'Moving one sentence does not change length in any way that matters.'),
      o('It would make the price look like it rose', 'Order cannot turn sixty pesos into a rise from seventy.'),
      o('It would change the meaning of the numbers', 'The figures would mean the same thing. Only the impression on the reader would shift.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Placing doubt first makes the news harder to trust. The writer puts it last, once the reader already has the figure.',
  },
  {
    id: 'H060',
    skillTested: S.order,
    passageId: 'T2',
    prompt: 'The farmers line is placed last. What does closing on it do?',
    options: [
      o('It leaves the reader thinking about the next sentence rather than the price', 'That would be a strange aim for a price report, and the text does not suggest it.'),
      o('It ends on the people the price actually affects, which is a deliberate close'),
      o('It hides the uncertainty sentence in the middle', 'The uncertainty line comes before it. The farmers line does not bury anything.'),
      o('It makes the price seem less important than the farmers', 'That would be reading the last position as a ranking. Position is not emphasis by itself.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The report ends by returning to real people. It is a deliberate way to land a figure on someone rather than a number.',
  },
  {
    id: 'H061',
    skillTested: S.fivew,
    passageId: 'T2',
    prompt: 'The text answers when, where, and how much. Which does it leave open?',
    options: [
      o('How much', 'Sixty pesos per kilo is stated outright.'),
      o('Why the price fell'),
      o('Where the rice was sold', 'The Tagbina market is named in the first sentence.'),
      o('When the price fell', 'Wednesday is named in the first sentence, right beside the market.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The report gives the figures and the day but never a cause. Every other wh-question has an answer in the text.',
  },
  {
    id: 'H062',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Someone claims the report proves rice will stay cheap. What is wrong with that reading?',
    options: [
      o('The report says the opposite, that the price rose', 'The price fell from seventy to sixty. Read the two figures again.'),
      o('The report never promises anything about next week, so nothing can be predicted from it'),
      o('The report is about the wrong market', 'The market is named clearly. Being about one market does not void the claim being tested.'),
      o('The report was written by a farmer', 'No writer is identified anywhere in the text, so this cannot be used.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The text states plainly that it is not yet clear. Reading a lasting promise into it contradicts the report itself.',
  },
  {
    id: 'H063',
    skillTested: S.fact,
    passageId: 'T2',
    prompt: 'Which statement is an opinion, even though it carries no marker word at all?',
    options: [
      o('One kilo of ordinary rice now costs sixty pesos', 'An amount you can check at the market is a fact.'),
      o('Rice at seventy pesos was overpriced'),
      o('It was seventy pesos per kilo before', 'That figure is in the report and can be compared.'),
      o('The price of rice fell at the Tagbina market on Wednesday', 'A day and a place can both be checked, so that is a fact.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Calling a price overpriced needs a judgement about what things should cost. The text never makes one.',
  },
  {
    id: 'H064',
    skillTested: S.who,
    passageId: 'T2',
    prompt: 'The farmers line says other towns do not come to Quezon. Why does the writer tell readers that?',
    options: [
      o('To warn the farmers of Quezon', 'Nobody is warned in this text. The line only reports who does not travel.'),
      o('To show that the buyers must be Quezon people, which is why the price matters locally'),
      o('To argue that Quezon should attract more farmers', 'No argument or invitation appears anywhere in the report.'),
      o('To suggest the market is failing', 'A market with buyers at sixty pesos is not shown to be failing. The line explains buyers, not decline.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Excluding other towns tells you who is left buying. That is why a local price drop is news for the people of Quezon.',
  },

  /* ---------------------------------------------------------------------------
     T3 - "How to Plant Rice" (howto, instruct)
     Hard weight: the writer left out a step a real planting guide would need.
     Noticing the gap is the highest-order reading in this text.
     --------------------------------------------------------------------------- */
  {
    id: 'H065',
    skillTested: S.type,
    passageId: 'T3',
    prompt: 'This text gives five instructions and one reason. Why is it still a how-to and not a description?',
    options: [
      o('Because it mentions rice, and rice is grown, not described', 'Description can be about rice easily. The subject is not what decides.'),
      o('Because it contains the word "because"', 'Any kind of text can give a reason. A description can explain why a river swells.'),
      o('Because it uses numbers like one metre', 'Numbers appear in news reports too. They show detail, not type.'),
      o('Because the actions are handed over in a fixed order for a reader to carry out'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! A description shows what something is like. This text hands over a job in order, which is what makes it a how-to.',
  },
  {
    id: 'H066',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'The text gives no greeting and no "please". Why does it still instruct?',
    options: [
      o('Because being polite is the mark of an instruction', 'Civility is a manner, not a purpose. Rude how-to texts still instruct.'),
      o('Because it is about farming', 'The river text is also about a livelihood and only describes. Subject decides nothing.'),
      o('Because it hands over a chain of actions the reader is meant to carry out'),
      o('Because every how-to begins with "First"', 'First, Second, Third help the reader. They are not what makes the text instructional.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! What makes it instruct is the chain of actions, not the tone. Politeness and step words are only help.',
  },
  {
    id: 'H067',
    skillTested: S.purpose,
    passageId: 'T3',
    prompt: 'Why does the text include the reason in step four and nothing like it in the others?',
    options: [
      o('Because the other steps need no reason'),
      o('Because reasons make a text longer', 'Length is not the aim. One useful reason is worth more than five restatements.'),
      o('Because the writer had run out of ideas by step four', 'Writers do not run out mid-list. The placement is a choice about the reader.'),
      o('Because a reason only belongs in the last step', 'The reason is in the fourth step, not the last. Position is not the rule here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Do not cover the seeds is the step people break without knowing why. That is exactly where an explanation earns its place.',
  },
  {
    id: 'H068',
    skillTested: S.topic,
    passageId: 'T3',
    prompt: 'Why can this text NOT be about rice as a food?',
    options: [
      o('Because rice is never cooked in it', 'Nothing here is about cooking either way. That is not what separates the two readings.'),
      o('Because the text has no recipe in it', 'It has no recipe, but neither does it claim to. Absence of a recipe is not the argument.'),
      o('Because no sentence describes a taste or a dish'),
      o('Because it is too short to cover cooking', 'Length decides nothing. A short recipe is still a recipe.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Not one line touches taste, dish, or pot. The subject is the crop in the field, which is a different thing entirely.',
  },
  {
    id: 'H069',
    skillTested: S.topic,
    passageId: 'T3',
    prompt: 'Which title would fit this text LEAST well?',
    options: [
      o('How to Plant Rice', 'It names the job and the crop. That is exactly what the text does.'),
      o('Planting Rice in Five Steps', 'It names the job and the shape of the text. It fits.'),
      o('Rice and Everything About It'),
      o('Five Steps for Rice Seedlings', 'It names the job, the count, and the subject. It fits closely.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! The text covers one narrow job. A title promising everything about rice would send a reader in with the wrong expectation.',
  },
  {
    id: 'H070',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'What is missing that a reader would need to actually carry out this job?',
    options: [
      o('The name of the rice variety', 'Variety is a choice among options. The text is not obliged to narrow it that far.'),
      o('How to dry the harvested grain afterwards', 'Harvesting comes after every step in this text. The gap is not inside the job described.'),
      o('The price of the seeds', 'No price appears anywhere in this text. It gives spacing, timings, and actions, and stops there.'),
      o('How deep the water should be over the seeds'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The text covers width, spacing, and time, but never says how much water. That is a real gap inside the job itself.',
  },
  {
    id: 'H071',
    skillTested: S.details,
    passageId: 'T3',
    prompt: 'Step one says the field must be "wide enough" but never gives a number. Why is that fair?',
    options: [
      o('Because the writer forgot the measurement', 'Forgetting twice in one text is a stretch. The next steps show numbers are given where they matter.'),
      o('Because width depends on the planting, so an exact figure would be wrong for every reader'),
      o('Because width does not matter for rice', 'The text requires a wide field, so it plainly matters.'),
      o('Because numbers are only used for times in this text', 'One metre is given for spacing. Numbers are used for measurements as well as timings.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! A field wide enough is a judgement the reader makes on the spot. The exact numbers sit where one answer fits everyone.',
  },
  {
    id: 'H072',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'Step five pairs two actions under one number. What does that tell you?',
    options: [
      o('The writer forgot to number the sixth step', 'Two actions under one number is a deliberate grouping, not a counting slip.'),
      o('The two actions belong to the same moment, three days after planting'),
      o('One of the two actions is optional', 'Nothing marks either as optional. They share a step and a timing.'),
      o('The fertilizer must be added before the water is removed', 'The text does not sequence the two against each other. They are given together.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Sharing one step and one timing is the writer telling you they happen as a pair at the three-day mark.',
  },
  {
    id: 'H073',
    skillTested: S.order,
    passageId: 'T3',
    prompt: 'A reader swaps steps two and three. What breaks?',
    options: [
      o('Nothing, because soaking and planting can happen in either order'),
      o('Only the spacing of the rows', 'Swapping the two also undoes a night of soaking, which matters more than spacing.'),
      o('The fertilizer step', 'Fertilizer comes at three days and is not affected by swapping two and three.'),
      o('The field, which would no longer be prepared', 'The field is step one and is untouched by a swap of steps two and three.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Soaking is timed relative to planting: one night before. Reverse them and the instruction no longer means what it says.',
  },
  {
    id: 'H074',
    skillTested: S.fivew,
    passageId: 'T3',
    prompt: 'You want to know the whole job will take how long. What does the text give you?',
    options: [
      o('A total, because one night plus three days can simply be added', 'That would need to be stated. The text never puts the two timings into one figure.'),
      o('The three days after planting only', 'That covers one step, not the whole job, and it says nothing about the rest.'),
      o('Nothing usable, because the text gives separate timings but never a total'),
      o('The length of the growing season', 'No season is named for growing anywhere in this text.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! One night and three days are given separately, and nothing combines them. A careful reader says the total is not stated.',
  },
  {
    id: 'H075',
    skillTested: S.fact,
    passageId: 'T3',
    prompt: 'Which statement could the text support as written?',
    options: [
      o('Rice should be planted in the wettest part of the year', 'That is advice with "should", and no season is named anywhere in the text.'),
      o('Planting rice requires more than one pass over the field'),
      o('Fertilizer is the most important thing in the text', 'Nothing is ranked here. The word most needs a judgement the text never makes.'),
      o('Rice grows well in very deep water', 'The text says nothing about water depth. This claim has no support either way.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Prepare, soak, plant, leave uncovered, then fertilise. That is several passes, and every one of them is in the text.',
  },
  {
    id: 'H076',
    skillTested: S.fact,
    passageId: 'T3',
    prompt: 'Why is "plant the seeds carefully" not a step this text supports?',
    options: [
      o('Because it has no marker word at all', 'Plenty of facts have no marker word. Careful is not the reason to reject it.'),
      o('Because carefully is not something you can check or measure'),
      o('Because the text gives an exact spacing instead', 'The spacing is given, yes, but a step can be both careful and exact. Two reasons are given here.'),
      o('Because no seeds are planted in this text', 'Seeds are planted in step three. The rejection is not about seeds.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Careful is a manner, not a measure. This text gives a spacing in metres, and that is the kind of instruction it supports.',
  },
  {
    id: 'H077',
    skillTested: S.who,
    passageId: 'T3',
    prompt: 'The text names no one at all. Who is it written for?',
    options: [
      o('Only farmers who already know the job', 'The text explains its reasoning and gives exact spacings. It is written to be usable, not to confirm what an expert already knows.'),
      o('Experts, because the steps are technical', 'Nothing here is technical. A metre and three days are ordinary measures.'),
      o('Nobody in particular, because instructions need no reader', 'An instruction with no reader would be a strange thing to write. The reader is implied, not named.'),
      o('Whoever is planting, including someone doing it for the first time'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! No reader is named, yet the steps are given in full with their reasons. That serves a reader new to the job.',
  },
  {
    id: 'H078',
    skillTested: S.who,
    passageId: 'T3',
    prompt: 'Who does the text imagine is carrying out the planting?',
    options: [
      o('A large farm with many workers', 'No scale, crew, or farm size is mentioned anywhere in the five steps.'),
      o('The writer, describing their own field', 'The writer never claims to own the field. The steps are given for whoever needs them.'),
      o('One person working through the steps alone'),
      o('The government, giving official instructions', 'No government and no official body appear in this text.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Each step is one person one action, timed in nights and days. The text quietly assumes a single worker.',
  },

  /* ---------------------------------------------------------------------------
     T4 - "How to Cook Tinolang Bahay" (howto, instruct)
     Hard weight: a recipe is an argument about order. Every placement defends
     itself, and the text never says why out loud.
     --------------------------------------------------------------------------- */
  {
    id: 'H079',
    skillTested: S.type,
    passageId: 'T4',
    prompt: 'A reader calls this a description because it tells you what tinola contains. Why is that wrong?',
    options: [
      o('Because ingredients make a text a how-to', 'Descriptions list contents all the time. Naming things decides nothing.'),
      o('Because it uses the word "first"', 'That is only one word. Plenty of descriptions use sequence words while arranging a scene.'),
      o('Because it names a dish, and named dishes are never described', 'A dish can be described in any number of ways. That is not the argument.'),
      o('Because it never shows what anything looks like, it only hands over actions'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! Knowing what is in something is not the same as showing what it is like. This text only ever hands over actions.',
  },
  {
    id: 'H080',
    skillTested: S.type,
    passageId: 'T4',
    prompt: 'This recipe and a news report both give exact numbers. What actually separates them?',
    options: [
      o('The recipe is shorter', 'Length separates nothing. Both can be any length at all.'),
      o('The recipe tells you what to do, and the report tells you what happened'),
      o('The recipe is about food, and reports are not', 'News reports are written about food prices all the time. Subject is not the divider.'),
      o('The recipe uses measurements, and reports use money', 'Both kinds of text use numbers. The two uses overlap constantly.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Both are precise about numbers. The real difference is whether the text is handing you a job or reporting one.',
  },
  {
    id: 'H081',
    skillTested: S.purpose,
    passageId: 'T4',
    prompt: 'Why does the recipe say "so the soup can settle" in the last step?',
    options: [
      o('To warn the reader the soup will spoil', 'Settling is not spoiling, and nothing in the text suggests danger.'),
      o('To give the reader the reason for the hour of boiling, not just the instruction'),
      o('To suggest the soup is thin', 'Nothing about thickness or thinness appears anywhere in the text.'),
      o('To warn against stirring it', 'Stirring is never mentioned at all. Do not invent an instruction to argue against.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The phrase turns a bare instruction into an understood one. It tells the reader what the hour is actually for.',
  },
  {
    id: 'H082',
    skillTested: S.purpose,
    passageId: 'T4',
    prompt: 'Why does the recipe not say how the soup should taste?',
    options: [
      o('Because taste cannot be written down', 'Taste can be written down. It is simply not this text\'s job to describe it.'),
      o('Because the writer did not taste it', 'Nobody says the writer avoided tasting it. That is not a reason a text gives.'),
      o('Because the writer thought it tasted bad', 'Nothing suggests the soup is bad. The absence of taste is a choice about purpose, not quality.'),
      o('Because a how-to hands over actions and lets the result follow from them'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The actions produce the result. Describing the result would be a different kind of text doing a different job.',
  },
  {
    id: 'H083',
    skillTested: S.topic,
    passageId: 'T4',
    prompt: 'Which title would promise more than this text delivers?',
    options: [
      o('Cooking Tinolang Bahay', 'It names the dish and the job. The text delivers both.'),
      o('Five Steps to Tinola', 'It names the dish and the shape. The text delivers that too.'),
      o('Surigao Home Cooking'),
      o('A Simple Tinola Recipe', 'It names the dish and its scale. That is a fair description.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! One recipe cannot speak for a whole cuisine. That title would set an expectation the five steps never meet.',
  },
  {
    id: 'H084',
    skillTested: S.topic,
    passageId: 'T4',
    prompt: 'Why is the rice not the main topic, even though it takes up step one?',
    options: [
      o('Because rice is not in tinola', 'Rice is the base of the dish and the text says to wash three cups of it.'),
      o('Because step one is the least interesting step', 'Interest is not what sets a topic, and the writer gives no ranking.'),
      o('Because the topic is the ingredient list, not the cooking', 'The ingredients are what goes in. The text is about the sequence that turns them into a dish.'),
      o('Because the rice is only one of five things being handled'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! Rice opens the list but the text moves on to salt, leaves, heat, and time. The topic is the cooking, not one ingredient.',
  },
  {
    id: 'H085',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'Three of these are amounts a cook can measure. Which is the odd one out?',
    options: [
      o('Three times', 'That is a count of rinses. It is exact and it is measurable.'),
      o('Three stalks of kalamansi', 'That is a count of leaves. It is exact and it is measurable.'),
      o('One tablespoon of salt', 'That is a spoon measure. It is exact and it is measurable.'),
      o('Until the soup settles'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The last step gives no number at all. It describes a state to wait for, which is the only unmeasured instruction here.',
  },
  {
    id: 'H086',
    skillTested: S.details,
    passageId: 'T4',
    prompt: 'The recipe gives no oven temperature and no pot size. Why is that still usable?',
    options: [
      o('Because medium heat is a relative instruction, so the reader can match it to whatever pot they have'),
      o('Because every cook already owns the right equipment', 'Nothing says the equipment is standard. The text simply does not specify it.'),
      o('Because the writer assumed the reader is an experienced cook', 'The text explains its reasoning in plain words. It is not aimed at someone who needs no detail.'),
      o('Because the recipe is only a guide, and guides need not be exact', 'This recipe measures everything it can: three cups, one tablespoon, three stalks, one hour. It is exact where it matters.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Medium describes heat relative to the cook\'s own pot, so the instruction survives an unnamed one. It is a deliberately flexible step, not a missing one.',
  },
  {
    id: 'H087',
    skillTested: S.order,
    passageId: 'T4',
    prompt: 'Salt goes in at step two, before the leaves and before the heat. Why there?',
    options: [
      o('Because salt must be dissolved in open liquid before the heat is trapped under a lid'),
      o('Because salt cannot be added after cooking begins', 'Salt can certainly be added later. The text never says it cannot be.'),
      o('Because the recipe numbers it second', 'Numbering records an order. It does not explain why the order was chosen.'),
      o('Because salt goes on top for colour', 'Nothing about colour or appearance appears anywhere in this recipe.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Once the pot is covered, heat and steam are held in. Adding salt earlier gives it time to mix through.',
  },
  {
    id: 'H088',
    skillTested: S.fivew,
    passageId: 'T4',
    prompt: 'Which question about this dish can the recipe NOT answer?',
    options: [
      o('How long does it take?', 'One hour is given in the last step.'),
      o('How much rice do I use?', 'Three cups are given in step one.'),
      o('What heat should I use?', 'Medium heat is named in step four.'),
      o('How should it taste when it is ready?'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! The recipe stops at actions and never describes the result. Taste is left to the cook, which is the craft of the text.',
  },
  {
    id: 'H089',
    skillTested: S.fact,
    passageId: 'T4',
    prompt: 'Which of these is an opinion dressed as a cooking instruction?',
    options: [
      o('Rinse the rice until the water runs clear', 'The text asks for three rinses. Running clear is an outside addition, but it is still an action, not a judgement.'),
      o('Use the finest kalamansi you can find'),
      o('Add one tablespoon of salt to the pot', 'That is a written step with a written amount.'),
      o('Boil the pot over medium heat', 'That is step four exactly as written.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Calling leaves the finest is a judgement the text never makes. It simply says three stalks, with no ranking involved.',
  },
  {
    id: 'H090',
    skillTested: S.fact,
    passageId: 'T4',
    prompt: 'Why can the text NOT support the claim that this soup needs three hours?',
    options: [
      o('Because it names an hour, and one hour is not three'),
      o('Because the text says nothing about time at all', 'One hour is given in the last step, so time is clearly in the text.'),
      o('Because boiling takes exactly an hour', 'That would be outside knowledge. The text gives the hour, not a rule about boiling.'),
      o('Because three hours is longer than any recipe', 'Recipes can take far longer. Do not argue from general rules about cooking.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! The stated hour is the cooking the text describes. Nothing supports stretching that into three.',
  },
  {
    id: 'H091',
    skillTested: S.who,
    passageId: 'T4',
    prompt: 'Who does the recipe imagine at the stove?',
    options: [
      o('A professional cook', 'The steps are written out in full for anyone. Nothing marks them as expert-only.'),
      o('A teacher demonstrating to a class', 'No class, lesson, or demonstration appears anywhere in the text.'),
      o('Anyone who has never cooked this dish before'),
      o('The writer, writing down their own cooking', 'The writer never claims the pot is theirs. The recipe is handed to whoever is cooking.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Every ingredient and timing is stated, and the reasoning is spelled out. That is written for a first attempt.',
  },
  {
    id: 'H092',
    skillTested: S.who,
    passageId: 'T4',
    prompt: 'The recipe names no person, yet something is being cooked FOR. What can you safely say?',
    options: [
      o('Nothing at all, because no person is named', 'A recipe can serve unnamed people. That absence does not close the question.'),
      o('The cook is the only person involved', 'Cooking is a shared act in most kitchens, and the text does not claim solitude.'),
      o('The writer knows exactly how many people are eating, but does not say', 'The writer is not credited with knowing anything. A recipe that withheld a headcount would be a strange omission.'),
      o('The text implies there are people to feed, though it never says how many'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! You can say people will eat it. You cannot count them, name them, or divide the portions. Stop at what the text supports.',
  },

  /* ---------------------------------------------------------------------------
     T5 - "The Agusan River" (description, inform)
     Hard weight: a description is a set of choices about what to notice. The
     strongest items here are about what the writer pointedly did not say.
     --------------------------------------------------------------------------- */
  {
    id: 'H093',
    skillTested: S.type,
    passageId: 'T5',
    prompt: 'This text mentions fishing, and fishing involves actions. Why is it still a description?',
    options: [
      o('Because no fishing is actually shown happening'),
      o('Because fishing is not a river topic', 'Fishing is named twice in the text. It is very much on the subject.'),
      o('Because the text is short', 'Length decides nothing. A long description is still a description.'),
      o('Because it gives no steps for fishing', 'It gives no steps, and that is part of why it describes rather than instructs. But the deeper mark is elsewhere.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! Naming an activity is not the same as showing it. Nothing here happens on stage; everything is being reported as a state.',
  },
  {
    id: 'H094',
    skillTested: S.purpose,
    passageId: 'T5',
    prompt: 'Why does the text spend a whole line on people who depend on fishing?',
    options: [
      o('To warn people away from the river', 'Nothing warns anyone. The line says many people depend on it, which is the opposite.'),
      o('To show that describing a place can also reveal what that place is for'),
      o('To prove the river is beautiful', 'No judgement about beauty appears. The text stays on facts throughout.'),
      o('To fill the last line', 'The turn to people is deliberate. Writers do not choose an ending to fill space.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The river is not only scenery. That line shows a place has a job in people\'s lives, which is still informing.',
  },
  {
    id: 'H095',
    skillTested: S.purpose,
    passageId: 'T5',
    prompt: 'The text describes rather than argues. How can you tell, when describing can look like persuasion?',
    options: [
      o('Because it contains no opinion at all', 'Careful. Describing well can flatter. What matters is that it never argues for a course of action.'),
      o('Because it never asks the reader to visit, buy, or do anything'),
      o('Because it is about a river, and rivers cannot be sold', 'Plenty of persuasive texts are about places. The subject is not the test.'),
      o('Because it gives no prices', 'Prices are not what separate the two. A persuasive text can avoid numbers entirely.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! A description can be flattering and still be a description. The absence of any call on the reader is the reliable mark.',
  },
  {
    id: 'H096',
    skillTested: S.topic,
    passageId: 'T5',
    prompt: 'The text moves from water to people. Why does it end there rather than back on the water?',
    options: [
      o('To prove the river is dangerous to fish in', 'No danger is described. The last line says people depend on fishing.'),
      o('To give the description a reason to exist beyond scenery'),
      o('Because the writer ran out of things to say about the river', 'Writers do not stop because they run out. The turn is a deliberate choice.'),
      o('To make the people the main topic of the whole text', 'That would overstate it. The river stays the subject; the people show what it means.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! A description can end on consequence. That turn gives the river a point beyond how it looks.',
  },
  {
    id: 'H097',
    skillTested: S.topic,
    passageId: 'T5',
    prompt: 'Which title would narrow this text too far?',
    options: [
      o('The Agusan River', 'The text is about the river throughout. That title fits.'),
      o('Life in the Agusan River', 'That covers the water and what lives in it, which is most of the text.'),
      o('Fishing Families of the Agusan'),
      o('A River in Eastern Mindanao', 'That names the place and the subject. It fits the text closely.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! One closing line about dependence is not a portrait of families. That title would promise far more than five sentences carry.',
  },
  {
    id: 'H098',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'What can you NOT work out from this description, however carefully you read?',
    options: [
      o('How the river changes across the year', 'The wet-season swelling is stated, so the change is available.'),
      o('How many fish the river holds'),
      o('Whether the water is clear', 'Clear is stated outright in the second sentence.'),
      o('Whether people use the river', 'The last sentence says many people depend on fishing.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The text says fish can be seen. It gives no quantity at all, and that gap cannot be closed from these five lines.',
  },
  {
    id: 'H099',
    skillTested: S.details,
    passageId: 'T5',
    prompt: 'The phrase "for most of the year" does quiet work. What is its job?',
    options: [
      o('To claim the river is always shallow', 'For most is not always. The phrase deliberately leaves room for the other part of the year.'),
      o('To point ahead to the wet-season exception'),
      o('To warn that the river dries up', 'Nothing about drying up appears. Heavy rain actually makes the river swell.'),
      o('To suggest the water is dangerous to cross', 'Shallow is the opposite of dangerous to cross, and no danger is described.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The phrase sets up an expectation, and the very next sentence delivers the exception. That pairing is deliberate.',
  },
  {
    id: 'H100',
    skillTested: S.order,
    passageId: 'T5',
    prompt: 'The writer puts the seasonal change third. Why there rather than last?',
    options: [
      o('To bury the most important detail at the end', 'Placing it third is not burying it. The text gives no sense of ranking its lines.'),
      o('So the fish and the people come after the river has been shown changing, which gives them a setting'),
      o('Because the writer forgot the earlier lines', 'The text is short and orderly. Nothing suggests it lost track of itself.'),
      o('To make the reader think the river never changes', 'The change is stated plainly. Placement does not hide what is written.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Once the river has a shape and a rhythm, what lives in it and who depends on it land against that setting.',
  },
  {
    id: 'H101',
    skillTested: S.order,
    passageId: 'T5',
    prompt: 'If the last two lines were swapped, what would be lost?',
    options: [
      o('Nothing, because both lines are about fishing', 'One line is about what lives in the water, the other about people. They are not the same thing.'),
      o('The link between the river as habitat and the river as a livelihood'),
      o('The description of the water', 'The water is described in the first three lines, which the swap does not touch.'),
      o('The claim that the river is shallow', 'Shallow is in the second line. Swapping the last two changes nothing there.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Habitat and livelihood are different claims. The order is what connects a river that holds life to people who live by it.',
  },
  {
    id: 'H102',
    skillTested: S.fivew,
    passageId: 'T5',
    prompt: 'The text gives no date. What does it offer instead of a "when"?',
    options: [
      o('A single named day, like Wednesday', 'No day is named anywhere in this description. That is a fact from a different text.'),
      o('A season, and the river\'s state within it'),
      o('Nothing at all, so the question cannot be answered', 'The wet season is named, so a when is partly available. It is the date that is missing.'),
      o('An approximate length of time, in years', 'No number of years appears anywhere in the text.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The wet season answers when the river swells. The text simply does not fix a date, and that gap is honest.',
  },
  {
    id: 'H103',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Why is "the Agusan River is the cleanest river in Mindanao" an opinion, despite having no marker word?',
    options: [
      o('Because it mentions a river', 'Being about a river makes nothing true. Plenty of factual sentences are about rivers.'),
      o('Because cleanest is a comparison, and the text compares this river with nothing'),
      o('Because it is longer than the other sentences', 'Length says nothing about fact or opinion.'),
      o('Because Mindanao is a place name', 'Place names appear in the text as plain facts. Naming a place is not a judgement.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Calling a river the cleanest ranks it against all others. The text never makes that comparison, so nothing supports it.',
  },
  {
    id: 'H104',
    skillTested: S.fact,
    passageId: 'T5',
    prompt: 'Someone concludes the river is deep because it holds fish. Why does the text not support that?',
    options: [
      o('Because fish need deep water, and that is outside knowledge', 'The problem is not outside knowledge. The text itself says the water is shallow.'),
      o('Because the text never says the river is deep'),
      o('Because shells need shallow water, and shells prove nothing', 'That is about shells, and it is not the gap. The text states depth directly.'),
      o('Because the river swells in the wet season, so depth changes', 'Seasonal change is real, but the text still describes the water as shallow for most of the year.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The second sentence settles it: clear and shallow for most of the year. What lives there does not change what it says.',
  },
  {
    id: 'H105',
    skillTested: S.who,
    passageId: 'T5',
    prompt: 'The text names no individual. Why is that a deliberate choice rather than a gap?',
    options: [
      o('Because the writer had not met anyone', 'Nothing says the writer met nobody. That would be inventing a fact to explain an absence.'),
      o('Because naming one person would shrink a description of a whole river and the people who depend on it'),
      o('Because names are private information', 'That is a real concern in some settings, but the text gives no sign it is the reason here.'),
      o('Because there are no people in the river', 'People depend on it. They are present in the text, just not by name.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! One named person would turn a general account into a portrait. The writer keeps the focus on the river instead.',
  },
  {
    id: 'H106',
    skillTested: S.who,
    passageId: 'T5',
    prompt:
      'The text says many people depend on fishing for a living, yet names nobody. What can you still work out about those people?',
    options: [
      o('Exactly how many fishers there are', 'The text says "many", which is deliberately vague. It gives no number and no way to count them.'),
      o('That their livelihood is tied to the river being healthy, since they depend on it for food and income'),
      o('That they live beside the river', 'Depending on a river for a living suggests it, but the text never says where they live. That would be adding a fact.'),
      o('That fishing is their only trade', 'The text gives one source of income and does not rule out others. "Only" goes beyond what is written.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! You cannot count them or place them, but you can see that the river\'s condition decides whether they can earn. That link is stated, even though the people are not.',
  },

  /* ---------------------------------------------------------------------------
     T6 - "A Night by the Shore" (narrative, entertain)
     Hard weight: nothing in this story is explained. Every meaning is carried
     by an object or a placement, and the highest reading is what stays unsaid.
     --------------------------------------------------------------------------- */
  {
    id: 'H107',
    skillTested: S.type,
    passageId: 'T6',
    prompt: 'The story names a shore, a night, and something new in the sky. Why is it still not news?',
    options: [
      o('Because news must be written in the past tense', 'Tense does not decide a type. A report can describe something happening right now.'),
      o('Because a place is named', 'News reports name places constantly. That is one of their clearest marks.'),
      o('Because it is short', 'News reports can be any length. A long report is still a report.'),
      o('Because a person is experiencing it from inside, with no reported facts or figures'),
    ],
    correctIndex: 3,
    explanation:
      'Correct! Location and novelty can belong to either kind of text. The inside view of one person is what makes this a story.',
  },
  {
    id: 'H108',
    skillTested: S.type,
    passageId: 'T6',
    prompt: 'What separates this narrative from a description of the same shore?',
    options: [
      o('The description would use the word "quiet"', 'A description could easily use that word. It is not what separates the two.'),
      o('The description would not include a person standing there'),
      o('The description would be longer', 'Length is not the divider between telling and showing.'),
      o('The description would name the stars', 'Stars belong in descriptions of night scenes constantly. Naming them changes nothing.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! A description can hold that shore, that quiet, and those stars. Remove the person and the story becomes a scene.',
  },
  {
    id: 'H109',
    skillTested: S.purpose,
    passageId: 'T6',
    prompt: 'Why does the story open on quiet?',
    options: [
      o('To warn readers off the shore at night', 'Nothing warns anyone. The shore is simply still, and she goes there.'),
      o('To set the stillness that makes one small change land later'),
      o('To say the shore is always empty', 'Quiet is not empty, and the text never claims the shore is always quiet.'),
      o('To explain the town before the story starts', 'No explanation of the town follows. The word is there for mood.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The stillness is set up so that the star means something when it arrives. Quiet is being used as preparation.',
  },
  {
    id: 'H110',
    skillTested: S.purpose,
    passageId: 'T6',
    prompt: 'The story ends before anything is resolved. Why does the writer choose that?',
    options: [
      o('Because the writer forgot to finish', 'The ending is shaped, not cut short. It closes on a chosen thought.'),
      o('To leave the reader holding the same unresolved feeling she has'),
      o('Because a story must always end on a mystery', 'Plenty of stories resolve fully. Ending open is a choice here, not a rule.'),
      o('To save space', 'Five sentences is not a space-saving edit. The open ending is deliberate craft.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! She lies down still waiting. Handing the reader that same unfinished feeling is the point of the ending.',
  },
  {
    id: 'H111',
    skillTested: S.topic,
    passageId: 'T6',
    prompt: 'The star is the most vivid thing in the story. Why is it not the topic?',
    options: [
      o('Because it is only one line long', 'Length does not set a topic. A single line can carry a whole subject.'),
      o('Because the star is described, not acted upon'),
      o('Because topics must be people', 'Topics can be places, objects, or ideas. A character is not the only possible subject.'),
      o('Because the topic is the sea', 'The sea is only where she is standing. The story is about what she does while waiting there.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! She does not react to it, and the story does not explain it. A vivid moment is not automatically the subject.',
  },
  {
    id: 'H112',
    skillTested: S.topic,
    passageId: 'T6',
    prompt: 'Which word best names what this story is really following?',
    options: [
      o('Waiting'),
      o('Fishing', 'Fishing appears only as scales in a pocket. It is a trace, not the thread.'),
      o('Starlight', 'The star is one line. It does not carry the story.'),
      o('News', 'The news is mentioned only as something others will hear tomorrow. It is not the subject here.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! She stands, waits, sees one change, and lies down still waiting. That thread runs through every line.',
  },
  {
    id: 'H113',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'The fish scales in her pocket are never explained. Why does the writer include them?',
    options: [
      o('To show the reader she is a fisher', 'The story never says what she does. Scales show a connection to fishing, not a job.'),
      o('To give the reader one true thing about her without stating it'),
      o('To show the pocket is old', 'Nothing about the age of the shirt or the pocket appears anywhere.'),
      o('To warn her that she has been in the water', 'No warning and no swim appear. Do not build an instruction that is not there.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! The detail is offered and left open. You can say she has a connection to fishing and stop there, which is the craft.',
  },
  {
    id: 'H114',
    skillTested: S.details,
    passageId: 'T6',
    prompt: 'Which detail does the story work hardest to keep unexplained?',
    options: [
      o('The road she is looking at', 'The story gives no detail about the road at all, so there is nothing here to weigh.'),
      o('The light she is looking for'),
      o('The quiet of the shore', 'The quiet is named in the first line and left as mood. It is not a withheld fact.'),
      o('The water above which the star shone', 'The water is mentioned plainly. The thing left open is the meaning, not the water.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! She looks for a light, and the story never says whose it is. That deliberate gap is what the whole scene turns on.',
  },
  {
    id: 'H115',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'The star appears fourth, immediately before she lies down. What does that placement do?',
    options: [
      o('It makes the star the resolution of her waiting', 'Nothing in the story says the star is what she was waiting for. That reading goes too far.'),
      o('It raises her hope and then denies the reader a payoff, because she lies down still unresolved'),
      o('It buries the ending so the star is forgotten', 'The star is the last real change in the story. It is not buried.'),
      o('It shows the night is ending', 'Nothing about the hour or the ending of the night appears. The star simply shone.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! One new thing arrives, and the closing line refuses to pay it off. That gap is what the reader carries away.',
  },
  {
    id: 'H116',
    skillTested: S.order,
    passageId: 'T6',
    prompt: 'If the star line were moved to the very first sentence, what would break?',
    options: [
      o('Nothing, since the events would still be in order', 'The events would be, but the build would be gone. Placement is what makes the star matter.'),
      o('The quiet opening that the small change depends on'),
      o('The fact that she lies down at the end', 'The ending would survive the move. What breaks is the preparation for the star.'),
      o('The mention of the fish scales', 'The scales are in a different sentence and are unaffected by moving the star line.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! Put the star first and there is no stillness for it to interrupt. The quiet is not decoration; it is the setup.',
  },
  {
    id: 'H117',
    skillTested: S.fivew,
    passageId: 'T6',
    prompt: 'The story raises several questions and answers almost none. Which one is left entirely open?',
    options: [
      o('Where is she standing?', 'The shore of Quezon is named in the first line.'),
      o('What is she doing?', 'She stands looking for a light, then lies down. Both are stated.'),
      o('Who is she waiting for?'),
      o('What happens the next day?', 'The last line says they would only hear the news tomorrow. The story stops there by choice.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Place and action are both given. The person she waits for is never named, and no answer is offered.',
  },
  {
    id: 'H118',
    skillTested: S.fact,
    passageId: 'T6',
    prompt: 'Which reading of the star is an opinion the story does not support?',
    options: [
      o('The star was a sign that her waiting would end well'),
      o('A star shone above the water', 'That is written in the fourth sentence, so it is a fact.'),
      o('She stood near the sea', 'That is written in the story, so it is a fact.'),
      o('She lay down at the end', 'That is the closing sentence, so it is a fact.'),
    ],
    correctIndex: 0,
    explanation:
      'Correct! It is shining, that is all. Reading a promise into it goes past anything the story actually says.',
  },
  {
    id: 'H119',
    skillTested: S.fact,
    passageId: 'T6',
    prompt: 'Someone claims the story proves she is waiting for a boat. Why is that unsafe?',
    options: [
      o('Because boats are never in this story', 'True, but that is the least interesting reason. The real problem is the word proves.'),
      o('Because the story never names what she is waiting for, so nothing can be settled from it'),
      o('Because she is on land, so no boat could arrive', 'She is near the sea. Land alone would not rule a boat out.'),
      o('Because waiting for a boat is a common story', 'How common something is says nothing about what this particular text supports.'),
    ],
    correctIndex: 1,
    explanation:
      'Correct! She is looking for a light and waiting. The story withholds the object, so any specific claim outruns the text.',
  },
  {
    id: 'H120',
    skillTested: S.who,
    passageId: 'T6',
    prompt: 'Who is this story told from?',
    options: [
      o('From the writer, describing a scene they observed', 'The writer never claims to be watching. The viewpoint stays inside the scene.'),
      o('From the people who will hear the news tomorrow', 'They are named only as an offstage thought in the last line. They are not the viewpoint.'),
      o('From inside the woman, close to her looking and thinking'),
      o('From an unnamed narrator standing further back', 'Nothing suggests a distance. The story stays as close as her own attention.'),
    ],
    correctIndex: 2,
    explanation:
      'Correct! Everything is filtered through what she notices and what she thinks. That closeness is what makes it a narrative.',
  },
]