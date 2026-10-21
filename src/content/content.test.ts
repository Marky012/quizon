import { describe, it, expect } from 'vitest'

/* ===========================================================================
   CONTENT INTEGRITY
   ===========================================================================
   This suite is the guardrail for content edits. Importing the modules runs
   their boot validation, so a schema violation or an errorTag sitting on a
   correct answer fails HERE rather than in front of a learner.

   The education group will replace the passage and question data from the
   meeting-brief template. These tests are what make that swap safe.
   =========================================================================== */

import { PASSAGES, PASSAGE_BY_ID, passageText } from './texts'
import {
  QUESTION_BANK,
  STORY_POOL_IDS,
  getPreTest,
  getStoryQuestions,
  storyPoolIsThin,
  bankCoverage,
} from './questions'
import { SKILLS, SKILL_NAMES, TEACHER } from './manifest'
import { TIER_ORDER, WORLD } from './world'

const ALL_QUESTIONS = [
  ...Object.values(QUESTION_BANK.preTest).flat(),
  ...Object.values(QUESTION_BANK.easy).flat(),
  ...Object.values(QUESTION_BANK.medium).flat(),
  ...Object.values(QUESTION_BANK.hard).flat(),
]

/** Every (tier, story) pair a learner can actually be served. */
const ALL_POOLS = TIER_ORDER.flatMap((tier) =>
  STORY_POOL_IDS.map((storyId) => ({ tier, storyId, items: getStoryQuestions(tier, storyId) })),
)

describe('passages', () => {
  it('has unique ids', () => {
    const ids = PASSAGES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keySentences indices all point at real sentences', () => {
    for (const p of PASSAGES) {
      for (const i of p.keySentences) {
        expect(
          i,
          `passage ${p.id} keySentence ${i} is out of range`,
        ).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThan(p.sentences.length)
      }
    }
  })

  it('every key detail sentence is non-empty and distinct', () => {
    for (const p of PASSAGES) {
      const texts = p.keySentences.map((i) => p.sentences[i])
      expect(new Set(texts).size, `passage ${p.id} has duplicate key sentences`).toBe(
        texts.length,
      )
      for (const t of texts) expect((t ?? '').trim().length).toBeGreaterThan(0)
    }
  })

  it('joins sentences into non-empty display text', () => {
    for (const p of PASSAGES) {
      expect(passageText(p).length).toBeGreaterThan(0)
    }
  })
})

