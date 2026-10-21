import type { SYMBOL_IDS } from '@/content/schemas'

type SymbolId = (typeof SYMBOL_IDS)[number]

/* ===========================================================================
   THE EIGHT SKILL SYMBOLS, hand-drawn as inline SVG (art bible 14.5).

   Art bible 14.5 says this explicitly: draw the icons, do not generate them.
   Hand-drawn SVG is far more consistent across a set than an image model, and
   these need to hold a 24px cell on a 320px screen in bright sunlight.

   2px navy stroke, 24x24 viewBox, rounded caps and joins, no fill. The same
   glyph appears on the skill card, the lesson header, the statistics breakdown
   and the printed report, and that reuse is what makes it read as designed.

   These are drawn inline rather than loaded as a sprite sheet because they are
   needed on first paint of the welcome screen, and a sprite fetch there would
   show a blank box.
   =========================================================================== */

const GLYPHS: Record<SymbolId, string> = {
  /* Text Type - a page with a folded corner. */
  'paper-fold': 'M5 3h9l5 5v13H5zM14 3v5h5M7.5 12.5h9M7.5 16h6',
  /* Purpose - one speech bubble with a tail. */
  speech: 'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z',
  /* Main Topic - a magnifier over lines of text. */
  magnifier: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M15 15l5 5M7.5 9h6M7.5 12.5h4',
  /* Key Details - a pointer indicating one line among several. */
  'hand-point': 'M4 5h16M4 9h16M4 13h11M4 17h11M16.5 14.5l4 2.5-4 2.5z',
  /* Sequence - three stepping stones across water. */
  'stepping-stones': 'M5.5 17.5a3.5 2.2 0 1 0 0-.01M12 12.5a3 1.9 0 1 0 0-.01M18 7.5a2.5 1.6 0 1 0 0-.01M3 21h18',
  /* Wh-Questions - an eye inside a bracket. */
  'eye-bracket': 'M9 4H4v16h5M15 4h5v16h-5M9 12c1-2.2 2.1-3.3 3-3.3S14 9.8 15 12c-1 2.2-2.1 3.3-3 3.3S10 14.2 9 12',
  /* Fact or Opinion - a balance scale with a level beam. */
  scale: 'M12 4v16M7.5 20h9M3.5 8h17M3.5 8 1.5 13.5h4zM20.5 8l-2 5.5h4z',
  /* Characters - two overlapping speech bubbles. */
  'speech-overlap': 'M3 4.5h12v9H9l-3.5 3.5v-3.5H3zM8 9h13v9h-2v3.5L15.5 18H8z',
}

export function SkillSymbol({
  id,
  size = 24,
  color = 'var(--color-indigo)',
  className = '',
}: {
  id: string
  size?: number
  color?: string
  className?: string
}) {
  const d = GLYPHS[id as SymbolId]
  // A missing glyph must not blank a card. Fall back to the speech bubble,
  // which is the least wrong generic mark, rather than rendering nothing.
  const path = d ?? GLYPHS.speech
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={path} />
    </svg>
  )
}