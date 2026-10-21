import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SKILLS } from '@/content/manifest'
import { WORLD } from '@/content/world'
import { play, unlockAudio } from '@/lib/audio'
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

export function Welcome() {
  const navigate = useNavigate()
  const learnerCode = useGameStore((s) => s.learnerCode)
  const avatarId = useGameStore((s) => s.avatarId)
  const setAvatar = useGameStore((s) => s.setAvatar)
  const rollLearnerCode = useGameStore((s) => s.rollLearnerCode)
  const startGame = useGameStore((s) => s.startGame)
  const introCompleted = useGameStore((s) => s.introCompleted)
  const [tapped, setTapped] = useState(false)

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
          Let&apos;s start!
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
            and never clips it against the viewport top. */}
        <div className="flex flex-col items-center">
          <img
            src="/assets/brand/quizon-logo.png"
            alt=""
            width={240}
            height={240}
            className="relative z-10 -mb-16 h-[240px] w-[240px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
          />
          <div className="hero-surface w-full px-4 pt-20 pb-6 text-center">
            <p className="text-[22px] leading-7 font-bold tracking-wide text-turquoise">
              {WORLD.subtitle}
            </p>
            <p className="mt-1 font-semibold text-cream">{WORLD.tagline}</p>
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
          <div className="grid grid-cols-4 gap-2">
            {SKILLS.map((skill) => {
              const active = avatarId === skill.pup.id
              return (
                <button
                  key={skill.pup.id}
                  type="button"
                  onClick={() => {
                    play('select')
                    setAvatar(skill.pup.id)
                  }}
                  aria-pressed={active}
                  className={`relative flex flex-col items-center gap-1 rounded-[16px] p-2 shadow-[0_3px_0_0_rgb(26_43_76/0.14)] ${active ? 'bg-turquoise' : 'bg-cream'
                    }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo text-[12px] font-bold text-cream"
                    >
                      ✓
                    </span>
                  )}
                  <PupAvatar pup={skill.pup} size={64} />
                  <span
                    className={`text-[13px] leading-4 font-bold ${active ? 'text-on-turquoise' : 'text-indigo'}`}
                  >
                    {skill.pup.name}
                  </span>
                  <span className="sr-only">{active ? 'Selected' : ''}</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </ScreenFrame>
  )
}