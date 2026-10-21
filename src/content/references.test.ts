import { describe, it, expect } from 'vitest'
import { WORLD } from './world'
import { assertKnownPupId, PUP_BY_ID, SKILLS, SKILL_BY_NAME } from './manifest'
import { SPECIES_KIND, SPECIES_NAME } from './schemas'

/* ===========================================================================
   CROSS-FILE REFERENCES.

   WORLD.intro holds plain pup-id STRINGS, so no schema validates them. A pup
   rename therefore leaves the intro panels pointing at nothing, silently: the
   panels simply render an empty avatar. That already happened once, when the
   panels kept the old ids kulay and sukat after the 2026-10-03 cast change.
   These tests are the guardrail.
   =========================================================================== */

describe('WORLD.intro pup references', () => {
  it('references only pups that actually exist', () => {
    for (const panel of WORLD.intro) {
      expect(PUP_BY_ID, `intro panel "${panel.title}"`).toHaveProperty(panel.pupId)
      expect(() => assertKnownPupId(panel.pupId, `WORLD.intro "${panel.title}"`)).not.toThrow()
    }
  })

  it('rejects a pup id that no longer exists', () => {
    expect(() => assertKnownPupId('kulay', 'test')).toThrow(/not in SKILLS/)
    expect(() => assertKnownPupId('sukat', 'test')).toThrow(/not in SKILLS/)
  })

  it('uses three different helpers, so the intro shows a cast not a portrait', () => {
    const ids = WORLD.intro.map((p) => p.pupId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('WORLD tier naming', () => {
  it('keeps a stable id separate from the display name', () => {
    // The ids are persisted in learner progress; the names are free to change.
    expect(WORLD.tiers.easy.id).toBe('easy')
    expect(WORLD.tiers.medium.id).toBe('medium')
    expect(WORLD.tiers.hard.id).toBe('hard')
  })

  it('gives every level an English name and a Tagalog name', () => {
    for (const tier of Object.values(WORLD.tiers)) {
      expect(tier.name.length).toBeGreaterThan(0)
      expect(tier.tagalog.length).toBeGreaterThan(0)
      expect(tier.name).not.toBe(tier.tagalog)
    }
  })
})

describe('WORLD stages', () => {
  it('no longer implies combat', () => {
    expect(WORLD.stages.arena.name).toBe('Reading Trail')
  })

  /* THREE stages, not four. Pup Roster was deleted on 2026-10-05: the earned
     pack now sits on the Hub's grass bench under the carousel, so it is always
     on screen without a destination to navigate to.

     These keys are NOT persisted, despite what world.ts used to claim. The store
     persists `skill.id`, `pup.id` and tier ids; nothing ever wrote a stage key.
     Asserting the exact list here is a guard against a stage being reintroduced
     by accident, which is the only thing this test can now catch. */
  it('keeps exactly the three stage ids the router depends on', () => {
    expect(Object.keys(WORLD.stages).sort()).toEqual(['arena', 'chronicle', 'training'])
  })

  it('has no Pup Roster stage left behind', () => {
    expect(Object.keys(WORLD.stages)).not.toContain('preTest')
    expect(JSON.stringify(WORLD.stages)).not.toMatch(/roster/i)
  })
})

describe('pup references in skill metadata', () => {
  it('every skill name resolves back to a skill, since questions join on NAME', () => {
    for (const name of Object.keys(SKILL_BY_NAME)) {
      expect(SKILL_BY_NAME[name]!.name).toBe(name)
    }
  })
})

/* ===========================================================================
   THE SPECIES IS DOGS. Locked 2026-10-04.

   The art bible said "bird" - plumage, three-feather crest, wings, beak, two
   rounded toes per foot - for as long as the product existed, while the code
   said pup, the UI said Pup Roster, the world config said Alon Pack, and
   PupAvatar.tsx had a component literally called PupAvatar. Nothing caught it
   because species was never a FIELD. It lived only as prose in a text file that
   no test reads, which is the same reason "one wing raised" survived inside a
   manifest string that ships to the app.

   So these tests read the manifest, which is the thing that cannot quietly
   disagree with itself.
   =========================================================================== */

const BIRD_WORDS = /\b(wing|wings|feather|feathers|plumage|beak|talon|talons|crest|avian|bird|birds)\b/i

describe('species', () => {
  it('is a dog, and the word used in world copy is Woof', () => {
    expect(SPECIES_KIND).toBe('dog')
    expect(SPECIES_NAME).toBe('Woof')
  })

  it('leaves no bird anatomy anywhere in the pup metadata', () => {
    for (const skill of SKILLS) {
      const p = skill.pup
      for (const [field, value] of [
        ['trait', p.trait],
        ['breed', p.breed],
        ['ears', p.ears],
        ['cap', p.cap],
        ['outfit', p.outfit],
      ] as const) {
        expect(value, `${p.name}.${field} still describes a bird`).not.toMatch(BIRD_WORDS)
      }
    }
  })

  it('builds its place names from the species word, so a rename is one edit', () => {
    expect(WORLD.stages.training.name).toBe(`${SPECIES_NAME} School`)
    const pack = WORLD.intro.find((p) => p.title.includes('Pack'))
    expect(pack?.title).toBe(`The ${SPECIES_NAME} Pack`)
  })
})

describe('the eight are distinguishable at 88px', () => {
  it('uses eight different breeds', () => {
    const breeds = SKILLS.map((s) => s.pup.breed)
    expect(new Set(breeds).size, `duplicate breed: ${breeds.join(', ')}`).toBe(SKILLS.length)
  })

  it('uses eight different ear descriptions, since ears are the read at 88px', () => {
    const ears = SKILLS.map((s) => s.pup.ears)
    expect(new Set(ears).size, `duplicate ears: ${ears.join(' / ')}`).toBe(SKILLS.length)
  })

  it('uses eight different cap styles, so eight caps do not read as a uniform', () => {
    const caps = SKILLS.map((s) => s.pup.cap)
    expect(new Set(caps).size, `duplicate cap: ${caps.join(' / ')}`).toBe(SKILLS.length)
  })

  it('gives every pup an outfit, and never puts one garment on all eight', () => {
    const outfits = SKILLS.map((s) => s.pup.outfit)
    expect(outfits.every((o) => o.length > 0)).toBe(true)
    expect(new Set(outfits).size).toBe(SKILLS.length)
  })
})

describe('the letter mnemonic', () => {
  it('holds for all eight, which is the whole reason two skills were renamed', () => {
    for (const skill of SKILLS) {
      expect(skill.pup.name.charAt(0), `${skill.name} / ${skill.pup.name}`).toBe(
        skill.name.charAt(0),
      )
    }
  })

  it('does not let two skills compete for one letter', () => {
    const letters = SKILLS.map((s) => s.name.charAt(0))
    expect(new Set(letters).size, `two skills share a letter: ${letters.join('')}`).toBe(
      SKILLS.length,
    )
  })
})