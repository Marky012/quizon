import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { InstallButton } from '@/components/InstallButton'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SkillSymbol } from '@/components/SkillSymbol'
import { SKILLS } from '@/content/manifest'
import { WORLD } from '@/content/world'
import { play, unlockAudio } from '@/lib/audio'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   WELCOME - the first screen a child sees.

   TWO THINGS HAPPEN HERE AND THEY ARE DELIBERATE.

   1. NO REAL NAME, EVER. The learner gets a random code like BAL-47 with a
      re-roll. This is the RA 10173 posture for an app collecting children's
      reading data, and it means a teacher can attribute a result without the
      app ever holding a name. The label is "Your code" and the line beneath
      says outright that it is not a name, because a learner who thinks their
      code IS their name will say it out loud.

   2. THE AVATAR IS ONE OF THE EIGHT PUPS, not a person. Choosing a favourite
      helper is the whole engagement step, and it needs no reading.
   =========================================================================== */

/**
 * The size of one pup tile in the picker.
 *
 * BIGGER THAN THE GRID COLUMN ON PURPOSE, so the tiles hang over their
 * neighbours and the eight of them read as a huddle instead of a spreadsheet.
 *
 * At 360px the content column is 328px, so each of the four columns is 82px
 * and a 112px tile overhangs it by 15px a side - the neighbour covers 30px of
 * the tile beside it, which is a quarter of the tile and plainly visible.
 *
 * WHY THAT DOES NOT HIDE THE FACES. What the overlap eats is the OUTER part
 * of the tile: the dog art sits in the middle 60% of it, and the head in the
 * middle 35%, so the 82px that survive the neighbour's overhang still hold
 * the whole head and most of the body. At 320px the columns are 72px and a
 * 112px tile bleeds 4px past the screen edge, which is the price of the
 * huddle and is the only part of a tile that gets cut.
 */
const PUP_SIZE = 112

/**
 * Where one pup sits in the huddle: a tilt and a lift.
 *
 * THE ROW CURVES. Four across is a line, and a line of eight dogs is a
 * spreadsheet. The outer pups tilt away from the middle and sit lower, so the
 * row reads as the top of a mound rather than a row of cards - the same gentle
 * arc the art bible draws above the Welcome wordmark in panel 02.
 *
 * The tilt is small on purpose: 5 degrees is enough to break the grid, and
 * more than that starts to look like a card game rather than a pile of
 * puppies.
 */
function arcFor(index: number): { tilt: number; lift: number } {
  const col = index % 4
  // -1 on the left pup, +1 on the right one, 0 in the middle.
  const spread = (col - 1.5) / 1.5
  return {
    tilt: spread * 5,
    // The middle two sit highest, the outer two lowest.
    lift: Math.abs(spread) * 7,
  }
}

