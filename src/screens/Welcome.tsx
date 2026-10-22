import { useEffect, useState, type CSSProperties } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { InstallButton } from '@/components/InstallButton'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SkillSymbol } from '@/components/SkillSymbol'
import { StepIndicator } from '@/components/StepIndicator'
import { ONBOARDING_TOTAL, STEP_HELPER } from '@/constants/onboarding'
import { SKILLS } from '@/content/manifest'
import { WORLD } from '@/content/world'
import { accentSoftVar } from '@/lib/accents'
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
 * The size of one pup cut-out in the picker.
 *
 * THE PUPS ARE CUT OUT NOW, NOT TILED. The old picker drew each helper in a
 * 112px cream tile with a navy border, and the TILE was what gave a cream pup
 * (Franky) its silhouette. The tiles are gone: each pup is a sticker riding the
 * top edge of its own indigo card, and the card carries the NAME where the
 * tile used to carry a frame. So the silhouette has to come from somewhere
 * else, and it comes from the card - the dog's body is over the indigo card,
 * its head is over the cream page, and a hard navy drop-shadow gives the head
 * its edge.
 *
 * 88px keeps the dog about 42px wide and 81px tall (the art fills 92% of its
 * box), and leaves room for the name under it in a 76px column.
 */
const PUP_SIZE = 88

/**
 * How much of the sticker's box sits over its own card.
 *
 * The art fills 92% of the box vertically, so a 22px overlap puts the dog's
 * paws about 18px INTO the card and its head about 62px above the card's top
 * edge. The card's top padding (PUP_CARD_PAD) is set to match, so the name
 * always starts clear of the paws.
 */
const PUP_OVERLAP = 22

/**
 * The card's top padding: where the paws land, plus room for them.
 */
const PUP_CARD_PAD = 30

/**
 * How long the toast stays up.
 *
 * The purpose lines are one short sentence, so five seconds is about two reads
 * for a Grade 5 learner. A tap dismisses it sooner, and it never blocks the
 * picker for longer than that.
 */
const TOAST_MS = 5000

/**
 * Where one pup sits in the huddle: a tilt.
 *
 * THE ROW CURVES. Four across is a line, and a line of eight dogs is a
 * spreadsheet. The outer pups lean away from the middle, so the row reads as a
 * pile of puppies rather than a row of cards - the same gentle arc the art
 * bible draws above the Welcome wordmark in panel 02.
 *
 * THE TILT IS ON THE STICKER ONLY, never on the card. A tilted card reads as
 * a broken grid; a tilted PUPPY reads as a pup. So the card stays square to
 * its column and the dog leans on its paws, pivoting from the bottom centre.
 *
 * The tilt is small on purpose: 5 degrees is enough to break the grid, and
 * more than that starts to look like a card game rather than a pile of
 * puppies.
 */
function arcFor(index: number): { tilt: number } {
  const col = index % 4
  // -1 on the left pup, +1 on the right one, 0 in the middle.
  const spread = (col - 1.5) / 1.5
  return { tilt: spread * 5 }
}

