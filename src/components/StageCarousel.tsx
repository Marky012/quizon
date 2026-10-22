import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { StepIndicator } from '@/components/StepIndicator'
import { useReducedMotion } from '@/lib/useReducedMotion'

/* ===========================================================================
   STAGE CAROUSEL - the flat one-priority carousel on the Hub.

   NOT A CYLINDER. An earlier pass faked depth with a rotateY and a translateZ
   so the cards wrapped around the learner. It was dropped: on a 360px portrait
   phone a 3D perspective needs the cards to overlap to read as "around", and
   overlapping cards means the two side cards cover the one the child is trying
   to tap. Flat it is, and flat is also the easier thing to make correct.

   THE SCALE LADDER IS THE PRIORITY SIGNAL. One card is the active one: full
   size, full opacity, labelled. The others shrink to 0.82 and drop to 45%
   opacity, and they stay vertically centred rather than sitting on a baseline,
   which is what makes the row read as "one chosen, two waiting" instead of as a
   shelf of equal products.

   CARDS OVERFLOW, AND THE SCROLL AND THE STATE ARE THE SAME THING. A touch drag
   moves the cards, so scroll position has to be the source of truth or the
   arrows and the drag fight each other. onScroll measures which card is nearest
   the centre of the track and makes that the active index; the arrows do not set
   the index directly, they scroll the track and let onScroll catch up. Setting
   state from a scroll handler on every frame is the obvious way to do this and
   it re-renders on each pixel, so the measurement is the only thing that runs
   per-frame and it is compared before it is committed.

   The first card is active on mount. There is no "nothing selected" state,
   because an unselected carousel is a carousel that looks broken.
   =========================================================================== */

export interface CarouselProgress {
  /** Count reached. Clamped to [0, total] by the renderer. */
  value: number
  /** Count that completes the stage. Zero is treated as "no progress". */
  total: number
  /** Short noun phrase, e.g. "lessons done", shown under the bar. */
  label: string
}

export interface CarouselCard {
  id: string
  /** Small text above the icon. */
  label: string
  /**
   * The stage's picture, framed by the icon plate. It is a NODE rather than a
   * fixed glyph so the carousel stays ignorant of which stages exist: the Hub
   * passes a <StageArt/>, which owns the image-or-vector decision.
   */
  art: ReactNode
  /** Sentence under the icon. */
  description: string
  locked: boolean
  done: boolean
  requirement?: string
  /**
   * Optional status row under the description. A LOCKED card can carry one
   * too: the Reading Trail reports how many pups it still needs, which turns a
   * static "earn all eight" into a countdown the child can watch close.
   */
  progress?: CarouselProgress
}