export function Welcome() {
  const navigate = useNavigate()
  const learnerCode = useGameStore((s) => s.learnerCode)
  const avatarId = useGameStore((s) => s.avatarId)
  const setAvatar = useGameStore((s) => s.setAvatar)
  const rollLearnerCode = useGameStore((s) => s.rollLearnerCode)
  const startGame = useGameStore((s) => s.startGame)
  const introCompleted = useGameStore((s) => s.introCompleted)
  const [tapped, setTapped] = useState(false)
  /* The burst counter, not a boolean. The confetti is a CSS animation, and a
     CSS animation only plays once per mount - so tapping a second pup has to
     REMOUNT the burst, and a changing key is what does that. A boolean would
     fire the first time and then sit there, already finished, forever. */
  const [burst, setBurst] = useState(0)
  const reduced = useReducedMotion()

  /* One-way door, the same pattern Profile already uses. Once the intro has
     finished this screen is no longer an active step - a returning learner who
     types /welcome (or follows a stale browser-back entry) must not be walked
     through the setup spine again. Boot decides where they actually land.

     Deliberately keyed on introCompleted and NOT on hasStarted: mid-first-run
     the learner can still back out of Profile's panel 0 to here to re-pick a
     helper (hasStarted is already true by then, so a hasStarted guard would
     bounce them mid-back). KNOWN LIMIT: the helper picker lives only on this
     screen, so after onboarding the choice is frozen - the "change later"
     promise covers setup only. If re-picking post-hub ever matters, the picker
     moves to Settings rather than un-gating this screen. */
  if (introCompleted) return <Navigate to="/" replace />

  /* THE CHOSEN SKILL. The eight helpers are not eight pets - each one OWNS one
     of the eight reading skills, and this is the lookup that says which skill
     the tapped pup teaches. Without it the picker is decoration; with it, the
     child is choosing the reading power they will practise first.

     avatarId always names a real pup (the store seeds it from SKILLS[0] and
     only setAvatar writes it), so the fallback is belt-and-braces rather than
     a real case. */
  const chosen = SKILLS.find((s) => s.pup.id === avatarId) ?? SKILLS[0]!

  function choose(pupId: string) {
    play('select')
    setAvatar(pupId)
    if (reduced) return
    /* The celebration. The app already says "you earned something" with
       confetti on the Hub, so this is the same language on the first screen:
       picking a teammate is a real decision and it deserves a real
       "yes!". 3.4s is the longest a piece can live (2.7s of fall plus a
       0.4s delay), so the burst is unmounted just after the last piece
       lands off-screen. */
    setBurst((n) => n + 1)
    window.setTimeout(() => setBurst(0), 3400)
  }

  function begin() {
    unlockAudio()
    play('unlock')
    setTapped(true)
    startGame()
    // A beat of feedback before moving, so the tap is acknowledged. Next stop
    // is the Profile screen: the pupil picks their player and nickname there.
    window.setTimeout(() => navigate('/profile'), 220)
  }

  return (
    <ScreenFrame
      bar={
        <button
          type="button"
          onClick={begin}
          className={`btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise ${tapped ? 'animate-bounce-happy' : ''
            }`}
        >
          Start the quest!
        </button>
      }
    >
      {/* -mt-3 eats most of the frame's 16px top padding so the mark starts high
          on the screen; the logo IS the header on this screen, so the little
          strip of blue above it reads as wasted header space. */}
      <div className="-mt-3 flex flex-col gap-6">
        {/* HERO: no title bar on this screen - the logo IS the header. The logo
            sits in normal flow and the blue card is pulled up under it with a
            negative bottom margin, so the pup's lower half overlaps the card's
            top edge and comes to rest just above the wordmark instead of
            floating above a separate title row. Doing it with flow (rather than
            absolute positioning) keeps the whole mark on screen at 320px wide
            and never clips it against the viewport top.

            THE MARK IS 210px, NOT 240px, and that is a FOLD-OVERFITTING
            DECISION. At 240px the hero and its card together stood 350px tall,
            which on a 360x640 phone pushed the first row of pups under the
            fixed "Start the quest!" bar - a child met four half-dogs and a
            button. At 210px the mark still owns the screen, and the whole
            first row of helpers plus their names now clears the bar.

            pt-16 rather than pt-20 for the same reason: the card's top padding
            is the space the logo's lower half hangs into, and the shorter
            mark needs less of it. */}
        <div className="flex flex-col items-center">
          <img
            src="/assets/brand/quizon-logo.png"
            alt=""
            width={210}
            height={210}
            className="relative z-10 -mb-16 h-[210px] w-[210px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
          />
          <div className="hero-surface w-full px-4 pt-16 pb-5 text-center">
            <p className="text-[22px] leading-7 font-bold tracking-wide text-turquoise">
              {WORLD.subtitle}
            </p>
            {/* text-balance, so the tagline breaks evenly instead of leaving
                "town." alone on the second line. */}
            <p className="mt-1 text-balance font-semibold text-cream">{WORLD.tagline}</p>
          </div>
        </div>

        {/* THE LEARNER CODE IS TEMPORARILY HIDDEN, 2026-10-05. The feature is
            not removed - the store field, the roll action, the report field and
            the export filenames are all untouched - only this screen stopped
            asking for it. It was the loudest thing on the first-run screen and
            it competes with the one decision that screen actually needs the
            child to make, which is picking a helper.

            To bring it back, restore this section verbatim and re-add the two
            store reads at the top of the file. Nothing else has to change. */}
        <section className="card-cream hidden p-4">
          <h2 className="mb-1 text-[20px] text-indigo">Your code</h2>
          <p className="mb-3 text-indigo/85">
            This is not your name. It is a code so your teacher can find your work.
          </p>
          <div className="flex items-center gap-3">
            <output className="font-display flex-1 rounded-[12px] bg-yellow-soft px-3 py-2 text-[28px] leading-9 text-indigo tabular-nums">
              {learnerCode}
            </output>
            <button
              type="button"
              className="btn-chunky bg-yellow px-4 py-3 text-indigo"
              onClick={() => {
                play('tap')
                rollLearnerCode()
              }}
            >
              New code
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-[20px] text-indigo">Choose your helper</h2>
          <p className="mb-3 text-indigo/85">You can change this later.</p>

          {/* THE HUDDLE. The eight helpers overlap each other the way the pack
              overlaps on the Hub's grass bench, so the row reads as one group of
              dogs instead of eight app icons in a grid.

              THE OVERLAP IS IN THE TILE, NOT IN THE COLUMN, and that is the whole
              trick. Each pup keeps its own grid column, so its name still sits
              under its own face, but the round tile is WIDER than its column and
              hangs over its neighbour. The neighbour is painted later, so it
              covers the hanging edge and the face stays whole in the middle.

              WHICH IS WHY THE BENCH LAYOUT WAS NOT COPIED. The bench runs eight
              112px dogs in 45px columns, so each dog shows about 40% of itself.
              That is fine for a decorative row with no tap targets, and it is
              exactly why that file says the layout must never be reused for
              anything the child has to hit. Here every pup keeps about 80% of
              its width, which is both a face you can recognise and a tap target
              well over the 44px minimum.

              THE SELECTED PUP COMES FORWARD, exactly as art bible 1.4 says: it
              scales to 1.06, gains a 4px indigo ring, and is raised above its
              neighbours so its check badge is never buried under the next dog. */}
          <div className="grid grid-cols-4 gap-y-1">
            {SKILLS.map((skill, index) => {
              const active = avatarId === skill.pup.id
              const { tilt, lift } = arcFor(index)
              const col = index % 4
              return (
                <button
                  key={skill.pup.id}
                  type="button"
                  onClick={() => choose(skill.pup.id)}
                  aria-pressed={active}
                  /* THE FAN ORDER. Within a row the LEFT-most pup is in front,
                     like a hand of cards fanned from the left, so the row has a
                     front edge instead of a stack of equal tiles. The selected
                     pup is above all of them, so its ring and badge are never
                     buried under a neighbour. */
                  /* THE ASSEMBLY. The huddle drops into place like a team photo
                     being taken - eight tiles, staggered left to right, top row
                     first. The animation lives on THIS element, not on the tile
                     span, because the tile already carries the arc's own
                     transform and two transforms on one element fight.

                     NOT APPLIED AT ALL under reduced motion. index.css collapses
                     the DURATION globally but says nothing about the DELAY, and
                     a staggered animation holds the `from` state (invisible)
                     until its delay elapses - so a motion-reduced learner would
                     stare at eight empty gaps for the length of the stagger. */
                  className={`relative flex flex-col items-center ${reduced ? '' : 'animate-huddle-in'}`}
                  style={{
                    zIndex: active ? 30 : 10 + (3 - col),
                    animationDelay: reduced ? undefined : `${90 + index * 45}ms`,
                  }}
                >
                  <span className="relative block w-full" style={{ height: PUP_SIZE + 12 }}>
                    <span
                      className="absolute top-0 left-1/2 transition-transform"
                      style={{
                        width: PUP_SIZE,
                        height: PUP_SIZE,
                        // Composed by hand: Tailwind's translate/rotate/scale
                        // utilities would compose too, but this one needs the
                        // arc's numbers as well.
                        transform: `translate(-50%, ${lift}px) rotate(${tilt}deg) scale(${
                          active ? 1.06 : 1
                        })`,
                      }}
                    >
                      <PupAvatar
                        pup={skill.pup}
                        size={PUP_SIZE}
                        /* THE DEPTH. A soft drop shadow is what tells the eye
                           that these are tiles ON TOP of each other rather than
                           a row of tiles that happen to touch. */
                        className={`drop-shadow-[0_8px_12px_rgb(26_35_126/0.4)] ${
                          active ? 'ring-4 ring-indigo rounded-[28px]' : ''
                        }`}
                      />
                    </span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo text-[14px] leading-none font-bold text-cream"
                      >
                        ✓
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[13px] leading-4 font-bold ${
                      active ? 'text-indigo' : 'text-indigo/70'
                    }`}
                  >
                    {skill.pup.name}
                  </span>
                  <span className="sr-only">{active ? 'Selected' : ''}</span>
                </button>
              )
            })}
          </div>

          {/* THE READOUT. This is the answer to the tap, and it sits directly
              under the finger that made it: the ring and the badge say "you
              picked THIS one", and this card says what you picked it FOR.

              It is the one piece of new information on the screen, and it is
              the reason the picker is a decision rather than decoration. The
              eight pups each own one reading skill, so the child is choosing
              the reading power they will practise first - and they meet all
              eight skill names by their own names, which is the vocabulary the
              rest of the app, the lessons and the report all use.

              IT IS A LIVE REGION, because a screen-reader user gets the
              selection from the button's own "Selected" text and would
              otherwise never hear which skill they just chose. The purpose
              line is the manifest's own wording, verbatim, so it says exactly
              what the Hub's skill card says about the same skill. */}
          <div
            aria-live="polite"
            className="card-cream mt-3 flex items-center gap-3 p-3"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-turquoise-soft">
              <SkillSymbol id={chosen.symbol} size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[19px] leading-6 text-indigo">
                  {chosen.pup.name}
                </span>
                <span className="text-[13px] leading-4 font-bold text-navy/70">
                  {chosen.name}
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-4 text-navy/85">
                {chosen.purpose}
              </span>
            </span>
          </div>

          {/* THE INSTALL OFFER. The boot screen gets one too, but the boot
              screen is over in about a second and the browser's offer usually
              arrives after that - so the reliable place for it is here, where
              the child is picking a helper and has time to look. It renders
              nothing at all unless the browser has actually offered, so on a
              device that already has QuizOn! installed it is simply absent. */}
          <InstallButton className="mt-4" />
        </section>
      </div>

      {/* THE CELEBRATION. Mounted only for the length of the burst, and
          keyed on the counter so each new tap replays it. Purely decorative
          and already reduced-motion aware inside ConfettiBurst. */}
      {burst > 0 && <ConfettiBurst key={burst} />}
    </ScreenFrame>
  )
}