import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
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

  return (
    <ScreenFrame
      title="Before you start"
      subtitle={`Panel ${panel + 1} of ${total}`}
      onBack={panel === 0 ? undefined : () => setPanel(panel - 1)}
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

      <ol className="mt-6 flex justify-center gap-2" aria-label="Story panels">
        {WORLD.intro.map((p, i) => (
          <li key={p.title}>
            <button
              type="button"
              onClick={() => setPanel(i)}
              aria-label={`Go to panel ${i + 1}: ${p.title}`}
              aria-current={i === panel}
              className={`h-4 w-4 rounded-full shadow-[inset_0_-3px_0_0_rgb(26_43_76/0.12)] ${
                i === panel ? 'bg-turquoise' : 'bg-indigo-soft'
              }`}
            />
          </li>
        ))}
      </ol>

      <p className="mt-6 text-center text-sm text-navy/80">
        {SKILLS.length} helpers, eight reading skills, three places to visit.
      </p>
    </ScreenFrame>
  )
}