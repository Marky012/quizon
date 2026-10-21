/* ===========================================================================
   SEEDED RANDOMNESS

   WHY THIS EXISTS. buildLevelQuiz draws its 20 items with a weighted shuffle
   and then shuffles each item's options. Both use Math.random by default, which
   means the SAME attempt is not reproducible: a learner who leaves the quiz at
   item 16 and comes back would be handed a different set of 20 questions, with
   item 16 now showing something they had already answered.

   For a resumable attempt that is not acceptable. An attempt has to be the same
   20 questions in the same order, with the same options in the same order, or
   "resume" silently becomes "start a subtly different test".

   The fix is to make the randomness a SEED rather than a moment. A seed is a
   plain integer, so it round-trips through persisted state and reproduces the
   identical draw on any device, forever. mulberry32 is used because it is
   32-bit, fast, has no dependencies, and passes gjrand well enough for
   shuffling a 20-item list - this is not a cryptographic use.

   DEFAULT BEHAVIOUR IS UNCHANGED. Every consumer that does not pass a rand
   still gets Math.random, so existing call sites and tests behave exactly as
   before. Only an explicitly seeded call is reproducible.
   =========================================================================== */

/** mulberry32. Returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A fresh random seed. Used when an attempt STARTS, never when it resumes.
 * Returns an integer so it survives JSON round-tripping intact.
 */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

/**
 * Hashes a string to a 32-bit seed, so a stable key (a story id, a question id)
 * can drive a reproducible shuffle without inventing a seed to remember.
 */
export function seedFromString(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}