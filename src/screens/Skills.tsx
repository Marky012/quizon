import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar, ScreenFrame, useBack } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SKILLS } from '@/content/manifest'
import { SPECIES_NAME, type Skill } from '@/content/schemas'
import { accentGlowVar, accentVar, needsOutline } from '@/lib/accents'
import { play } from '@/lib/audio'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   WOOF SCHOOL - the eight training modules.

   ARRAY ORDER IS THE CURRICULUM ORDER and is deliberately not alphabetical:
   Text Type first because everything else depends on knowing what kind of text
   you are holding, and Fact or Opinion near the end because it is the hardest
   to spot. Do not sort this list.

    THE MNEMONIC LIVES IN THE PUP'S NAME: T for Text Type (Tala), W for
    Wh-Questions (Waffle). Pup and skill share a first letter by content test,
    so a child who cannot remember what Waffle does can go looking for the W.
    The name is parked OUTSIDE the card - floating at its top-right, on the
    head line the pup's own head rides over - so the card's face stays just the
    pup and the skill name, and the caption never costs the card a pixel.

    CARD ANATOMY, 2026-10-07 (rebuilt to two rows 2026-10-08). Each card
    borrows the Welcome logo's overlap: the pup is a CUT-OUT STICKER that rides
    above its own surface - lower half over the card's top edge, upper half in
    front of the page - with the same hard navy drop shadow and the same idle
    float. The card behind it is one of the Hub's indigo depth surfaces
    (per-skill accent glow in the top-left), so the grid reads as the same
    product as the stage cards it opens. EVERY card shows its pup's real
    artwork, earned or not: the "not yet" state is the Pup earned badge inside
    the open row, never a letter placeholder standing where the character
    should be.

   2026-10-24 REFRESH - MINIMAL, MODERN, SAME IDEA. The overlapping sticker
   stays the hero; everything around it got quieter and more deliberate.
     - THE FACE IS NOW STACKED, NOT TWO COLUMNS. On the 360px phone a card is
       ~142px inside, and the old pup-left / name-right split left the skill
       name a ~60px column. Now the top band holds the pup's lower half (left)
       and the lesson number + status medallions (right); the skill name runs
       the card's FULL width underneath, with the accordion chevron at the end
       of that line.
     - THE LIT CORNER (.school-card in index.css): a two-layer accent glow, a
       1px accent hairline that fades out by mid-card, and a blurred halo disc
       the pup stands in. The accent comes from accentGlowVar so the dark
       accents (indigo, navy) still glow on indigo.
     - THE STICKER (.school-pup): tighter hard edge + soft ambient shadow, and
       a small lift-and-tilt on hover (off under reduced motion).
     - STATUS: tucked, a done lesson / earned pup shows as a tiny medallion in
       the top band, so progress is visible at a glance without words. Opened,
       row 2 shows the purpose plus two icon pills - filled when achieved,
       a dashed ghost when "not yet", so the goal is always shown.

   STANDARD SIZE, ALWAYS. Every slot is fixed: the top band is 36px (the pup's
   72px minus its 36px lift), the name reserves two 19px lines (line-clamp +
   min-h), the chevron is a 28px tile beside it - so all eight cards rest at
   the SAME height no matter how short or long a skill name is. Only row 2
   changes a card's height, and only for the card being opened.

   ROWS DO NOT STRETCH. The grid is `items-start`, so a card's height is its
   own content: when one card's disclosure opens, the sibling card beside it
   in the same row keeps its collapsed height instead of being stretched tall
   with its content still hidden.

   The whole surface is still one hit target that opens the lesson: an
   invisible button stretched over the card carries the focus outline and
   navigation, and every visible control (the chevron) sits on a higher
   z-index above it - the stickers are pointer-events-none so taps on the pup
   still open the lesson. Cards are siblings, not nested buttons. The surface
   is `position: relative` (for its glow pseudo-elements) but sets NO z-index
   and NO transform, so it never becomes a stacking context: the chevron's
   z-index still resolves in the wrapper's stack, above the overlay button.
   =========================================================================== */

