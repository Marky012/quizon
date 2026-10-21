import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { SkillSymbol } from '@/components/SkillSymbol'
import { PupAvatar } from '@/components/PupAvatar'
import { SKILL_BY_ID, TEACHER } from '@/content/manifest'
import { PASSAGE_BY_ID } from '@/content/texts'
import { accentInk, accentVar } from '@/lib/accents'
import { play } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE INTERACTIVE LESSON - no video, ever.

   THE REFERENCE APP CARRIED 142 MB OF LESSON VIDEO. That is the single biggest
   memory win available to a school deploying this on shared devices, and it is
   why this screen is built from three text steps plus a worked example instead.

   THE STRUCTURE IS THE PEDAGOGY, and it is deliberately shallow:
     1. THE RULE, stated plainly.
     2. A REAL EXAMPLE, taken from the actual passage bank so the skill is
        demonstrated on the same kind of text the learner will be assessed on.
     3. THE CHECK, which is the pre-test. That is the only place a lesson can
        fail a learner, and it is pass-or-retry rather than a gate.

   Teacher Reyes is NOT used here. She congratulates and guides retries; she
   never appears mid-quiz, and a lesson is not a quiz.

   THE RULE CARD FLOATS THE PUP THROUGH THE TEXT. The pup is a 160px CUT-OUT
   STICKER floated right at the card's top corner - 16px above the card's own
   edge, 12px past its right edge - and the rule's text flows around it: beside
   the pup for the first few lines, full width underneath. That is what kills
   the empty right column the old 2:1 grid left below a small pup - the pup is
   bigger AND the space under it is text, not dead air, and the art can never
   collide with the words because the browser wraps around the float.
   `flow-root` on the section is what makes the card's height contain the float
   (a float alone contributes no height). The header row carries the helper's
   name only: the framed 64px copy of the pup that used to sit there is gone -
   two dogs on one screen said nothing extra, so this is the pup, one time, at
   full size. One layout for all eight skills - the skill resolves from :id,
   everything else is shared.
   =========================================================================== */

export function SkillLesson() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack()
  const [step, setStep] = useState(0)

  const skill = SKILL_BY_ID[id]
  const completeLesson = useGameStore((s) => s.completeLesson)

  if (!skill) {
    return (
      <ScreenFrame title="Lesson" onBack={back}>
        <p className="card-cream p-4 text-indigo">That lesson does not exist.</p>
      </ScreenFrame>
    )
  }

  const example = PASSAGE_BY_ID.T1

  const finish = () => {
    play('unlock')
    completeLesson(skill.id)
    navigate(`/pretest/${skill.id}`)
  }

  return (
    <ScreenFrame
      title={skill.name}
      subtitle={skill.purpose}
      onBack={back}
      bar={
        <button
          type="button"
          onClick={() => {
            play('tap')
            if (step >= 1) finish()
            else setStep(1)
          }}
          className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
        >
          {step >= 1 ? 'Take the check' : 'Show me an example'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] shadow-[inset_0_-6px_0_0_rgb(26_43_76/0.15)]"
            style={{ backgroundColor: accentVar(skill.pup.accent), color: accentInk(skill.pup.accent) }}
          >
            <SkillSymbol id={skill.symbol} size={32} color="currentColor" />
          </span>
          <div>
            <p className="text-sm text-navy/80">Your helper for this skill</p>
            <p className="font-display text-[22px] leading-7 text-indigo">
              {skill.pup.name}
            </p>
          </div>
        </div>

        {/* THE PUP, FLOATED. It must come FIRST in the card's DOM: a float is
            placed at the current line position, so only before the heading can
            its box start at the card's content top - then -mt-8 lifts it 32px
            against the 16px padding, landing its top 16px ABOVE the card's
            edge, the Woof School sticker overhang. After the heading it would
            start a line lower and never reach the edge.

            -mr-7 (28px) hangs it 12px PAST the card's right border: the page
            keeps 16px of padding there, so it lands 4px inside the viewport.
            That overhang is what buys the bigger 160px size without crowding
            the text - on a 360px phone the rule still gets ~150px of measure
            beside the pup, and below it the text runs the card's full width.

            flow-root on the section contains the float for height (short rules
            end with the pup's bottom, 16px of padding, no gap), and nothing
            clips the overhang: .card-cream has no overflow. */}
        <section className="card-cream flow-root p-4">
          <span className="float-right -mt-8 -mr-7 ml-3 mb-2">
            <PupAvatar
              pup={skill.pup}
              size={160}
              plain
              className="drop-shadow-[0_6px_0_rgba(26,43,76,0.45)]"
            />
          </span>
          <h2 className="mb-2 text-[20px] text-indigo">The rule</h2>
          <p className="leading-7 text-indigo">{skill.rule}</p>
        </section>

        {step >= 1 && example && (
          <section className="card-cream animate-slide-up p-4">
            <h2 className="mb-1 text-[20px] text-indigo">An example</h2>
            <p className="mb-2 text-sm text-navy/80">
              <span className="font-bold">{example.title}</span> &middot; {example.textType}{' '}
              &middot; to {example.purpose}
            </p>
            <div className="passage text-indigo">
              {example.sentences.slice(0, 3).join(' ')}
            </div>
          </section>
        )}

        <section className="card-cream bg-turquoise-soft p-4">
          <p className="text-indigo">
            <span className="font-bold">{TEACHER.address} says:</span> do well on the check and{' '}
            {skill.pup.name} joins your roster for good. You can retry as many times as you like.
          </p>
        </section>
      </div>
    </ScreenFrame>
  )
}