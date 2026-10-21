import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SKILLS } from '@/content/manifest'
import { SPECIES_NAME, type Skill } from '@/content/schemas'
import { accentSoftVar } from '@/lib/accents'
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

   TWO ROWS PER CARD. ROW 1 is the card's face and reads as two columns: the
   pup parks LEFT, riding the card's top edge with the Welcome overhang; the
   RIGHT keeps the skill number and name with the accordion button directly
   beneath it. The pup's name belongs to that head line but lives OUTSIDE the
   card - absolutely parked above the top edge, right-aligned, floating next
   to the overlapping pup head. ROW 2 is the disclosure: the skill's purpose
   as ONE column spanning the card end to end, deliberately ignoring row 1's
   two columns above it. Tucked, row 2 does not exist and the card shows only
   the pup, the skill name and the button (the name floats above it all).
   Opening the button (aria-expanded / aria-controls) grows row 2 beneath
   row 1 and reveals the reward badges under the pup in row 1's left column,
   which stay out of the card's quiet state.

   STANDARD SIZE, ALWAYS. Every slot in the card is a fixed-sized tile - the
   name reserves two lines (line-clamp + min-h), the button is a 28px tile -
   so all eight cards rest at the SAME natural height (72px of row 1 + 16px of
   padding = 88) no matter how short or long a skill name is. There is NO
   min-height floor: a floor is what left an empty band under the button when
   the pup name moved out of the card, and the slots alone already standardise
   the grid. Only row 2 changes a card's height, and only for the card being
   opened.

   ROWS DO NOT STRETCH. The grid is `items-start`, so a card's height is its
   own content: when one card's disclosure opens, the sibling card beside it
   in the same row keeps its collapsed height instead of being stretched tall
   with its content still hidden.

   The whole surface is still one hit target that opens the lesson: an
   invisible button stretched over the card carries the focus outline and
   navigation, and every visible control (the chevron) sits on a higher
   z-index above it - the stickers are pointer-events-none so taps on the pup
   still open the lesson. Cards are siblings, not nested buttons. The surface
   deliberately stays non-positioned so the chevron's z-index resolves in the
   wrapper's stack, above the overlay button.
   =========================================================================== */