export function Skills() {
  const back = useBack()
  const progress = useGameStore((s) => s.skills)

  const done = progress.filter((k) => k.lessonComplete).length
  const earnedCount = progress.filter((k) => k.pupEarned).length

  return (
    <ScreenFrame
      title={`${SPECIES_NAME} School`}
      subtitle={`${done} of ${SKILLS.length} lessons done`}
      onBack={back}
      wide
    >
      {/* TWO COLUMNS UNCONDITIONALLY - the 2x4 the design calls for, at every
          width (a `sm:` prefix once collapsed it to a single column of eight on
          the 360px phone).

          `items-start` keeps each card its own height: opening one card's
          disclosure grows THAT card, never the one beside it.

          pt-9 IS THE HEADROOM FOR THE STICKER OVERHANG. The pup rides 36px
          above its own card, and the floating pup name pill rides the same
          head line; without this the first row's pups would land inside the
          header. The header's z-40 (see ScreenFrame) keeps them behind it
          while scrolling.

          gap-y-11 IS THE ROW GAP. 44px between rows clears the next row's
          36px sticker overhang and its name pill by a full 8px of page, so a
          floating name can never be covered by an open card above it. */}
      <section
        aria-label="Your pup collection"
        className="card-cream flex items-center gap-3 p-3.5"
      >
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-turquoise text-on-turquoise shadow-[inset_0_1.5px_0_0_rgb(255_255_255/0.45)]">
          <StatusIcon kind="pup" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] leading-5 text-indigo">
            {earnedCount} of {SKILLS.length} pups earned
          </p>
          <div className="mt-1.5">
            <ProgressBar value={earnedCount} max={SKILLS.length} label="Pups earned" />
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 items-start gap-x-3 gap-y-11 pt-12">
        {SKILLS.map((skill, i) => (
          <SkillCard key={skill.id} skill={skill} index={i} />
        ))}
      </ul>
    </ScreenFrame>
  )
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const navigate = useNavigate()
  const state = useGameStore((s) => s.skills).find((k) => k.id === skill.id)
  const lessonDone = state?.lessonComplete ?? false
  const earned = state?.pupEarned ?? false
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)

  const openLesson = () => {
    play('tap')
    navigate(`/skill/${skill.id}`)
  }

  const number = String(index + 1).padStart(2, '0')
  const glow = accentGlowVar(skill.pup.accent)

  return (
    <li>
      {/* WRAPPER (the card). `group` drives the surface's hover glow and the
          sticker's tilt; `relative` is the stacking and positioning context
          for the overlay button, the floating pup name and the pup sticker.
          Owns the hover lift; the entrance stagger rides the same element. */}
      <div
        className="group relative transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
        /* The card rises in, staggered one card per row. `backwards` fill
           holds the hidden start state through the delay and then hands the
           transform back, so hover lift still works afterwards. Reduced
           motion gets no delay and no animation. */
        style={
          reduced
            ? undefined
            : {
                animation: 'var(--animate-card-in)',
                animationDelay: `${index * 70}ms`,
              }
        }
      >
        {/* INVISIBLE NAV BUTTON. Covers the whole card - including the pup's
            overhang - and carries the focus outline and the lesson link. It is
            a brother of the chevron, NOT its parent, so expanding the
            disclosure can never nest a button inside a button. */}
        <button
          type="button"
          onClick={openLesson}
          aria-label={`Open ${skill.name} lesson`}
          className="absolute inset-0 z-10 cursor-pointer rounded-[22px]"
        />

        {/* THE PUP NAME - A FROSTED CHIP FLOATING OUTSIDE THE CARD. Right
            aligned, bottom 6px above the top edge, so it rides the same head
            line as the pup's overhanging head, one on each side. A small dot
            in the pup's own accent ties the name to its card's colour (cream
            gets a navy ring, or the dot would vanish on the white chip).
            `pointer-events-none` is load-bearing: a tap on the chip must land
            on the card, never on a dead hit box. `whitespace-nowrap` keeps it
            one line; it grows leftward and stays clear of the pup's head. */}
        <span className="pointer-events-none absolute right-1 -top-[30px] z-20 flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-white/85 py-[3px] pl-2 pr-2.5 font-display text-[13px] font-semibold leading-[18px] text-indigo shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_4px_12px_-4px_rgb(26_35_126/0.35)] ring-1 ring-indigo/10 backdrop-blur-sm">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${needsOutline(skill.pup.accent) ? 'ring-1 ring-navy/50' : ''}`}
            style={{ background: accentVar(skill.pup.accent) }}
          />
          {skill.pup.name}
        </span>

        {/* THE SURFACE (.school-card in index.css): indigo depth with the lit
            accent corner, gradient hairline and pup halo. TWO ROWS: the face
            (pup + controls top, full-width skill name below) and the disclosure. */}
        <div
          className="school-card flex flex-col p-2.5 sm:p-3"
          style={{ '--skill-accent': glow } as CSSProperties}
        >
          {/* ROW 1 - THE CARD'S FACE.
              Top band: Overlapping pup on left, Number + Status medallions + Chevron on right.
              Bottom band: Full-width skill name so long titles like 'Wh-Questions' never crop. */}
          <div className="flex items-start justify-between gap-1.5 min-h-[48px]">
            {/* LEFT: THE OVERLAPPING PUP STICKER (78px, with -mt-8 overhang) */}
            <div className="relative z-20 -mt-8 -ml-0.5 shrink-0">
              <span className="school-pup block animate-float">
                <PupAvatar pup={skill.pup} size={78} plain />
              </span>
            </div>

            {/* RIGHT: Number, Status Medallions, Accordion Chevron */}
            <div className="flex flex-col items-end gap-1.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-display text-[13px] font-black leading-none tabular-nums tracking-wide"
                  style={{ color: glow }}
                >
                  {number}
                </span>

                {/* THE ACCORDION BUTTON */}
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-controls={`skill-desc-${skill.id}`}
                  aria-label={open ? `Hide ${skill.name} details` : `Show ${skill.name} details`}
                  className={`relative z-30 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-cream ring-1 ring-inset transition-[background-color,transform,box-shadow] duration-200 active:scale-90 ${
                    open ? 'bg-white/25 ring-white/40' : 'bg-white/[0.1] ring-white/20 hover:bg-white/20'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* STATUS MEDALLIONS (shown when earned or done, neatly positioned under number) */}
              {(lessonDone || earned) && (
                <div className="flex items-center gap-1">
                  {lessonDone && <StatusDot kind="lesson" />}
                  {earned && <StatusDot kind="pup" />}
                </div>
              )}
            </div>
          </div>

          {/* SKILL NAME: FULL WIDTH OF THE CARD! Never cropped, never truncated! */}
          <div className="mt-2 flex items-center min-h-[38px]">
            <h2 className="font-display text-[15px] sm:text-[17px] font-bold leading-[19px] sm:leading-[21px] tracking-tight text-cream">
              {skill.name}
            </h2>
          </div>

          {/* ROW 2 - THE DISCLOSURE, FULL-WIDTH */}
          <span
            id={`skill-desc-${skill.id}`}
            aria-hidden={!open}
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <span className="min-h-0 overflow-hidden">
              <span
                aria-hidden="true"
                className="mt-2.5 block h-px w-full"
                style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${glow} 55%, transparent), transparent)` }}
              />
              <span className="mt-2 block text-[12px] leading-[17px] text-cream/75">
                {skill.purpose}
              </span>
              <span className="mt-2.5 mb-1 flex flex-col gap-1.5">
                <StatusPill kind="lesson" achieved={lessonDone} />
                <StatusPill kind="pup" achieved={earned} />
              </span>
            </span>
          </span>
        </div>
      </div>
    </li>
  )
}

/* --- Status: medallion (tucked) and pill (opened) -------------------------
   Two achievements, two fixed colour+icon pairs, so colour is never the only
   signal: lesson done = lime + check, pup earned = turquoise + paw. */

const STATUS = {
  lesson: { label: 'Lesson done', ghost: 'Lesson to do', tone: 'lime' },
  pup: { label: 'Pup earned', ghost: 'Pup to earn', tone: 'turquoise' },
} as const

function StatusIcon({ kind, className }: { kind: keyof typeof STATUS; className?: string }) {
  if (kind === 'lesson') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <ellipse cx="12" cy="16" rx="5" ry="4.2" />
      <circle cx="5.5" cy="10.5" r="2.2" />
      <circle cx="9.3" cy="6.3" r="2.3" />
      <circle cx="14.7" cy="6.3" r="2.3" />
      <circle cx="18.5" cy="10.5" r="2.2" />
    </svg>
  )
}

/** Tucked-card medallion: an 18px filled disc with its icon. */
function StatusDot({ kind }: { kind: keyof typeof STATUS }) {
  const s = STATUS[kind]
  return (
    <span
      role="img"
      aria-label={s.label}
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-indigo ${
        s.tone === 'lime' ? 'bg-lime' : 'bg-turquoise'
      }`}
      style={{
        boxShadow: `0 0 0 2px rgb(26 35 126 / 0.9), 0 0 10px 0 color-mix(in srgb, var(--color-${s.tone}) 60%, transparent)`,
      }}
    >
      <StatusIcon kind={kind} className="h-[11px] w-[11px]" />
    </span>
  )
}

