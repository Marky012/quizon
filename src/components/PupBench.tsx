import { useEffect, useMemo, useState } from 'react'
import { SKILLS } from '@/content/manifest'
import { PupAvatar } from '@/components/PupAvatar'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   PUP BENCH - the pack of dogs on the grass at the bottom of the Hub.

   This replaced the pup roster screen. There used to be a fourth hub card that
   opened a sticker-album screen, and it was a bad screen for two reasons: a
   locked card whose only content is "earn a pup first" is a dead end, and the
   one thing the child wants to see - the dogs actually collected - was one tap
   away and off the home screen. The pack is now always visible, so the roster
   screen was deleted outright on 2026-10-05 along with its route and its stage
   entry.

   THE ART IS REAL AND IT IS FULL-BODY, so this is a LANDSCAPE, NOT A GRID. The
   eight pup PNGs are standing illustrations. An earlier version treated them as
   eight avatar tiles, which put a rounded square around each dog, a cream plate
   behind each dog, and a pill around each name. Laid out that way the dogs read
   as eight app icons parked on a shelf, not as animals on a lawn. All of that
   chrome is gone - the pill over a name now is the bench's self-spotlight, a
   moving highlight, not a fixture.

   EARNED SHOWS, UNEARNED WASHES OUT. A pup the learner has collected stands in
   full colour; a pup still to earn is greyscaled. Greyscale only - opacity is
   kept at 100%, because the old "32% and greyscale" treatment made the pack
   look abandoned. Every dog is still there; the colour difference is the
   progress story the roster used to tell.

   THE GRASS IS ONE UNMODIFIED IMAGE, drawn at full container width. No crop, no
   gradient layer, no background-size pinning, no second file.

   MOBILE-FIRST, AND THE DOGS ARE MEANT TO TOUCH. The layout is designed at 360px
   and grows: eight flex-1 columns across the full container width, each 45px,
   each holding a 112px figure. So on a phone every dog overlaps its neighbours
   by about two thirds and the pack reads as a huddle; as the container widens the
   overlap shrinks until at 896px the columns are 112px and the dogs stand exactly
   shoulder to shoulder with no gap. Nothing is ever spread apart, which is the
   failure mode this row exists to avoid.

   NAMES AND DOGS SHARE ONE ANCHORED BLOCK. Both lists live in a single absolute
   wrapper pinned to PUP_GROUND, with the names above the dogs. That is the
   structural decision worth keeping: the wide grass image is short (153px at
   360px wide, 380px at 896px), so anchoring the two lists independently to
   percentages of it would put the names below the dogs' heads on mobile and
   inside their legs on desktop. Anchoring them together means the names sit on
   top of the dogs at every width, and only the block moves.

   THE NAMES ARE A SELF-SPOTLIGHT, NOT A STATIC LABEL STRIP. A timer sweeps one
   highlighted name left to right across the pack, one pup at a time. The lit
   name sits in the same glass pill the Woof School grid uses and is a size up
   from its neighbours; every other name stays at stock size in a muted grey
   (text-navy/45, deliberately NOT the indigo ink of the app body - the pill is
   the one lit thing).

   THE SPOTLIGHT RUNS REGARDLESS OF REDUCED MOTION, and the pill's pop-in is
   what reduces, not the sweep itself. The highlight is orientation - WHICH dog
   the name belongs to - more than decoration, and stopping it entirely on a
   reduced-motion machine left the hub feeling dead at a glance. The global
   reduced-motion block in index.css collapses the keyframe to ~zero duration,
   so such a machine gets the same sweep as every other screen, just with the
   pill appearing instantly instead of popping to size. No scaling, no bounce:
   exactly what art bible 10.2 allows.
   =========================================================================== */

/** One name per tick. 1400ms is an idle pace: a full pass of eight names takes
 *  about 11s, long enough for the highlight to rest, short enough that it is
 *  obviously moving. */
const TICK_MS = 1400

/* Percentage of the SECTION height, measured up from its bottom edge, where the
   dogs' paws land. The grass image has transparent sky above 80%, a ragged blade
   band from 64% to 80%, and solid soil below 64%. So:

   - a value under 64 puts the paws on solid soil, with the blades rising behind
     the dogs rather than under them, which is what a standing animal looks like.
   - a value over 64 puts the paws in the blades and the dogs appear to be
     floating in the grass.
   - a value over 80 puts them in the transparent sky above the artwork.

   35% is deliberately below the blade band: the dogs stand ON the ground and the
   grass stands behind them. Lowering it moves both the dogs and their names
   down together, because they share this one anchor. The overhang above the
   image shrinks as this falls, so mt-16 on the section stays generous. */
const PUP_GROUND = '35%'