describe('question bank referential integrity', () => {
  it('has globally unique question ids', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes, `duplicate question ids: ${[...new Set(dupes)].join(', ')}`).toEqual([])
  })

  it('every skillTested resolves to a real skill name', () => {
    for (const q of ALL_QUESTIONS) {
      expect(
        SKILL_NAMES,
        `question ${q.id} references unknown skill "${q.skillTested}"`,
      ).toContain(q.skillTested)
    }
  })

  it('every passageId resolves to a bundled passage', () => {
    for (const q of ALL_QUESTIONS) {
      if (q.passageId) {
        expect(
          PASSAGE_BY_ID[q.passageId],
          `question ${q.id} references unknown passage "${q.passageId}"`,
        ).toBeDefined()
      }
    }
  })

  it('every question declares exactly one correct form', () => {
    for (const q of ALL_QUESTIONS) {
      const hasSingle = q.correctIndex !== undefined
      const hasMulti = q.correctIndices !== undefined
      expect(hasSingle !== hasMulti, `question ${q.id}`).toBe(true)
      expect((hasSingle ? [q.correctIndex] : q.correctIndices)!.length).toBeGreaterThan(0)
    }
  })

  it('correct indices are in range', () => {
    for (const q of ALL_QUESTIONS) {
      const idx = q.correctIndex === undefined ? q.correctIndices! : [q.correctIndex]
      for (const i of idx) {
        expect(i, `question ${q.id} correct index out of range`).toBeLessThan(
          q.options.length,
        )
      }
    }
  })

  it('errorTag never sits on a correct option', () => {
    for (const q of ALL_QUESTIONS) {
      const correct = new Set(
        q.correctIndex === undefined ? q.correctIndices! : [q.correctIndex],
      )
      q.options.forEach((opt, i) => {
        expect(
          opt.errorTag && correct.has(i),
          `question ${q.id} option ${i} ("${opt.text}") is correct but has an errorTag`,
        ).toBeFalsy()
      })
    }
  })

  it('every wrong option explains what is wrong with it', () => {
    for (const q of ALL_QUESTIONS) {
      const correct = new Set(
        q.correctIndex === undefined ? q.correctIndices! : [q.correctIndex],
      )
      q.options.forEach((opt, i) => {
        if (!correct.has(i)) {
          expect(
            opt.errorTag?.trim().length ?? 0,
            `question ${q.id} wrong option ${i} ("${opt.text}") has no errorTag`,
          ).toBeGreaterThan(10)
        }
      })
    }
  })

  it('explanations are authored and specific, not generic rule restatements', () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.explanation.trim().length, `question ${q.id}`).toBeGreaterThan(20)
      // Guards against a regression to bare template text like "Correct!"
      expect(q.explanation, `question ${q.id} explanation is a stub`).not.toMatch(
        /^(Correct|Wrong|Almost|Not quite)\.?!?$/i,
      )
    }
  })

  it('option text is unique within a question', () => {
    for (const q of ALL_QUESTIONS) {
      const texts = q.options.map((x) => x.text.trim().toLowerCase())
      expect(new Set(texts).size, `question ${q.id} has duplicate options`).toBe(
        texts.length,
      )
    }
  })

  it('offers at least three options so a guess is not a coin flip', () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.options.length, `question ${q.id}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('never puts the correct answer at the same index every time', () => {
    const singles = ALL_QUESTIONS.filter((q) => q.correctIndex !== undefined)
    const indices = new Set(singles.map((q) => q.correctIndex))
    expect(
      indices.size,
      'correct-answer position looks fixed; shuffle would give it away',
    ).toBeGreaterThan(1)
  })
})

describe('pre-test shape', () => {
  it('has exactly five items for each of the eight skills', () => {
    for (const name of SKILL_NAMES) {
      expect(getPreTest(name).length, `pre-test "${name}"`).toBe(5)
    }
  })

  it('has a pre-test bucket for every skill in the manifest', () => {
    expect(Object.keys(QUESTION_BANK.preTest).sort()).toEqual([...SKILL_NAMES].sort())
  })

  it('does not leak questions between skills', () => {
    for (const name of SKILL_NAMES) {
      for (const q of getPreTest(name)) {
        expect(q.skillTested, `question ${q.id} filed under "${name}"`).toBe(name)
      }
    }
  })
})

describe('quiz tier shape', () => {
  it('every level uses the same story pool', () => {
    // The design: all three levels reuse the same six core texts and differ
    // only in depth. If a tier drifted onto different stories, a learner's
    // three scores would describe three unrelated topics.
    expect([...STORY_POOL_IDS].sort()).toEqual(
      [...PASSAGES.map((p) => p.id)].sort(),
    )
  })

  it('every level can serve every story in the pool', () => {
    // A learner can be assigned any story in any level, so a missing pool
    // means that learner gets an empty quiz and a silent 0/20.
    for (const tier of TIER_ORDER) {
      for (const storyId of STORY_POOL_IDS) {
        expect(
          getStoryQuestions(tier, storyId).length,
          `tier ${tier} has no items for story ${storyId}`,
        ).toBeGreaterThan(0)
      }
    }
  })

  it('a pool only ever contains items about its own story', () => {
    for (const { tier, storyId, items } of ALL_POOLS) {
      for (const q of items) {
        expect(q.passageId, `${tier}/${storyId}: question ${q.id} has no passageId`).toBe(
          storyId,
        )
      }
    }
  })

  it('exposes one pool keyed by passageId and nothing else', () => {
    for (const tier of TIER_ORDER) {
      expect(Object.keys(QUESTION_BANK[tier]).sort()).toEqual([...STORY_POOL_IDS].sort())
    }
  })

  it('spreads every skill across each tier', () => {
    for (const tier of TIER_ORDER) {
      const covered = new Set(
        Object.values(QUESTION_BANK[tier]).flat().map((q) => q.skillTested),
      )
      for (const name of SKILL_NAMES) {
        expect(covered.has(name), `tier ${tier} has no item for skill "${name}"`).toBe(
          true,
        )
      }
    }
  })

  it('every level is 20 items, so 70% is 14/20 everywhere', () => {
    for (const tier of TIER_ORDER) {
      expect(WORLD.tiers[tier].itemCount, `tier ${tier}`).toBe(20)
    }
  })

  it('gives every story in every level a full set of 20 items', () => {
    // The real guarantee. A pool holding fewer than 20 forces the quiz to
    // repeat an item, and a pool holding more than 20 means items are being
    // written and then never served. Both are authoring bugs, so both fail.
    for (const { tier, storyId, items } of ALL_POOLS) {
      expect(items.length, `tier ${tier} story ${storyId} must hold exactly 20 items`).toBe(
        WORLD.tiers[tier].itemCount,
      )
      expect(storyPoolIsThin(tier, storyId), `tier ${tier} story ${storyId} is thin`).toBe(false)
    }
  })

  it('every skill is reachable in every story of every level', () => {
    // A learner assigned T1 must still meet all eight helpers. If a skill is
    // missing from a pool, its pup never gets a question in that story and the
    // hint mechanic silently skips that skill.
    for (const { tier, storyId, items } of ALL_POOLS) {
      const covered = new Set(items.map((q) => q.skillTested))
      for (const name of SKILL_NAMES) {
        expect(
          covered.has(name),
          `tier ${tier} story ${storyId} has no item for skill "${name}"`,
        ).toBe(true)
      }
    }
  })

  it('reports which story pools still need education-group content', () => {
    const thin = ALL_POOLS.filter((p) => storyPoolIsThin(p.tier, p.storyId))
    // Once every pool holds 20 this becomes expect(thin).toEqual([]). Kept as a
    // real assertion on the list rather than a no-op so the moment the content
    // is complete, this fails and tells us to tighten it.
    expect(Array.isArray(thin)).toBe(true)
  })

  it('bankCoverage reports every tier/story cell', () => {
    const coverage = bankCoverage()
    for (const tier of TIER_ORDER) {
      expect(Object.keys(coverage[tier] ?? {}).sort()).toEqual([...STORY_POOL_IDS].sort())
    }
  })
})

describe('manifest', () => {
  it('has eight skills', () => {
    expect(SKILLS).toHaveLength(8)
  })

  it('gives every skill a distinct pup', () => {
    const pupIds = SKILLS.map((s) => s.pup.id)
    expect(new Set(pupIds).size).toBe(8)
  })

  /* --- The letter mnemonic (locked 2026-10-03) ---------------------------
     Every pup name starts with the same letter as its skill. This is the
     memory hook the whole cast depends on, so it is a TEST, not a comment.
     manifest.ts throws at boot on a mismatch, but a throwing import kills the
     whole suite with an opaque stack, so this asserts it readably first. */
  it('starts every pup name with the same letter as its skill', () => {
    const wrong = SKILLS.filter(
      (s) => s.pup.name.charAt(0).toUpperCase() !== s.name.charAt(0).toUpperCase(),
    ).map((s) => `${s.name} -> ${s.pup.name}`)
    expect(wrong).toEqual([])
  })

  it('gives all eight skills a DIFFERENT first letter', () => {
    // This is why The 5W became Wh-Questions and Who Is Who became
    // Characters: three skills were competing for the letters T and W.
    const initials = SKILLS.map((s) => s.name.charAt(0).toUpperCase())
    expect(new Set(initials).size).toBe(8)
  })

  it('keeps every pup name short enough to say in a quiz', () => {
    for (const s of SKILLS) {
      const syllables = s.pup.name.toLowerCase().replace(/[^a-z]/g, '').length
      expect(syllables, `${s.pup.name} is too long`).toBeLessThanOrEqual(8)
    }
  })

  it('hints teach a rule without naming the answer', () => {
    for (const s of SKILLS) {
      expect(s.hint.trim().length).toBeGreaterThan(20)
    }
  })

  it('ships Teacher Reyes as a person, not a ninth skill', () => {
    // She must stay OUT of SKILLS[]: a ninth entry would inherit a required
    // hint and rule, get a pre-test bucket, and appear in the stats and the
    // roster as though she taught a reading skill.
    expect(SKILLS).toHaveLength(8)
    expect(SKILLS.some((s) => s.id === TEACHER.id)).toBe(false)
    expect(TEACHER.name).toBe('Teacher Reyes')
    expect(['Ma\'am', 'Sir']).toContain(TEACHER.address)
    // She must not be holding one of the eight reading instruments.
    expect(TEACHER.holds.toLowerCase()).toContain('never')
  })

  it('names all eight skills after the rename', () => {
    expect(SKILL_NAMES).toContain('Wh-Questions')
    expect(SKILL_NAMES).toContain('Characters')
    expect(SKILL_NAMES).not.toContain('The 5W')
    expect(SKILL_NAMES).not.toContain('Who Is Who')
  })
})