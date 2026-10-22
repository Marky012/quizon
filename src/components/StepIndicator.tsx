import type { CSSProperties } from 'react'

/* ===========================================================================
   THE STEP INDICATOR - a progress bar with step markers sitting on it.

   ONE COMPONENT, TWO SCREENS. The Intro walks through three story panels
   and the Hub is a carousel of three stages, and both needed to say "you are
   on step N of three". The Intro had plain dots and the Hub had the words
   "1 of 3", which are two different answers to the same question. This is the
   third answer: a bar that shows how far along you are, with dots on it that
   show WHICH step you are on. One component, so the two screens cannot drift.

   THE GEOMETRY, AND WHY THE FILL ENDS HALFWAY TO THE NEXT DOT.

   The dots sit at the CENTRE of each step's segment: with three steps that is
   16.7%, 50% and 83.3% of the track. The fill runs to the END of the current
   segment, which is (index + 1) / total - so it always stops exactly
   halfway between the current dot and the next one. That reads correctly
   without a rule to explain it: the fill has swallowed the current step and
   is heading for the next.

   THE DOTS ARE NAVY ON THE CREAM/TRACK SIDE AND NAVY ON THE TURQUOISE SIDE,
   so they are visible in both. An early version made the finished dots
   turquoise, which made them vanish into the turquoise fill they were
   supposed to sit on.

   THE CURRENT DOT IS BIGGER AND HALOED. Scale plus a cream ring, so "you are
   here" survives being seen at arm's length on a phone in bright light.

   THE DOTS ARE BUTTONS. On the Intro they jump to a panel and on the Hub they
   jump to a stage, and a 14px dot is not a tap target a child can hit. The
   BUTTON is 44px - the minimum - and the dot is drawn inside it. The
   invisible button is taller than the track, which is why the row that holds
   this is 44px tall even though the bar is 10px.

   IT IS NOT A progressbar ROLE. A progressbar's contents are presentational
   to a screen reader, and these dots are buttons that can be pressed. So the
   group carries a label, and the current dot carries aria-current="step".
   =========================================================================== */

/** The visible size of one dot. */
const DOT = 14
/** The tap target around it. The art bible's 44px minimum. */
const HIT = 44

export function StepIndicator({
  index,
  total,
  label,
  stepLabels,
  onSelect,
  className = '',
}: {
  /** The current step, 0-based. */
  index: number
  /** How many steps there are. */
  total: number
  /** What the group is, e.g. "Story panels". Read out by assistive tech. */
  label: string
  /** Optional per-step names, used in the button's accessible name. */
  stepLabels?: readonly string[]
  /** Fired when a step is tapped. Omit to render the dots as plain marks. */
  onSelect?: (index: number) => void
  className?: string
}) {
  if (total <= 0) return null
  const safeIndex = Math.min(Math.max(index, 0), total - 1)
  const fillPct = ((safeIndex + 1) / total) * 100

  return (
    <div
      role="group"
      aria-label={label}
      className={`relative flex h-11 items-center ${className}`}
    >
      {/* THE TRACK. Indigo-soft, the same colour the quiz's progress bar uses
          for its empty part, so the app has one progress bar and not two. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 h-2.5 rounded-pill bg-indigo-soft"
      >
        <span
          className="block h-full rounded-pill bg-turquoise transition-[width] duration-500 ease-out"
          style={{ width: `${fillPct}%` }}
        />
      </span>

      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === safeIndex
        const isDone = i < safeIndex
        const position = ((i + 0.5) / total) * 100
        const name = stepLabels?.[i]
        const dotClass = [
          'block rounded-full border-2 transition-transform duration-300 ease-out',
          isCurrent
            ? 'scale-[1.35] border-cream bg-navy shadow-[0_0_0_2px_rgb(255_253_244/0.9)]'
            : isDone
              ? 'border-navy bg-navy'
              : 'border-navy/45 bg-cream',
        ].join(' ')

        const inner = <span aria-hidden="true" className={dotClass} style={{ width: DOT, height: DOT }} />

        if (!onSelect) {
          return (
            <span
              key={i}
              aria-hidden="true"
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position}%` }}
            >
              {inner}
            </span>
          )
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={name ? `Step ${i + 1} of ${total}: ${name}` : `Step ${i + 1} of ${total}`}
            /* focus-VISIBLE, not focus. A child taps these dots constantly,
               and a yellow ring on every tap is noise. focus-visible draws
               the ring for a keyboard user, which is the only person who
               needs to know where they are. */
            className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]"
            style={{ left: `${position}%`, width: HIT, height: HIT } as CSSProperties}
          >
            {inner}
          </button>
        )
      })}
    </div>
  )
}