export function PupBench() {
  const skills = useGameStore((s) => s.skills)
  const earnedById = useMemo(
    () => new Map(skills.map((k) => [k.id, k.pupEarned])),
    [skills],
  )

  /* THE SELF-SPOTLIGHT TIMER. One name is lit at a time, always moving right;
     at the last pup it wraps to the first. Paused while the tab is hidden so
     an idling phone does not burn a setState loop nobody can see. Runs even
     under reduced motion - see the module comment for why the highlight
     survives while the pop-in animation does not. */
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return
      setActive((a) => (a + 1) % SKILLS.length)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    /* CENTERED AND CAPPED. Without the cap the image ran the full viewport
       width, so on a 1920px monitor the footer became a 815px-tall green wall
       and the eight dogs were spread across a field the width of a car. The cap
       is the same max-w-4xl the carousel uses, so the grass, the cards and the
       header all share one edge.

       mt-16 is NOT decoration. Worked out for the 360px case, where the grass
       is 360 * 1344/3168 = 153px tall: PUP_GROUND puts the block's baseline at
       84px, the block itself is about 130px (112px of dog + 18px of name), so
       its top sits at 214px - roughly 61px ABOVE the top of the image. That
       overhang would otherwise collide with the carousel. Margin is outside the
       containing block, so it reserves the space without changing what
       PUP_GROUND resolves against, which is what padding would have done.

       On desktop the same 64px reads as a gap between the carousel and the
       grass, because there the image is 380px tall and the block sits entirely
       inside it. */
    <section
      aria-label="Your pups"
      className="relative mx-auto mt-16 w-full max-w-4xl select-none"
    >
      <img
        src="/assets/world/grass.png"
        alt=""
        aria-hidden="true"
        /* w-full + h-auto is the entire layout instruction: the image fills the
           container width and keeps its own aspect ratio, so nothing is cropped,
           squashed or letterboxed at any screen size. */
        className="block h-auto w-full"
        /* Not lazy: this is the visual footer of the landing screen and the
           largest asset in the app. decoding="async" keeps the main thread free
           for the carousel while it decodes. */
        decoding="async"
      />

      {/* ONE BLOCK, TWO ROWS. Pinned at the paws line, names first then dogs, so
          the names are always above the dogs' heads at every container width. */}
      <div className="absolute inset-x-0" style={{ bottom: PUP_GROUND }}>
        {/* THE NAMES - the self-spotlight. Exactly one name carries the glass
            pill; it is a size up and does not truncate, so it can wash over its
            narrow 45px column and the neighbours beside it, which is what makes
            the highlight read as sweeping. Every other name stays stock size,
            truncated to its column, in muted (not indigo) ink. The row is a
            constant height either way - one pill is always present, so nothing
            shifts when the light moves. */}
        <ul className="mb-0.5 flex items-end">
          {SKILLS.map((skill, i) => {
            const lit = i === active
            return (
              <li key={skill.pup.id} className="flex min-w-0 flex-1 justify-center">
                {lit ? (
                  <span
                    className="rounded-[9px] bg-cream/60 px-2 py-0.5 font-display text-[17px] leading-5 whitespace-nowrap text-indigo shadow-[inset_0_2px_0_0_rgb(255_255_255/0.3)]"
                    /* Pop, not fade: the pill lands on a new dog and pops to
                       full size in one tick. Reduced motion collapses this
                       keyframe to ~0ms in index.css, so that machine still
                       sweeps the highlight, just without the pop. */
                    style={{ animation: 'var(--animate-pup-tick)' }}
                  >
                    {skill.pup.name}
                  </span>
                ) : (
                  <span
                    className="max-w-full truncate px-0.5 font-display text-[14px] leading-4 text-navy/45"
                    style={{
                      /* The muted label over mid-green blades needs the same
                         legibility shadow the old cream chips used to supply. */
                      textShadow: '0 1px 0 rgb(255 253 244 / 0.75)',
                    }}
                  >
                    {skill.pup.name}
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        {/* THE DOGS. Same eight flex-1 columns as the names, so every name stays
            over its own dog. At 360px the columns are 45px for a 112px figure -
            heavy overlap, deliberately, because a pack that reads as one huddle
            is the intent and eight separated figures is the bug.

            Each dog's COLUMN is narrower than the dog and the dogs are centred in
            their columns, so a neighbour's flank covers part of the dog beside it.
            That is fine here - these are static decorative figures with no tap
            target - but it is why this layout must never be reused for anything
            the child has to hit.

            Earned dogs keep their colours; unearned dogs are greyscaled (full
            opacity - the colour is the message, not the visibility). */}
        <ul className="flex items-end">
          {SKILLS.map((skill) => {
            const earned = earnedById.get(skill.id) ?? false
            return (
              <li key={skill.pup.id} className="flex min-w-0 flex-1 justify-center">
                <PupAvatar
                  pup={skill.pup}
                  size={112}
                  plain
                  className={earned ? '' : 'grayscale'}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}