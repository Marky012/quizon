import { useState, type CSSProperties } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SkillSymbol } from '@/components/SkillSymbol'
import { StepIndicator } from '@/components/StepIndicator'
import { StarGlyph } from '@/components/LessonParts'
import { ONBOARDING_TOTAL, STEP_STORY } from '@/constants/onboarding'
import { PUP_BY_ID, SKILLS } from '@/content/manifest'
import { WORLD } from '@/content/world'
import { accentGlowVar, accentInk, accentVar } from '@/lib/accents'
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
        className={`flex flex-col gap-5 pb-2 ${reduced ? '' : 'animate-slide-up'}`}
      >
        {current && (() => {
          const pup = PUP_BY_ID[current.pupId]
          const skill = pup ? SKILLS.find((s) => s.pup.id === pup.id) : undefined
          const glow = pup ? accentGlowVar(pup.accent) : 'var(--color-turquoise)'
          const accent = pup ? accentVar(pup.accent) : 'var(--color-turquoise)'
          const ink = pup ? accentInk(pup.accent) : 'var(--color-on-turquoise)'

          return (
            <section
              className="school-card halo-right group relative mt-8 overflow-visible rounded-[24px] p-5 pt-6 text-cream"
              style={{ '--skill-accent': glow } as CSSProperties}
            >
              {/* FLOATING PUP CUT-OUT STICKER (No white/cream background box) */}
              {pup && (
                <div
                  className={`pointer-events-none absolute -top-11 right-2 z-20 block ${
                    reduced ? '' : 'animate-float'
                  }`}
                >
                  <div className="school-pup block">
                    <PupAvatar
                      pup={pup}
                      size={144}
                      plain
                      className="drop-shadow-[0_4px_0_rgba(26,43,76,0.55)] drop-shadow-[0_14px_18px_rgba(8,12,52,0.45)]"
                    />
                  </div>
                </div>
              )}

              {/* STORY CHAPTER & HELPER HEADER BAND */}
              <div className="relative z-10 flex max-w-[calc(100%-115px)] flex-col gap-2">
                <div className="flex items-center gap-2">
                  {skill && (
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] shadow-sm"
                      style={{ backgroundColor: accent, color: ink }}
                    >
                      <SkillSymbol id={skill.symbol} size={18} color="currentColor" />
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-yellow ring-1 ring-yellow/40">
                    <StarGlyph className="h-3 w-3" />
                    Story {panel + 1} of {total}
                  </span>
                </div>

                <h2 className="font-display text-[25px] font-bold leading-7 tracking-tight text-white">
                  {current.title}
                </h2>
              </div>

              {/* STORY PASSAGE */}
              <div className="relative z-10 mt-5 border-t border-white/15 pt-4">
                <p className="rounded-[18px] bg-cream p-4 text-[17px] font-semibold leading-[26px] text-indigo shadow-[inset_0_2px_0_0_rgb(26_43_76/0.06),0_6px_14px_-8px_rgb(8_12_52/0.4)]">
                  {current.body}
                </p>

                {/* HELPER SPOTLIGHT BAND */}
                {pup && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-white/[0.08] px-3.5 py-2.5 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: glow }}
                      />
                      <p className="text-[14px] leading-5 text-cream/95">
                        <span className="font-display text-[17px] font-bold text-yellow">
                          {pup.name}
                        </span>{' '}
                        is one of your eight helpers.
                      </p>
                    </div>
                    {skill && (
                      <span
                        className="rounded-pill px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider shadow-sm"
                        style={{ backgroundColor: accent, color: ink }}
                      >
                        {skill.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>
          )
        })()}
      </div>

      <p className="mt-6 text-center text-sm text-navy/80">
        {SKILLS.length} helpers, eight reading skills, three places to visit.
      </p>
    </ScreenFrame>
  )
}