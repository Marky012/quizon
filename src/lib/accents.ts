import type { ACCENTS } from '@/content/schemas'

type Accent = (typeof ACCENTS)[number]

/* ===========================================================================
   ACCENT -> CSS COLOUR.

   One lookup, so no screen ever hardcodes a hex value and no screen can invent
   a colour that is not in the token set. `turquoise-deep` is deliberately a
   darkened TURQUOISE, not a new hue, so Coco does not read as Tala while the
   palette stays at eight.
   =========================================================================== */

const ACCENT_VAR: Record<Accent, string> = {
  turquoise: 'var(--color-turquoise)',
  violet: 'var(--color-violet)',
  yellow: 'var(--color-yellow)',
  lime: 'var(--color-lime)',
  indigo: 'var(--color-indigo)',
  navy: 'var(--color-navy)',
  cream: 'var(--color-cream)',
  'turquoise-deep': 'var(--color-turquoise-deep)',
}

/**
 * A soft background for an accent chip. Cream and indigo need a lighter
 * partner than the accents do, or the chip has no contrast against the page.
 */
const ACCENT_SOFT_VAR: Record<Accent, string> = {
  turquoise: 'var(--color-turquoise-soft)',
  violet: 'var(--color-violet-soft)',
  yellow: 'var(--color-yellow-soft)',
  lime: 'var(--color-lime-soft)',
  indigo: 'var(--color-indigo-soft)',
  navy: 'var(--color-indigo-soft)',
  cream: 'var(--color-indigo-soft)',
  'turquoise-deep': 'var(--color-turquoise-soft)',
}

/**
 * Ink that sits ON this accent. White fails contrast on turquoise and lime, so
 * indigo is used there instead (art bible 2.3).
 */
const ACCENT_INK: Record<Accent, string> = {
  turquoise: 'var(--color-on-turquoise)',
  violet: 'var(--color-cream)',
  yellow: 'var(--color-indigo)',
  lime: 'var(--color-on-lime)',
  indigo: 'var(--color-cream)',
  navy: 'var(--color-cream)',
  cream: 'var(--color-indigo)',
  'turquoise-deep': 'var(--color-cream)',
}

export function accentVar(accent: Accent): string {
  return ACCENT_VAR[accent]
}

export function accentSoftVar(accent: Accent): string {
  return ACCENT_SOFT_VAR[accent]
}

export function accentInk(accent: Accent): string {
  return ACCENT_INK[accent]
}

/**
 * TRUE for the accents that need a visible outline to exist at all.
 *
 * Franky's cream coat on a cream page disappears, which is exactly the case
 * art bible 1.3 and 3.2 flag. Any component placing a cream shape on a cream
 * field must add a navy border.
 */
export function needsOutline(accent: Accent): boolean {
  return accent === 'cream'
}