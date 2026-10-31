import type { CSSProperties, ReactNode } from 'react'
import { TEACHER } from '@/content/manifest'
import { TeacherAvatar, type TeacherEmotion } from './TeacherAvatar'

/* ===========================================================================
   LESSON PARTS - the small pieces the skill flow shares (2026-10-24 refresh).

   Lesson -> check -> result is one journey, so the three screens share one
   visual vocabulary: the step trail across the top, the section header (an
   accent icon tile + a heading), and Ma'am's speech bubble. Everything here
   is stateless and token-only - colours come in from the skill's accent.
   =========================================================================== */

/* --- Step trail ----------------------------------------------------------
   Rule -> Example -> Check. Done steps show a check, the current one is
   filled in the accent, later ones are quiet outlines. It is an ordered list
   with aria-current, so a screen reader hears "step 2 of 3, current". */

const STEPS = ['Rule', 'Example', 'Check'] as const

export function StepTrail({ current, accent }: { current: 0 | 1 | 2; accent: string }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Lesson steps">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5"
          >
            <span
              className={`flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-pill pl-1 pr-2.5 text-[12px] font-bold leading-none transition-colors duration-300 ${
                active
                  ? 'text-indigo shadow-[0_6px_14px_-8px_rgb(26_35_126/0.6)]'
                  : done
                    ? 'bg-indigo/[0.06] text-indigo'
                    : 'text-navy/50 ring-1 ring-inset ring-navy/15'
              }`}
              style={active ? { background: `color-mix(in srgb, ${accent} 30%, white)` } : undefined}
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums ${
                  active ? 'bg-indigo text-cream' : done ? 'bg-lime text-on-lime' : 'bg-navy/[0.07]'
                }`}
              >
                {done ? <CheckGlyph className="h-3 w-3" /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
              <span className="sr-only">{done ? ' (done)' : ''}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* --- Section header: an accent icon tile + the heading ----------------- */

export function SectionHead({
  icon,
  title,
  accent,
  aside,
}: {
  icon: ReactNode
  title: string
  accent: string
  aside?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-indigo"
        style={{ background: `color-mix(in srgb, ${accent} 26%, white)` }}
      >
        {icon}
      </span>
      <h2 className="min-w-0 flex-1 font-display text-[20px] leading-6 text-indigo">{title}</h2>
      {aside}
    </div>
  )
}

/* --- Ma'am's speech bubble -----------------------------------------------
   Teacher Reyes stands free (no card) beside a comic-style speech bubble:
   an accent-outlined bubble with a tail aimed at her, a name tag riding the
   top edge, a gentle idle bob on her, and a spring-in on the bubble.
   Motion is covered by the global prefers-reduced-motion rule. */

export function TeacherNote({
  children,
  emotion = 'idle',
  tone = 'turquoise',
  size = 120,
  className = '',
}: {
  children: ReactNode
  emotion?: TeacherEmotion
  tone?: 'turquoise' | 'lime' | 'yellow'
  size?: number
  className?: string
}) {
  const t = {
    turquoise: { bg: 'var(--color-turquoise-soft)', edge: 'var(--color-turquoise)' },
    lime: { bg: 'var(--color-lime-soft)', edge: 'var(--color-lime)' },
    yellow: { bg: 'var(--color-yellow-soft)', edge: 'var(--color-yellow)' },
  }[tone]

  return (
    <section className={`flex items-end gap-2 ${className}`} aria-label={`${TEACHER.name} says`}>
      <div className="relative shrink-0 animate-float">
        {/* Soft floor shadow so she reads as standing, not pasted on. */}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-[50%] bg-navy/20 blur-[3px]"
        />
        <TeacherAvatar
          key={emotion}
          emotion={emotion}
          size={size}
          plain
          className="relative drop-shadow-[0_8px_10px_rgba(26,43,76,0.28)]"
        />
      </div>
      <div
        className="animate-card-in relative mb-8 min-w-0 flex-1 rounded-[22px] px-4 pb-3 pt-5 text-indigo shadow-[0_4px_0_0_rgb(26_43_76/0.12),0_18px_30px_-20px_rgb(26_35_126/0.6)]"
        style={
          {
            background: `linear-gradient(180deg, #fffdf4 0%, ${t.bg} 100%)`,
            border: `2.5px solid ${t.edge}`,
          } as CSSProperties
        }
      >
        {/* Tail pointing at the teacher */}
        <span
          aria-hidden="true"
          className="absolute -left-[11px] bottom-6 size-[18px] rotate-45 rounded-bl-[5px]"
          style={
            {
              background: t.bg,
              borderLeft: `2.5px solid ${t.edge}`,
              borderBottom: `2.5px solid ${t.edge}`,
            } as CSSProperties
          }
        />
        {/* Name tag riding the top edge */}
        <p
          className="absolute -top-3 left-4 rounded-pill px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-indigo shadow-sm"
          style={{ background: t.edge } as CSSProperties}
        >
          {TEACHER.address}
        </p>
        {children}
      </div>
    </section>
  )
}
/* --- Glyphs (24px grid, stroke icons) ---------------------------------- */

type G = { className?: string }

export function CheckGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function CrossGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className={className}>
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  )
}

export function BulbGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

export function BookGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2Z" />
      <path d="M12 6.5v14" />
    </svg>
  )
}

export function ClipboardGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" />
      <path d="M9 4.5V3.5h6v1M9 11h6M9 15h4" />
    </svg>
  )
}

export function RetryGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" />
      <path d="M4 4v4.5h4.5" />
    </svg>
  )
}

export function TargetGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  )
}

export function LockGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PawGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <ellipse cx="6.5" cy="10.5" rx="2" ry="2.6" transform="rotate(-18 6.5 10.5)" />
      <ellipse cx="10" cy="7.5" rx="2" ry="2.7" />
      <ellipse cx="14" cy="7.5" rx="2" ry="2.7" />
      <ellipse cx="17.5" cy="10.5" rx="2" ry="2.6" transform="rotate(18 17.5 10.5)" />
    </svg>
  )
}

export function StarGlyph({ className, filled = true }: G & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? '1.5' : '2.2'}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2.5l2.8 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.8 3.3 1.3-6.5-4.9-4.5 6.6-.8L12 2.5z" />
    </svg>
  )
}

export function VolumeOnGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

export function VolumeOffGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" />
      <path d="M22 9l-6 6M16 9l6 6" />
    </svg>
  )
}

export function ClockGlyph({ className }: G) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
