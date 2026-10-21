import { useMemo, type CSSProperties } from 'react'
import { useReducedMotion } from '@/lib/useReducedMotion'

/* ===========================================================================
   CONFETTI BURST - the celebration for a freshly-earned pup, fired on the Hub
   when the learner returns after a perfect pre-test.

   PURE DECORATION, and therefore fully disposable under reduced motion: the
   fact the pup is earned is already in the bench (full colour), the Woof
   School card (the earned badge) and the Record (the Skill check). The burst
   exists to make "that one is yours now" land on the home screen, not to be
   the way that fact is communicated.

   IMPLEMENTATION. One keyframe, two dozen pieces. Each piece is a span that
   the CSS moves across the whole viewport via translate3d with per-piece
   custom properties (start x, drift, start rotation, end tilt) set inline;
   the animation itself is the shared `--animate-confetti` token. Every piece
   ends at 108vh with `forwards`, so the overlay simply stops showing anything
   and the Hub unmounts it after the longest possible run.

   NOT a stacking context for real content: the overlay is pointer-events-none
   and the whole component is aria-hidden, so the carousel and the bench stay
   fully interactive for the ~3 seconds the pieces are live.
   =========================================================================== */

/** How many pieces make the burst feel full without turning into noise. */
const PIECES = 26

/** App palette only - art bible section 2. No new hues. */
const COLORS = [
  'var(--color-turquoise)',
  'var(--color-yellow)',
  'var(--color-coral)',
  'var(--color-lime)',
  'var(--color-violet)',
]

interface Piece {
  id: number
  left: number
  drift: number
  rot: number
  tilt: number
  delay: number
  dur: number
  round: boolean
  width: number
  height: number
  color: string
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => {
    const width = 7 + Math.round(Math.random() * 5)
    return {
      id: i,
      left: Math.random() * 100,
      drift: (Math.random() - 0.5) * 46,
      rot: Math.random() * 360,
      tilt: Math.random() * 540 - 270,
      delay: Math.random() * 0.4,
      dur: 1.5 + Math.random() * 1.2,
      round: Math.random() < 0.35,
      width,
      height: 12 + Math.round(Math.random() * 9),
      color: COLORS[i % COLORS.length]!,
    }
  })
}

export function ConfettiBurst() {
  const reduced = useReducedMotion()

  /* Stable for the component's lifetime: re-randomising the pieces on a store
     tick would restart the burst mid-flight. The Hub keeps this component
     mounted for a fixed window, so useMemo once is exactly right. */
  const pieces = useMemo(makePieces, [])

  if (reduced) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-0 block"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.round ? p.width : p.height,
              backgroundColor: p.color,
              borderRadius: p.round ? 999 : 3,
              '--cf-drift': `${p.drift}vw`,
              '--cf-rot': `${p.rot}deg`,
              '--cf-tilt': `${p.tilt}deg`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}