/**
 * Opened-card pill. Achieved: a tinted glass chip in the status colour with a
 * filled icon disc. Not yet: a dashed ghost in faded cream, so the child still
 * sees what there is to earn.
 */
function StatusPill({ kind, achieved }: { kind: keyof typeof STATUS; achieved: boolean }) {
  const s = STATUS[kind]
  if (!achieved) {
    return (
      <span className="flex w-full items-center gap-1.5 rounded-pill border border-dashed border-cream/25 py-1 px-2 text-[11px] font-bold leading-none text-cream/60">
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-cream/10">
          <StatusIcon kind={kind} className="h-[10px] w-[10px] opacity-70" />
        </span>
        <span className="truncate">{s.ghost}</span>
      </span>
    )
  }
  const lime = s.tone === 'lime'
  return (
    <span
      className={`flex w-full items-center gap-1.5 rounded-pill py-1 px-2 text-[11px] font-bold leading-none ring-1 ring-inset ${
        lime ? 'bg-lime/15 text-lime ring-lime/40' : 'bg-turquoise/15 text-turquoise ring-turquoise/40'
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-indigo shadow-sm ${
          lime ? 'bg-lime' : 'bg-turquoise'
        }`}
      >
        <StatusIcon kind={kind} className="h-[11px] w-[11px]" />
      </span>
      <span className="truncate">{s.label}</span>
    </span>
  )
}