export function Skills() {
  const back = useBack()
  const progress = useGameStore((s) => s.skills)

  const done = progress.filter((k) => k.lessonComplete).length

  return (
    <ScreenFrame
      title={`${SPECIES_NAME} School`}
      subtitle={`${done} of ${SKILLS.length} lessons done`}
      onBack={back}
      wide
    >
      {/* TWO COLUMNS UNCONDITIONALLY, and the `sm:` prefix is the whole point of
          this card. This used to be `sm:grid-cols-2`, which means two columns
          only ABOVE 640px - so on the 360x640 phone the art bible targets, eight
          skills rendered as a single column of eight and the pupil scrolled for
          a very long time to find the eighth one. The grid is now two columns at
          every width, which is the 2x4 the design calls for.

          `items-start` keeps each card its own height: opening one card's
          disclosure grows THAT card, never the one beside it. `relative` on the
          wrapper is the positioning context the overlay button and chevron
          stack against.

          pt-8 IS THE HEADROOM FOR THE STICKER OVERHANG. The pup rides 24px
          above its own card (its -mt-8 lift minus the surface's pt-2) and the
          floating pup name pill rides the same 24px, so the pups and the
          names share the high line; <main> only keeps py-4 - so without this
          the first row's two pups landed 8px ABOVE <main>'s top edge, i.e.
          inside the header, on top of the Woof School title, the back button
          and the settings button. 16 + 32 - 24 = 24px of clearance at rest,
          and the header's new z-40 (see ScreenFrame) keeps them behind it
          while scrolling.

          gap-y-8 IS THE ROW GAP. 32px vertical between rows - room enough
          that the card below's taller glass name pill (24px) and the pup
          sticker (24px overhang) clear the card above by a full 8px of page,
          so a floating name can never be covered by an open card above it,
          and the sticker still rides its own card's top edge as designed.
          (The horizontal gap stays 12px: the names float above the cards,
          not beside them.) */}
      <ul className="grid grid-cols-2 items-start gap-x-3 gap-y-8 pt-8">
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

  return (
    <li>
      {/* WRAPPER (the card). `relative` is the stacking and positioning
          context for the overlay button, the floating pup name and the pup
          sticker. The min-height floor lives on the SURFACE below, not here:
          a floor on the wrapper would leave a dead band of page visible under
          a shorter surface, while a floor on the surface IS the card. Owns
          the hover lift; the entrance stagger rides the same element. */}
      <div
        className="relative transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
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
          className="absolute inset-0 z-10"
        />

        {/* THE PUP NAME - A GLASS PILL FLOATING OUTSIDE THE CARD. Right
            aligned above the top edge, bottom flush on the border, so it
            rides the same head line as the pup's overhanging head, one on
            each side. The pill reuses the accordion button's glass recipe
            (translucent cream fill + inset white top rim + the same 9px
            radius) so the name reads as part of the same control family; on
            the cream page the 60% fill is a frosted chip rather than the
            button's near-invisible tint, which is why the ink stays indigo
            instead of cream. (A real speech bubble would want a speech-bubble
            asset rather than a CSS diamond, so there is no tail.) The pill is
            24px tall (20px line + 4px padding) and `-top-6` parks it exactly
            flush on the card's top edge. `pointer-events-none` is
            load-bearing: a tap on the pill must land on the card's own
            surface, never on a dead hit box (the gap-y-8 row gap keeps the
            pill clear of the card above by 8px). `whitespace-nowrap` keeps
            the pill on one line - it grows leftward from right-2 and stays
            clear of the pup's head on the other side. */}
        <span className="pointer-events-none absolute right-2 -top-6 z-20 whitespace-nowrap rounded-[9px] bg-cream/60 px-2 py-0.5 font-display text-[15px] leading-5 text-indigo shadow-[inset_0_2px_0_0_rgb(255_255_255/0.3)]">
          {skill.pup.name}
        </span>

        {/* THE SURFACE. Indigo depth card (see .skill-surface in index.css),
            laid out as TWO ROWS: the face (two columns) and the disclosure
            (one full-width column). NO min-height floor: every slot inside is
            fixed-size, so the eight cards rest at the same natural height
            (2 + 42 + 28 = 72 of row 1, plus the 16px padding) - and without a
            floor there is no empty band left under the button when the
            accordion is tucked. Only row 2 and the badge stack grow a card,
            and only for the card being opened. Deliberately NOT a stacking
            context (no position, no transform): its z-auto children resolve
            against the wrapper above, so the accordion button can genuinely
            sit on top of the invisible nav button instead of being trapped
            beneath it. */}
<div
          className="skill-surface flex flex-col px-2 pb-2 pt-2"
          style={{ '--skill-glow': accentSoftVar(skill.pup.accent) } as CSSProperties}
        >
          {/* ROW 1 - THE CARD'S FACE. Two columns: pup left (plus badges
              when open), number + name and the accordion button right. */}
          <div className="flex items-stretch gap-1.5">
            {/* LEFT COLUMN: the pup sticker + the reward badges below it. */}
            <div className="flex w-[76px] shrink-0 flex-col items-center">
              {/* THE PUP STICKER. Cut-out (plain), hard sticker shadow, idle
                  float: the Welcome logo's exact treatment, riding the card's
                  top-left edge. `-mt-8` lifts it so its top third hangs above
                  the card. Always the real artwork - earned state is the badge
                  below it once the row opens, not a placeholder here.
                  pointer-events none so a tap on the pup lands on the nav
                  button beneath. */}
              <span className="pointer-events-none relative z-20 -mt-8 block animate-float">
                <PupAvatar
                  pup={skill.pup}
                  size={76}
                  plain
                  className="drop-shadow-[0_6px_0_rgba(26,43,76,0.45)]"
                />
              </span>

              {/* THE REWARD BADGES, stacked below the pup. Shown only once the
                  disclosure is open AND the pupil has earned something - the
                  card's quiet state shows the pup alone. */}
              {open && (lessonDone || earned) && (
                <span className="mt-1 flex flex-col gap-1">
                  {lessonDone && (
                    <span className="rounded-pill bg-lime px-1.5 py-0.5 text-[10px] font-bold text-on-lime">
                      Lesson done
                    </span>
                  )}
                  {earned && (
                    <span className="rounded-pill bg-turquoise px-1.5 py-0.5 text-[10px] font-bold text-on-turquoise">
                      Pup earned
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* RIGHT COLUMN: the skill number + name with the accordion
                button directly beneath - these two things are row 1's right
                side now that the pup name floats outside the card. `min-w-0`
                lets long skill names wrap instead of blowing the card out. */}
            <div className="flex min-w-0 flex-1 flex-col items-start pt-0.5">
              {/* Number and name, in the Hub's yellow-on-indigo. `line-clamp-2`
                  + `min-h-[42px]` give the name a FIXED two-line slot, so a
                  short name ("Text Type") occupies the same space as a long one
                  ("Fact or Opinion") and cannot make one card taller than its
                  neighbour.

                  ENLARGED 2026-10-08 (14/18 -> 17/21): the old sizes read as
                  fine print on the indigo surface. The right column's budget
                  is what caps them: 2 (pt-0.5) + 42 (name) + 0 (mt-0) + 28
                  (button) = 72 of row 1, so with the surface's 16px padding
                  every tucked card is exactly 88px tall - no floor, no empty
                  band. The pup name left the card, so nothing else competes
                  for the space. Do not raise the leading past 21 without
                  re-checking that sum. */}
              <span className="font-display min-h-[42px] w-full text-[17px] leading-[21px] text-yellow line-clamp-2">
                <span className="tabular-nums text-cream/60">{index + 1}.</span> {skill.name}
              </span>

              {/* THE ACCORDION BUTTON, directly under the name and parked at
                  the card's RIGHT edge: `self-end` pushes it against row 1's
                  cross axis end so the tap target sits on the side a thumb
                  reaches for, while the name keeps hugging the left. The
                  button sits up tight against the name slot (mt-0) so the two
                  read as one control. `z-30` keeps it a clickable button
                  above the z-10 nav overlay; it is a brother of that overlay
                  button, NOT its parent, so expanding row 2 can never nest a
                  button inside a button. The icon rotates while row 2 opens. */}
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={`skill-desc-${skill.id}`}
                aria-label={open ? `Hide ${skill.name} details` : `Show ${skill.name} details`}
                className="relative z-30 mt-0 flex h-7 w-7 items-center justify-center self-end rounded-[9px] bg-cream/15 text-cream shadow-[inset_0_2px_0_0_rgb(255_255_255/0.3)] transition-transform duration-200 active:scale-90"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* ROW 2 - THE DISCLOSURE, ONE FULL-WIDTH COLUMN. It deliberately
              ignores row 1's two columns: the purpose runs the card's entire
              inner width, so the description reads as its own band under the
              face. Collapsed it is a 0fr grid row - invisible and zero tall -
              that grows to 1fr (ease) when the button opens it. `min-h-0` on
              the inner span is what actually lets the row collapse; without it
              overflow hidden clamps at text height and the fold never closes.

              `mb-2` on the purpose is not decoration: the row gap (gap-y-8,
              32px) already lets the card below's pup sticker and glass name
              pill clear this card by 8px - the margin keeps the purpose's
              last line even further off the card below, however tall this
              card grows. */}
          <span
            id={`skill-desc-${skill.id}`}
            aria-hidden={!open}
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <span className="min-h-0 overflow-hidden">
              <span className="mt-1.5 mb-2 block text-[12px] leading-[16px] text-cream/80">
                {skill.purpose}
              </span>
            </span>
          </span>
        </div>
      </div>
    </li>
  )
}