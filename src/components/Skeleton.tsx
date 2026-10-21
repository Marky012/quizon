import type { CSSProperties, ReactNode } from 'react'
import { useReducedMotion } from '@/lib/useReducedMotion'

/* ===========================================================================
   LOADING PLACEHOLDERS

   Art bible 10.2 and 5.2, applied to the question of "what does a child see
   while the app is working".

   FOUR RULES, and each one exists because breaking it caused a real problem:

   1. A SKELETON KEEPS THE SHAPE OF WHAT IT REPLACES. Every size below mirrors a
      dimension in the screen it stands in for. This is the whole difference
      between a skeleton and a spinner: the spinner sits in a box of no
      meaningful size, so the moment real content arrives everything below it
      jumps. A child aiming at an answer button has the button move out from
      under them. The placeholders are sized so it does not move.

   2. A SKELETON IS INERT. aria-hidden on every one, no role, not focusable. A
      screen reader should hear "Loading..." once and then the content, not a
      paragraph of empty regions.

   3. A SKELETON IS STILL WHEN MOTION IS REDUCED. The global reduced-motion
      rule in index.css already collapses the pulse to one static frame, but the
      hook is also consulted here so a static placeholder is genuinely static
      rather than relying on that global rule staying in place.

   4. A SKELETON NEVER REPLACES A LOADING MESSAGE. Where there is something
      useful to say - "Just a moment", "Choosing your story" - say it in text
      for everyone, including screen readers, and use the skeleton only for the
      shape underneath. A child who cannot see the skeleton still needs to know
      the app heard them.

      WHERE THE MESSAGE LIVES (2026-10-07): in the SCREEN HEADER's subtitle
      slot, not in the content flow. The destination's real subtitle is one
      truncated line, so a loading line in the same slot costs no height and the
      message disappears without moving a single card when the chunk lands. The
      content-only screens with no subtitle (Settings, Record, Welcome, the Hub)
      take the message as an sr-only status instead - see LoadingNote. Putting
      visible loading text INSIDE the content, which is what this used to do,
      means the text vanishes on arrival and every card under it jumps up.
   =========================================================================== */

/**
 * One block. `w` and `h` accept any CSS length, or omit `w` to fill.
 *
 * `radius` picks the shape language so a placeholder is recognisably the same
 * object as the thing it stands in for: pills for lines, the card radius for
 * cards, the button radius for avatars.
 */
export function Skeleton({
  w,
  h = 16,
  radius = 'line',
  tone = 'light',
  className = '',
  style,
}: {
  w?: string | number
  h?: string | number
  radius?: 'line' | 'title' | 'card' | 'avatar'
  /** `dark` = the bar sits on an INDIGO surface (.skill-surface, .stage-card),
   *  where indigo-soft would be invisible. See .skeleton-on-dark in index.css. */
  tone?: 'light' | 'dark'
  className?: string
  style?: CSSProperties
}) {
  const radiusClass =
    radius === 'title'
      ? 'skeleton-title'
      : radius === 'card'
        ? 'rounded-[24px]'
        : radius === 'avatar'
          ? 'rounded-[20px]'
          : 'skeleton-line'

  const reduced = useReducedMotion()

  return (
    <span
      aria-hidden="true"
      className={`skeleton ${tone === 'dark' ? 'skeleton-on-dark' : ''} ${radiusClass} block ${className}`}
      style={{
        width: w,
        height: h,
        // With reduced motion the pulse is not merely faster, it is removed, so
        // the placeholder sits at a single steady opacity instead of a 1600ms
        // loop the user has asked not to see.
        ...(reduced ? { animation: 'none', opacity: 0.6 } : {}),
        ...style,
      }}
    />
  )
}

