import type { CSSProperties } from 'react'

/* ===========================================================================
   THE STEP INDICATOR - the "hybrid bar + dot" pattern (UI reference sheet,
   tile 2 in the second row).

   THE SHAPE CARRIES THE STATE, NOT A TRACK. There is no groove running behind
   the steps and no fill that grows across it. Each step is one mark:

     a filled navy DOT        - a step the learner has finished
     an indigo CAPSULE (bar)  - the step they are on
     a pale navy DOT          - a step still ahead

   That is why it is called hybrid: the current step is a bar and the rest are
   dots. The elongated shape is the "you are here" signal, so the state
   survives in greyscale and for a colour-blind eye, and the whole row stays
   the same width as the steps change.

   THIS REPLACED A BAR-WITH-DOTS-ON-IT on 2026-10-22. The old one drew a
   continuous track and a turquoise fill that ran to the end of the current
   segment, which read as "progress through a list" - fine for a carousel of
   three, but wrong for a seven-step setup spine, where the learner needs to
   see the individual stops and not a percentage. It also needed its own
   comment explaining where a fill should stop, which is a sign the shape was
   doing too little work.

   ONE COMPONENT, TWO LANGUAGES. The Hub's stage carousel passes onSelect and
   the dots become buttons that jump to a stage. The onboarding spine does not:
   its steps live on three different screens and two of them are gates (a full
   name and a nickname), so a dot that jumped forward would walk a child past
   the thing the screen exists to ask for. Those marks are a map, the Hub's are
   a menu.

   THE HUB'S BUTTONS ARE 44px SQUARE - the art bible's minimum - because a
   16px dot is not a tap target a child can hit on a phone in bright light.
   This is also why that row is 44px tall even though every mark is 16px.

   IT IS NOT A progressbar ROLE. A progressbar's contents are presentational
   to a screen reader, and the Hub's dots are buttons that can be pressed. So
   the group carries a label and the current step carries aria-current="step".
   When the marks are not interactive there is nothing to press, so instead a
   single sr-only line says "Step 3 of 7" - the same thing the shape says.
   =========================================================================== */

/** The visible diameter of a dot, and the height of the capsule. */
const DOT = 16
/** How long the current step's capsule is. */
const BAR = 44
/** The tap target around a dot on an interactive row. */
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
  /** What the group is, e.g. "Setup progress". Read out by assistive tech. */
  label: string
  /** Optional per-step names, used in the button's accessible name. */
  stepLabels?: readonly string[]
  /** Fired when a step is tapped. Omit to render the marks as a plain map. */
  onSelect?: (index: number) => void
  className?: string
}) {
  if (total <= 0) return null
  const safeIndex = Math.min(Math.max(index, 0), total - 1)

  /* 44px tall when the marks are buttons, because that is the tap target. The
     onboarding map has nothing to press, so it can be shorter - which is worth
     doing: on the helper picker those extra pixels are the difference between
     the first row of pups' names clearing the bottom bar and sitting under it. */
  const rowHeight = onSelect ? 'h-11' : 'h-9'

  return (
    <div
      role="group"
      aria-label={label}
      className={`flex items-center justify-center gap-2 ${rowHeight} ${className}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === safeIndex
        const isDone = i < safeIndex
        const name = stepLabels?.[i]

        /* The capsule grows out of its own dot rather than appearing at full
           width, so stepping forward reads as "this stop opened up". Under
           reduced motion the global rule collapses the duration. */
        const mark = (
          <span
            aria-hidden="true"
            /* The two data attributes are how a test asks "which step is the
               learner on" without parsing pixels. */
            data-step={i}
            data-current={isCurrent ? '' : undefined}
            className={`block rounded-pill transition-[width,background-color] duration-300 ease-out ${
              isCurrent ? 'bg-indigo' : isDone ? 'bg-navy' : 'bg-navy/25'
            }`}
            style={{ width: isCurrent ? BAR : DOT, height: DOT }}
          />
        )

        if (!onSelect) {
          return <span key={i}>{mark}</span>
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
            className="flex items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]"
            style={{ width: HIT, height: HIT } as CSSProperties}
          >
            {mark}
          </button>
        )
      })}

      {!onSelect && <span className="sr-only">{`Step ${safeIndex + 1} of ${total}`}</span>}
    </div>
  )
}