export function StageCarousel({
  cards,
  onOpen,
  onIntent,
}: {
  cards: CarouselCard[]
  onOpen: (card: CarouselCard) => void
  /** Fired on pointer-enter and focus. The Hub uses it to prefetch the chunk. */
  onIntent?: (card: CarouselCard) => void
}) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLUListElement>(null)
  const reduced = useReducedMotion()

  /* Nearest-CARD-to-centre.

     It queries [data-card] rather than walking track.children, because the
     track also contains the two end spacers. Positional indexing would be off by
     one from the card list the moment spacers were added, which would mean the
     active highlight, the arrow bounds and the "2 of 3" counter all disagreed
     with what is on screen. Keying off an attribute keeps card index and DOM
     index independent.

     offsetLeft plus half a card is used rather than getBoundingClientRect
     because the rects change while a scroll is in flight and the arithmetic is
     exact without measuring layout. */
  const syncActive = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const centre = track.scrollLeft + track.clientWidth / 2
    const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-card]'))
    let best = 0
    let bestDistance = Infinity
    for (let i = 0; i < cards.length; i++) {
      const el = cards[i]!
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }
    setActive((current) => (current === best ? current : best))
  }, [])

  const centreIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const el = track.querySelectorAll<HTMLElement>('[data-card]')[index]
    if (!el) return
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2 })
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    /* Centre the first card ON MOUNT, not just on the first scroll. Without
       this the carousel loads showing card one hard against the left edge with
       cards two and three trailing off to the right, which is the exact layout
       the one-in-the-middle design is trying to avoid - the pupil would open
       the Hub and have to drag before anything was actually "selected". */
    centreIndex(0)
    syncActive()
    track.addEventListener('scroll', syncActive, { passive: true })
    return () => track.removeEventListener('scroll', syncActive)
  }, [centreIndex, syncActive])

  /* The arrows scroll rather than set state, so the drag and the buttons can
     never disagree about which card is showing. */
  const go = (delta: number) => {
    const next = Math.min(cards.length - 1, Math.max(0, active + delta))
    if (next !== active) centreIndex(next)
  }

  return (
    <div className="relative">
      {/* --card-w IS THE ONLY PLACE THE CARD WIDTH IS WRITTEN. It used to be
          spelled twice - `w-[74vw] max-w-[280px]` on the card and the same
          expression inside the spacer's calc() - which meant changing the
          card's width in one spot silently reintroduced the off-centre first
          card, because the spacer no longer matched. One variable, both
          consumers.

          Narrower than before (was 74vw / 280px max, now 64vw / 244px) purely to
          make the card read as PORTRAIT rather than square. A carousel card
          that is as wide as it is tall looks like a tile; a child scanning three
          of them reads the tall one as "the place you go". */}
      <ul
        ref={trackRef}
        style={
          {
            '--card-w': 'min(64vw, 244px)',
            '--card-h': '380px',
          } as CSSProperties
        }
        /* FULL BLEED, AND `relative` IS LOAD-BEARING WITH IT.

           The track is an overflow-x scroller, so it clips its cards at its own
           padding box. Sitting inside <main>'s px-4, that clip landed 16px INSIDE
           the screen edge: every card in transit - and the sliver of each side
           card at rest - was sliced off while a strip of bare backdrop sat
           outside the cut, which reads as the cards being cropped rather than as
           a carousel continuing past the edge. -mx-4 pushes the track out to the
           screen edge, exactly as the arrow row below already does, so the slice
           happens where a slice is expected: at the glass.

           `position: relative` is what keeps the centring maths honest after
           that margin. The <li>s are measured with offsetLeft, which is taken
           from the nearest positioned ancestor - without this that is still the
           wrapper div, whose origin now sits 16px to the RIGHT of the track's
           scroll origin, so every centreIndex() call would scroll 16px short and
           the active card would rest visibly off-centre. Making the track the
           offsetParent measures from the track itself, and the spacer/scroll
           arithmetic below is unchanged.

           The px-4 that comes with it is redundant for centring (the end
           spacers already reserve exactly that room) but harmless, and it keeps
           a sliver of track padding at the scroll ends. */
        className="relative -mx-4 flex snap-x snap-mandatory items-center gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Half-a-viewport spacers at both ends, and they are load-bearing.

            Centring a card means scrolling to (cardCentre - viewportCentre). For
            the FIRST card that value is NEGATIVE, and scrollTo clamps it to 0 - so
            card one would sit hard against the left padding and never reach the
            middle no matter what maths is done. These spacers give the scroll
            somewhere to go at each end. */}
        <li
          aria-hidden="true"
          className="shrink-0 snap-align-none"
          style={{ width: 'calc((100% - var(--card-w)) / 2)' }}
        />

        {cards.map((card, i) => {
          const isActive = i === active
          const progress = card.progress
          /* Clamp and guard here, not at the call site: a stage that passes
             total 0 or value > total would otherwise render a bar that is wider
             than its track or a "NaN%". */
          const progressPct =
            progress && progress.total > 0
              ? Math.round(
                  (Math.min(Math.max(progress.value, 0), progress.total) / progress.total) * 100,
                )
              : 0
          const statusText = progress
            ? `${progress.value} of ${progress.total} ${progress.label}`
            : null
          /* The visible text inside the button is ignored by a screen reader
             once aria-label is set, so the label has to carry the status and the
             locked reason itself. */
          const accessibleName = [
            card.label,
            card.locked ? 'locked' : null,
            card.locked ? (card.requirement ?? card.description) : card.description,
            !card.locked ? statusText : null,
            card.done && !card.locked ? 'done' : null,
          ]
            .filter(Boolean)
            .join('. ')
          return (
            <li
              key={card.id}
              data-card
              className="shrink-0 snap-center transition-[transform,opacity] duration-300 ease-out"
              /* Scale and fade together, driven by one boolean, so the two can
                 never drift apart and the active card is the only thing that
                 decides either. */
              style={
                {
                  width: 'var(--card-w)',
                  opacity: isActive ? 1 : 0.45,
                  transform: `scale(${isActive ? 1 : 0.82})`,
                } as CSSProperties
              }
            >
              {/* THE LABEL SITS ON TOP OF THE CARD, NOT INSIDE IT. It is a
                  sibling of the button rather than its first child, so the card
                  holds only the icon and the description. Two consequences, both
                  deliberate:

                  It stays inside the <li>, which is what carries the scale and
                  the opacity - so a side card's label dims and shrinks with its
                  card rather than staying full size and fighting the hierarchy.

                  The BUTTON NO LONGER HAS A VISIBLE NAME, so it needs
                  aria-label. Without it the control announces only "button" to a
                  screen reader, which on a three-card carousel is useless. */}
              <span className="mb-1.5 block text-center font-display text-[17px] leading-5 text-indigo">
                {card.label}
              </span>

              <button
                type="button"
                onClick={() => onOpen(card)}
                onPointerEnter={() => onIntent?.(card)}
                onFocus={() => onIntent?.(card)}
                aria-disabled={card.locked}
                aria-current={isActive ? 'true' : undefined}
                aria-label={accessibleName}
                /* The card rises in on mount, staggered left to right. The
                   animation lives on the BUTTON rather than the <li>, because
                   the <li> already owns the active scale transform and a
                   keyframe would override it. `backwards` fill (see the token)
                   holds the hidden start state through the delay and then hands
                   the transform back, so hover lift still works afterwards.
                   Reduced motion gets no animation and no delay at all. */
                style={
                  reduced
                    ? undefined
                    : {
                        animation: 'var(--animate-card-in)',
                        animationDelay: `${i * 90}ms`,
                      }
                }
                /* TALLER AND MORE PORTRAIT, and the height is a min-height rather than a
                   natural one on purpose.

                   A card that sizes to its own content ends up a different height
                   per card, because the three blurbs are different lengths and the
                   locked Reading Trail shows a much longer requirement string
                   ("Earn all 8 pups..."). A carousel row of three mismatched
                   heights reads as broken even though every card is correct. So
                   every card is at least --card-h tall and the icon takes up the
                   slack, which also puts the icon optically in the middle of the
                   card rather than wherever the text above it happened to end. */
                className={`relative flex min-h-[var(--card-h)] w-full flex-col items-center gap-3 rounded-[28px] p-4 text-center transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98] ${
                  card.locked ? 'stage-card-locked' : 'stage-card'
                }`}
              >
                {/* The stage's picture, huge, and the one part of the card
                    allowed to absorb the extra height. It now takes the top of
                    the card because the label moved out above it.

                    The art drifts on the ACTIVE card only, which is the one
                    piece of idle motion in the carousel: it marks "this is the
                    one" without moving the card itself. Suppressed under
                    reduced motion, where the scale and opacity ladder is
                    already enough of a marker.

                    A LOCKED STAGE IGNORES ITS ART and shows a padlock instead -
                    the door is shut, so showing the room behind it would be a
                    lie. The lock is a drawn SVG, not the ðŸ”’ character, for the
                    same optical-centring reason as the header gear. */}
                <span className={`flex min-h-0 flex-1 items-center justify-center`}>
                  <span
                    className={`flex h-36 w-36 items-center justify-center rounded-[24px] ${
                      card.locked ? 'stage-icon-locked' : 'stage-icon'
                    } ${isActive && !card.locked && !reduced ? 'animate-float' : ''}`}
                  >
                    {card.locked ? <LockGlyph /> : card.art}
                  </span>
                </span>

                <span
                  className={`text-[14px] leading-5 ${
                    card.locked ? 'text-navy/85' : 'text-cream/95'
                  }`}
                >
                  {card.locked ? (card.requirement ?? card.description) : card.description}
                </span>

                {/* Status row. The bar is decorative - the same numbers are in
                    the button's aria-label - so it is hidden from assistive
                    tech rather than announced twice. */}
                {progress && (
                  <span aria-hidden="true" className="mt-0.5 block w-full">
                    <span
                      className={`block h-2 w-full overflow-hidden rounded-pill ${
                        card.locked ? 'stage-progress-locked' : 'stage-progress'
                      }`}
                    >
                      <span
                        className={`block h-full rounded-pill transition-[width] duration-500 ease-out ${
                          card.locked ? 'stage-progress-fill-locked' : 'stage-progress-fill'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </span>
                    <span
                      className={`mt-1 block text-sm font-bold ${
                        card.locked ? 'text-navy/70' : 'text-cream/85'
                      }`}
                    >
                      {statusText}
                    </span>
                  </span>
                )}

                {/* THE DONE BADGE IS PINNED, not stacked. It used to sit in the
                    column under the description, where it pushed the card's text
                    up and made a finished stage look different from its
                    neighbours. Pinned to the corner it is the same stamp on
                    every card, and the star gives the state a shape as well as a
                    colour (art bible 2.4). */}
                {card.done && !card.locked && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-pill bg-lime-soft px-2 py-0.5 text-sm font-bold text-indigo shadow-[0_2px_0_0_rgb(26_43_76/0.15)]">
                    <span aria-hidden="true">★</span> Done
                  </span>
                )}
              </button>
            </li>
          )
        })}

        {/* Mirror spacer, so the LAST card can reach the middle too. */}
        <li
          aria-hidden="true"
          className="shrink-0 snap-align-none"
          style={{ width: 'calc((100% - var(--card-w)) / 2)' }}
        />
      </ul>

      {/* ARROWS AT THE SCREEN EDGES, not grouped in the middle. This is the
          thumb-reach fix. A child holding a phone in two hands rests a thumb
          near the bottom CORNERS, and a centred cluster of arrows puts the
          controls at the one part of the bottom edge a thumb cannot easily reach
          without shifting grip. -mx-4 cancels the page padding on <main> so the
          row runs the full width of the screen, with a 3px inset so neither
          arrow is flush against the bezel where it would be easy to miss.

          The counter in the middle was the words "1 of 3" and it is now the
          STEP INDICATOR - the same component the Intro uses, so the two
          screens answer "where am I" the same way. It is also a control: its
          dots jump straight to a stage, which is a much bigger target than
          the arrows for a child who has not yet learned to swipe.

          The row stays centred because both arrows are the same width, so
          justify-between leaves it exactly in the middle.

          THE INSET IS 24px, and that is a correction. This row went full-bleed
          with 12px of breathing room first, which put the arrows close enough
          to the bezel to look accidental - reachable, but visually crowding the
          edge of the screen. 12px is also narrower than the 16px every other
          element on this screen uses, so the arrows were the only thing breaking
          the page's spacing rhythm. 24px keeps them out toward the corners where
          a thumb lands, while reading as deliberate margin rather than a control
          jammed against the glass. */}
      <div className="-mx-4 mt-3 flex items-center justify-between px-6">
        <Arrow direction="left" disabled={active === 0} onClick={() => go(-1)} />
        <StepIndicator
          index={active}
          total={cards.length}
          label="Hub stages"
          stepLabels={cards.map((c) => c.label)}
          onSelect={(i) => {
            if (i !== active) centreIndex(i)
          }}
          className="w-[150px] sm:w-[190px]"
        />
        <Arrow direction="right" disabled={active === cards.length - 1} onClick={() => go(1)} />
      </div>
    </div>
  )
}

function Arrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      /* 56px, not the 48px minimum. 48 is the floor for a deliberate adult tap;
         this control is aimed at a child's thumb, often at the far corner of the
         screen, while holding the phone in a way that makes an accurate 48px
         press unrealistic. The extra 8px costs nothing - there is nothing
         beside them to crowd.
         touch-manipulation drops the ~300ms double-tap-zoom wait, which on a
         rapid repeated tap reads as the button ignoring the first press. */
      className="btn-chunky flex h-14 w-14 shrink-0 touch-manipulation items-center justify-center bg-turquoise text-[26px] leading-none text-on-turquoise select-none disabled:opacity-40"
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  )
}

/* The padlock for a locked stage. Drawn rather than typed so it sits dead in
   the plate at any size, matching the header gear. */
function LockGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className="h-24 w-24"
    >
      <path
        d="M16 22 v-6 a8 8 0 0 1 16 0 v6"
        fill="none"
        stroke="var(--color-navy)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="12" y="22" width="24" height="18" rx="4" fill="var(--color-navy)" />
      <circle cx="24" cy="30" r="3" fill="var(--color-cream)" />
      <path d="M24 32 L24 36" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