/**
 * A paragraph of text lines. The LAST line is short by default, because a
 * paragraph whose final line runs the full width does not look like a
 * paragraph and reads as a block instead.
 *
 * `h` is the bar height and it exists for height parity: lines are separated
 * by a fixed 8px gap, so N bars of h occupy N*h + (N-1)*8 - which has to equal
 * N * <the real line-height>, or everything under the paragraph lands a few
 * millimetres off and then jumps when the chunk arrives. Pick h as
 * lineHeight - 8 * (lines-1)/lines: a 28px passage over 8 lines wants h=21
 * (168+56 = 224 = 8*28), the same passage over 4 lines wants h=22.
 */
export function SkeletonLines({
  lines = 3,
  lastShort = true,
  h = 14,
  tone = 'light',
  className = '',
}: {
  lines?: number
  lastShort?: boolean
  h?: number
  /** Which surface the paragraph sits on. See Skeleton's own `tone`. */
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <div aria-hidden="true" className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          w={lastShort && i === lines - 1 ? '62%' : '100%'}
          h={h}
          tone={tone}
        />
      ))}
    </div>
  )
}

/**
 * A card-shaped placeholder with lines inside. Matches .card-cream's 3px navy
 * border and 24px radius so the swap to real content does not change the
 * silhouette.
 */
export function SkeletonCard({
  lines = 2,
  className = '',
  children,
}: {
  lines?: number
  className?: string
  children?: ReactNode
}) {
  return (
    <div aria-hidden="true" className={`skeleton-card p-4 ${className}`}>
      {children ?? (
        <div className="flex flex-col gap-2">
          <Skeleton w="38%" h={18} radius="title" />
          <SkeletonLines lines={lines} />
        </div>
      )}
    </div>
  )
}

/**
 * A row of answer placeholders. 56px tall, matching the .option-btn minimum
 * touch target, because these stand in for the most-tapped control in the app
 * and its position must not shift when it appears.
 */
export function SkeletonOptions({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card flex items-center gap-3 px-4 py-3">
          <Skeleton w={36} h={36} radius="avatar" />
          <SkeletonLines lines={1} lastShort={false} className="flex-1" />
        </div>
      ))}
    </div>
  )
}

/**
 * A circular placeholder for a pup avatar. Kept square-cropped to match
 * PupAvatar's own box so the avatar does not resize when its art arrives.
 */
export function SkeletonAvatar({ size = 88 }: { size?: number }) {
  return <Skeleton w={size} h={size} radius="avatar" />
}

/**
 * THE SPOKEN LOADING MESSAGE.
 *
 * Rendered as role="status" so it is announced once when it appears, without
 * stealing focus. Deliberately NOT aria-hidden, unlike the shapes above: the
 * shapes are decoration standing in for content, but the fact that the app is
 * working is real information. Every loading placeholder in the app is paired
 * with one of these so a screen-reader user is never left with silence.
 *
 * `srOnly` is for the screens whose destination has NO header subtitle to carry
 * the visible message (Settings, Record, Welcome, the Hub) and for detail
 * messages like "Choosing your story" that a sighted child reads off the
 * skeleton anyway. Invisible text occupies no height, so nothing shifts when
 * the real screen lands.
 */
export function LoadingNote({ children, srOnly = false }: { children: ReactNode; srOnly?: boolean }) {
  return (
    <p role="status" className={srOnly ? 'sr-only' : 'text-[15px] leading-6 text-navy/80'}>
      {children}
    </p>
  )
}

/**
 * A small inline spinner-free progress hint for a KNOWN wait.
 *
 * Art bible 10.1 gives the turquoise progress bar a 400ms ease-out fill and
 * forbids a linear one, so this is only used where the duration is genuinely
 * known (a download, an install). Everything else uses a skeleton, because a
 * progress bar that cannot report real progress is a lie.
 */
export function IndeterminateBar({ label }: { label: string }) {
  const reduced = useReducedMotion()
  return (
    <div
      role="progressbar"
      aria-label={label}
      className="h-4 w-full overflow-hidden rounded-pill bg-indigo-soft"
    >
      <div
        className="h-full bg-turquoise"
        style={
          reduced
            ? { width: '100%', opacity: 0.5 }
            : { width: '40%', animation: 'pulse-badge 1600ms ease-in-out infinite' }
        }
      />
    </div>
  )
}