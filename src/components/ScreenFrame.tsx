import type { ReactNode } from 'react'
import { play } from '@/lib/audio'
import { useAppBack } from '@/lib/appBack'

/* ===========================================================================
   THE SCREEN FRAME (art bible 5.2).

   Portrait-first, 360x640 minimum, verified at 320x568. A FIXED 72px bottom bar
   that never moves, because a child needs a predictable place to look. Content
   scrolls BETWEEN the header and that bar and is never full-bleed behind it.

   The bar is not decorative: it carries back / progress / the primary action on
   every screen, so a learner always knows where "go back" and "next" live.
   =========================================================================== */

export function ScreenFrame({
  title,
  subtitle,
  onBack,
  headerRight,
  children,
  bar,
  footer,
  wide = false,
}: {
  title?: string
  subtitle?: string
  onBack?: () => void
  headerRight?: ReactNode
  children: ReactNode
  /** Contents of the fixed bottom bar. Omit for screens with no primary action. */
  bar?: ReactNode
  /** Static content pinned above the bar, e.g. a hint pill row. */
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* THE HEADER IS z-40, NOT z-20. It is sticky, so content scrolls
          underneath it, and any positioned in-screen element with a z-index at
          or above the header's would paint OVER the title, the back button and
          the right-hand control as it slid past. Woof School's pup stickers sit
          at z-20 and its chevrons at z-30 (see Skills.tsx), so the header has
          to clear the highest of them: 40 beats 30. Only this bar moves -
          content stacking inside a card is untouched. Modals (Sheet, z-50)
          still sit above it, and the bottom bar (z-30) never overlaps it. */}
      {title !== undefined && (
        <header className="sticky top-0 z-40 border-b-2 border-navy/15 bg-cream px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3.5 shadow-[0_12px_24px_-20px_rgba(26,35,126,0.55)]">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-4">
            {onBack !== undefined && (
              <BackButton onClick={onBack} />
            )}
            <div className="min-w-0 flex-1">
              {/* tabIndex={-1} makes this heading programmatically focusable so
                  App can move focus to it on every navigation, which is what
                  lets a screen reader announce the new screen instead of
                  continuing from a link that no longer exists. It is NOT in the
                  tab order: a child should never Tab to a heading. */}
              <h1 tabIndex={-1} className="truncate text-[22px] leading-7 text-indigo outline-none">
                {title}
              </h1>
              {subtitle && <p className="mt-0.5 truncate text-sm text-navy/80">{subtitle}</p>}
            </div>
            {headerRight}
          </div>
        </header>
      )}

      <main
        className={`mx-auto w-full flex-1 px-4 py-4 ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}
        style={bar ? { paddingBottom: 16 } : undefined}
      >
        {children}
      </main>

      {footer}

      {/* The bar sits outside <main> so it never scrolls, and carries the
          safe-area inset itself: on a notched phone the home indicator would
          otherwise cover the primary action. */}
      {bar && (
        <div
          className="sticky bottom-0 z-30 bg-cream px-4 pt-2 shadow-[0_-12px_28px_-18px_rgba(26,35,126,0.4)]"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">{bar}</div>
        </div>
      )}
    </div>
  )
}

export function BackButton({ onClick, label = 'Go back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        play('tap')
        onClick()
      }}
      aria-label={label}
      className="btn-chunky flex h-14 w-14 shrink-0 items-center justify-center bg-turquoise text-on-turquoise"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 5l-7 7 7 7" />
      </svg>
    </button>
  )
}

/**
 * The default back action: to the previous screen of THIS app.
 *
 * Every screen used to pass a hand-written `navigate('/somewhere')` instead, and
 * that is what trapped a learner in the Arena. See the long note in
 * lib/appBack.ts for the three ways `window.history.length` lies and why the app
 * keeps its own stack.
 */
export function useBack(): () => void {
  return useAppBack('/hub')
}

/* --- Progress bar ------------------------------------------------------- */

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-4 w-full overflow-hidden rounded-pill bg-indigo-soft"
    >
      {/* Never linear: linear fills read as a stall (art bible 10.1). */}
      <div
        className="h-full bg-turquoise transition-[width] duration-400 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* --- Star row ----------------------------------------------------------- */

export function StarRow({ count, total }: { count: number; total: number }) {
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${count} correct out of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden="true" className="text-[18px] leading-none">
          {i < count ? '★' : '☆'}
        </span>
      ))}
    </div>
  )
}