export function Welcome() {
  const navigate = useNavigate()
  const learnerCode = useGameStore((s) => s.learnerCode)
  const avatarId = useGameStore((s) => s.avatarId)
  const setAvatar = useGameStore((s) => s.setAvatar)
  const rollLearnerCode = useGameStore((s) => s.rollLearnerCode)
  const startGame = useGameStore((s) => s.startGame)
  const introCompleted = useGameStore((s) => s.introCompleted)
  const profileCreated = useGameStore((s) => s.profileCreated)
  const [tapped, setTapped] = useState(false)
  /* The burst counter, not a boolean. The confetti is a CSS animation, and a
     CSS animation only plays once per mount - so tapping a second pup has to
     REMOUNT the burst, and a changing key is what does that. A boolean would
     fire the first time and then sit there, already finished, forever. */
  const [burst, setBurst] = useState(0)
  const reduced = useReducedMotion()

  /* THE TOAST. Not a boolean: tapping the SAME pup twice has to restart the
     five-second timer, and a boolean would leave the first timer running, so
     the toast would vanish early on the second tap. A fresh object per tap is
     what makes the timer effect below fire again. */
  const [toast, setToast] = useState<{ pupId: string } | null>(null)

  /* THE TOAST TIMER. It runs for TOAST_MS and then takes the toast back down.
     Clearing it on the way out matters: without it a toast that was dismissed
     by a tap would still be holding a timer that fires later and clears a
     toast that has already been replaced. */
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

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

  /* THE TOASTED SKILL. The eight helpers are not eight pets - each one OWNS
     one of the eight reading skills, and this is the lookup that says which
     skill the tapped pup teaches. Without it the picker is decoration; with
     it, the child is choosing the reading power they will practise first.

     Driven by the tap rather than by the store, so the toast can never
     describe a pup the learner did not just pick. */
  const toasted = toast ? SKILLS.find((s) => s.pup.id === toast.pupId) : undefined

  function choose(pupId: string) {
    play('select')
    setAvatar(pupId)
    /* THE ANSWER TO THE TAP. It used to sit in a readout card under the grid,
       which pushed the whole picker down the screen and made the choice feel
       permanent. As a toast it answers the tap and then gets out of the way. */
    setToast({ pupId })
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
    /* A beat of feedback before moving, so the tap is acknowledged.
       Next stop is the Profile screen: the pupil picks their player and
       nickname there.

       THE MARKED RETURN. A learner who walked all the way back here (the
       gender panel's back button) already has a profile, and Profile is
       shut to repeat visits - so without the state it would bounce to Boot,
       which would send them straight to the Intro and skip stops 2 to 4.
       The indicator says the spine has seven stops; this keeps that true.
       A first-timer passes no state, because then those stored values are
       empty and pre-selecting a gender for them would be a lie. */
    window.setTimeout(
      () => navigate('/profile', profileCreated ? { state: { panel: 0 } } : undefined),
      220,
    )
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
        {/* THE SETUP SPINE STARTS HERE. Seven stops run from this picker to the
            last panel of the story, and this screen is the first that shows
            them - there is no back button, because this is the first stop. */}
        <StepIndicator
          index={STEP_HELPER}
          total={ONBOARDING_TOTAL}
          label="Setup progress"
          className="-mb-4"
        />

        {/* HERO: no title bar on this screen - the logo IS the header. The logo
            sits in normal flow and the blue card is pulled up under it with a
            negative bottom margin, so the pup's lower half overlaps the card's
            top edge and comes to rest just above the wordmark instead of
            floating above a separate title row. Doing it with flow (rather than
            absolute positioning) keeps the whole mark on screen at 320px wide
            and never clips it against the viewport top.

            THE MARK IS 190px, NOT 210px, and that is a FOLD-OVERFITTING
            DECISION. At 240px the hero and its card together stood 350px tall,
            which on a 360x640 phone pushed the first row of pups under the
            fixed "Start the quest!" bar - a child met four half-dogs and a
            button. It went to 210px and cleared, then the seven-stop setup
            indicator took 36px back at the top of the screen on 2026-10-22, so
            it went to 190px. 190 still owns the screen and the whole first row
            of helpers, names included, now clears the bar again.

            pt-16 rather than pt-20 for the same reason: the card's top padding
            is the space the logo's lower half hangs into, and the shorter
            mark needs less of it. */}
        <div className="flex flex-col items-center">
          <img
            src="/assets/brand/quizon-logo.png"
            alt=""
            width={190}
            height={190}
            className="relative z-10 -mb-16 h-[190px] w-[190px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
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

          {/* THE HELPER CARDS. Each pup is a cut-out sticker riding the top
              edge of its own indigo card, and the NAME is inside the card.

              WHY CARDS AND NOT TILES. The old picker drew eight cream tiles
              with a navy border, and the name sat on the cream page below
              each one. That gave a cream pup (Franky) its silhouette, but it
              spent a whole screen of height on frames that said nothing, and
              the answer to the tap had to go somewhere else entirely - which
              is why a readout card used to sit under the grid. Now the card
              IS the tile: it carries the pup's accent glow, it carries the
              name, and the pup rides over its top edge the way the Woof
              School stickers ride their skill cards. One box per helper
              instead of a box plus a name plus a readout.

              THE OVERLAP IS IN THE STICKER, NOT IN THE COLUMN. Each pup keeps
              its own grid column - so its name still sits under its own face
              - but the cut-out is WIDER than its column, so it hangs over the
              column's edges and its hard shadow falls across the card's top
              edge. That is what makes eight helpers read as one group
              instead of eight app icons. The column gap absorbs the overhang,
              so a pup never lands on its neighbour's card or its neighbour's
              name.

              THE SELECTED PUP COMES FORWARD, exactly as art bible 1.4 says: it
              scales to 1.06, its card takes a 4px yellow ring, and it is
              raised above its neighbours so its check badge is never buried
              under the next dog. */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {SKILLS.map((skill, index) => {
              const active = avatarId === skill.pup.id
              const { tilt } = arcFor(index)
              const col = index % 4
              return (
                <button
                  key={skill.pup.id}
                  type="button"
                  onClick={() => choose(skill.pup.id)}
                  aria-pressed={active}
                  /* THE NAME IS THE LABEL. One name for the button, said
                     once: the cut-out's own alt text and the name inside the
                     card would otherwise both be read out, so the pup's
                     purpose rides along in the label instead. */
                  aria-label={`Choose ${skill.pup.name}, the ${skill.name} helper`}
                  /* THE FAN ORDER. Within a row the LEFT-most pup is in front,
                     like a hand of cards fanned from the left, so a sticker
                     that reaches over its neighbour's edge never ends up
                     behind it. The selected pup is above all of them, so its
                     ring and badge are never buried under the next dog. */
                  /* THE ASSEMBLY. The huddle drops into place like a team photo
                     being taken - eight helpers, staggered left to right, top
                     row first. The animation lives on THIS element, not on the
                     sticker span, because the sticker already carries the
                     arc's own transform and two transforms on one element
                     fight.

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
                  {/* THE STICKER. Cut out (plain), hard sticker shadow, riding
                      the card's top edge: the Welcome logo's exact treatment,
                      and the Woof School skill card's. The negative bottom
                      margin is what pulls the card up under it, so the paws
                      land ON the card instead of beside it. The tilt pivots
                      from the bottom centre, so the pup leans on its paws and
                      the card stays square. */}
                  <span
                    className="relative z-20 block"
                    style={{
                      marginBottom: -PUP_OVERLAP,
                      transform: `rotate(${tilt}deg) scale(${active ? 1.06 : 1})`,
                      transformOrigin: 'bottom center',
                    }}
                  >
                    <PupAvatar
                      pup={skill.pup}
                      size={PUP_SIZE}
                      plain
                      className="drop-shadow-[0_6px_0_rgba(26,43,76,0.45)]"
                    />
                  </span>

                  {/* THE CARD. Indigo depth (see .skill-surface in index.css)
                      with the pup's own accent as the glow, and the NAME
                      inside it. The top padding is where the paws land, so the
                      name always starts clear of them. */}
                  <span
                    className={`skill-surface relative flex w-full flex-col items-center justify-end rounded-[18px] px-1 pb-1.5 ${
                      active ? 'ring-4 ring-yellow' : ''
                    }`}
                    style={
                      {
                        paddingTop: PUP_CARD_PAD,
                        '--skill-glow': accentSoftVar(skill.pup.accent),
                      } as CSSProperties
                    }
                  >
                    <span className="font-display text-[13px] leading-4 text-cream">
                      {skill.pup.name}
                    </span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-2 right-1 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-yellow text-[14px] leading-none font-bold text-indigo"
                      >
                        ✓
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
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

      {/* THE TOAST. The answer to the tap, and the only piece of new
          information on the screen - it is why the picker is a decision rather
          than decoration. The eight pups each own one reading skill, so the
          child is choosing the reading power they will practise first, and
          they meet all eight skill names by their own names, which is the
          vocabulary the rest of the app, the lessons and the report all use.

          IT IS A TOAST, NOT A CARD UNDER THE GRID, because the card was the
          most expensive thing on this screen: it pushed the whole picker down
          and left a permanent band of new information under a decision the
          child has already made. The toast answers the tap and then gets out
          of the way. It floats just above the fixed bottom bar, and it never
          covers the bar itself.

          IT IS A LIVE REGION, because a screen-reader user gets the selection
          from the button's own aria-pressed state and would otherwise never
          hear WHICH skill they just chose. The container is always mounted and
          only its contents change - a live region that is added to the DOM
          together with its text is unreliable across screen readers. The
          purpose line is the manifest's own wording, verbatim, so it says
          exactly what the Hub's skill card says about the same skill.

          A TAP DISMISSES IT, because a child who has read it should not have
          to wait. The wrapper is pointer-events-none so the toast never
          swallows a tap meant for the page around it; only the toast itself
          is a target. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-40 px-4"
        style={{ bottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)))' }}
      >
        {toasted && (
          <button
            type="button"
            onClick={() => setToast(null)}
            className="pointer-events-auto mx-auto flex w-full max-w-2xl animate-slide-up items-center gap-3 rounded-[18px] bg-cream p-3 text-left shadow-[0_18px_30px_-16px_rgba(26,35,126,0.6)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-turquoise-soft">
              <SkillSymbol id={toasted.symbol} size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[19px] leading-6 text-indigo">
                  {toasted.pup.name}
                </span>
                <span className="text-[13px] leading-4 font-bold text-navy/70">
                  {toasted.name}
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-4 text-navy/85">
                {toasted.purpose}
              </span>
            </span>
          </button>
        )}
      </div>

      {/* THE CELEBRATION. Mounted only for the length of the burst, and
          keyed on the counter so each new tap replays it. Purely decorative
          and already reduced-motion aware inside ConfettiBurst. */}
      {burst > 0 && <ConfettiBurst key={burst} />}
    </ScreenFrame>
  )
}