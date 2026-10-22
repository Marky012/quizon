import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { StepIndicator } from '@/components/StepIndicator'
import { ONBOARDING_TOTAL, STEP_STORY } from '@/constants/onboarding'
import { PUP_BY_ID, SKILLS } from '@/content/manifest'
import { WORLD } from '@/content/world'
import { play } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'
import { useReducedMotion } from '@/lib/useReducedMotion'

/* ===========================================================================
   INTRO - three panels, swipe or skip, then the hub.

   The panels establish the premise without asking a child to read anything
   long: a storm, the texts getting mixed up, and the eight helpers. SKIP is
   always visible and never punished. A learner who has been here before
   mid-session does not need a cutscene, and a required cutscene is exactly how
   a child ends up stuck on a splash screen.

   THESE ARE STOPS 5 TO 7 OF SEVEN. The seven dots at the top started on the
   helper picker and ran through the profile questions, so this screen shows
   where the cutscene sits in the whole first run rather than pretending it is
   the whole thing - see constants/onboarding.ts.
   =========================================================================== */

export function Intro() {
  const navigate = useNavigate()
  const completeIntro = useGameStore((s) => s.completeIntro)
  const hasStarted = useGameStore((s) => s.hasStarted)
  const profileCreated = useGameStore((s) => s.profileCreated)
  const introCompleted = useGameStore((s) => s.introCompleted)
  const [panel, setPanel] = useState(0)
  const reduced = useReducedMotion()

  /* One-way door, mirroring Boot exactly. This screen's only valid state is
     "started, profile made, intro not yet done" - that is precisely the state
     Boot sends you here for. Any other state means the learner deep-linked
     straight past Welcome or Profile (hasStarted / profileCreated false), or is
     replaying a finished cutscene (introCompleted true). In all three cases
     bouncing to / lets Boot pick the right stop instead of letting a stale URL
     decide. */
  if (!hasStarted || !profileCreated || introCompleted) return <Navigate to="/" replace />

  const total = WORLD.intro.length
  const current = WORLD.intro[panel]

  function finish() {
    play('page')
    completeIntro()
    navigate('/hub')
  }

  function next() {
    play('page')
    if (panel + 1 >= total) finish()
    else setPanel(panel + 1)
  }

  /* THE BACK BUTTON ON THE FIRST STORY PANEL. It leaves the cutscene and lands
     back on the Profile screen's nickname panel, carrying the panel number in
     the route state so Profile knows the visit is a step back rather than a
     replay (see the guard there). Without this the spine had a hole: every
     stop from the gender question onward could be walked back except the one
     where the story begins. */
  function back() {
    if (panel > 0) {
      setPanel(panel - 1)
      return
    }
    /* The header's BackButton already plays the tap, so this branch plays
       nothing - a second 'tap' would fire two clicks on one press. */
    navigate('/profile', { state: { panel: 2 } })
  }

  return (
    <ScreenFrame
      title="Before you start"
      /* NO SUBTITLE. It used to say "Panel 2 of 3", and the indicator below
         now says the same thing with a bar and dots instead of three
         words. Saying it twice is noise, and the indicator is the one a
         child can read at a glance. */
      onBack={back}
      headerRight={
        <button
          type="button"
          onClick={finish}
          className="btn-chunky shrink-0 bg-yellow px-4 py-2 text-indigo"
        >
          Skip
        </button>
      }
      bar={
        <button
          type="button"
          onClick={next}
          className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
        >
          {panel + 1 >= total ? 'Go to the hub' : 'Next'}
        </button>
      }
    >
      {/* Stops 5 to 7 of the seven-stop setup spine, which started on the
          helper picker and ran through the profile questions. The bar is a map
          here, not a menu - the dots are not buttons. Tapping the fifth dot on
          a cutscene would be a no-op a child would read as broken, and tapping
          a LATER one would skip a story panel they have not seen. */}
      <StepIndicator
        index={STEP_STORY + panel}
        total={ONBOARDING_TOTAL}
        label="Setup progress"
        className="mb-4"
      />

      <div
        key={panel}
        className={`flex flex-col gap-4 ${reduced ? '' : 'animate-slide-up'}`}
      >
        {current && (
          <>
            <h2 className="font-display text-[26px] leading-8 text-indigo">{current.title}</h2>
            <p className="passage text-indigo">{current.body}</p>
            {PUP_BY_ID[current.pupId] && (
              <div className="flex items-center gap-3">
                <PupAvatar pup={PUP_BY_ID[current.pupId]!} state="idle" size={96} />
                <p className="text-indigo">
                  <span className="font-bold">{PUP_BY_ID[current.pupId]!.name}</span> is one of your
                  eight helpers.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-navy/80">
        {SKILLS.length} helpers, eight reading skills, three places to visit.
      </p>
    </ScreenFrame>
  )
}