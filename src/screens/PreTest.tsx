import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenFrame, ProgressBar, useBack } from '@/components/ScreenFrame'
import { QuestionCard } from '@/components/QuestionCard'
import { PupAvatar } from '@/components/PupAvatar'
import { SKILL_BY_ID, TEACHER } from '@/content/manifest'
import { SPECIES_NAME } from '@/content/schemas'
import { getPreTest } from '@/content/questions'
import { PRETEST_QUESTION_COUNT } from '@/constants/gameConfig'
import { shuffleQuestionOptions } from '@/logic/select'
import { play } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'
import { useReducedMotion } from '@/lib/useReducedMotion'

/* ===========================================================================
   THE PRE-TEST - five items, and PERFECTION earns the pup.

   THIS GATE IS DELIBERATELY DIFFERENT FROM THE QUIZ GATE (gameConfig): a
   pre-test demands 5/5 with free unlimited retries, while a level demands 70%
   with three attempts. One guards a single skill and is cheap enough that
   perfection is genuinely achievable for a nine-year-old; the other is
   cumulative assessment. Collapsing them into one number would either make the
   pre-test unpassable or the level too easy.

   ALL FIVE ON ONE SCROLL, so the child sees the whole scope before starting
   rather than discovering there were more.
   =========================================================================== */

export function PreTest() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack()
  const reduced = useReducedMotion()

  const recordPreTest = useGameStore((s) => s.recordPreTest)
  const skill = SKILL_BY_ID[id]
  // Wrapped, not passed by reference: shuffleQuestionOptions takes an optional
  // `rand` as its second argument, and .map would hand it the array index.
  const items = useMemo(
    () => getPreTest(skill?.name ?? '').map((q) => shuffleQuestionOptions(q)),
    [skill],
  )

  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const [earned, setEarned] = useState(false)
  /* Whether the pup was already earned before THIS check (captured before
     recordPreTest, so the done screen can tell "newly joined" apart from
     "joined a while ago" - and, crucially, tell either apart from "passed
     but never earned", which the old copy collapsed into a lie). */
  const [wasEarned, setWasEarned] = useState(false)

  if (!skill) {
    return (
      <ScreenFrame title="Check" onBack={back}>
        <p className="card-cream p-4 text-indigo">That skill does not exist.</p>
      </ScreenFrame>
    )
  }

  const total = items.length || PRETEST_QUESTION_COUNT
  const question = items[index]

  const finish = () => {
    const got = correct
    const hadIt =
      useGameStore.getState().skills.some((k) => k.id === skill.id && k.pupEarned) === true
    const newly = recordPreTest(skill.id, got, total)
    setWasEarned(hadIt)
    setEarned(newly)
    setDone(true)
    if (newly) play('celebrate')
    else play('tap')
  }

  const advance = () => {
    if (index + 1 >= items.length) finish()
    else setIndex(index + 1)
  }

  if (done) {
    const passed = correct >= total
    return (
      <ScreenFrame
        title="The check"
        onBack={() => navigate('/skills')}
        bar={
          <button
            type="button"
            onClick={() => navigate(passed ? '/skills' : `/skill/${skill.id}`)}
            className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
          >
            {passed ? `Back to ${SPECIES_NAME} School` : 'Look at the lesson again'}
          </button>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          {passed && (
            <PupAvatar
              pup={skill.pup}
              size={200}
              state="happy"
              className={reduced ? '' : 'animate-bounce-happy'}
            />
          )}

          <p className="font-display text-[40px] leading-10 text-indigo tabular-nums">
            {correct} / {total}
          </p>

          {earned ? (
            <>
              <p className="font-display text-[26px] leading-8 text-indigo">
                {skill.pup.name} has joined your roster!
              </p>
              <p className="max-w-sm text-indigo">
                {skill.pup.name} helps with {skill.name} whenever you need it.
              </p>
            </>
          ) : wasEarned ? (
            <p className="max-w-sm text-indigo">
              {skill.pup.name} is already on your roster. Keep going.
            </p>
          ) : passed ? (
            <>
              {/* A pass is NOT an earn. This branch only exists because the old
                  copy said "{skill.pup.name} is already on your roster" for any
                  pass, so a learner who passed 4/5 without ever earning was told
                  the pup was theirs - and the bench disagreed. The pup belongs
                  to the roster only at PERFECTION; say so plainly. */}
              <p className="font-display text-[24px] leading-8 text-indigo">
                So close - {correct} / {total}.
              </p>
              <p className="max-w-sm text-indigo">
                {skill.pup.name} joins your roster only when you get all {total} right.
                You can try the check again any time.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-[24px] leading-8 text-indigo">
                Not yet &mdash; let&apos;s try that again.
              </p>
              <p className="max-w-sm text-indigo">
                No problem. Look at the rule once more, then come back. You need all {total}{' '}
                right to earn {skill.pup.name}.
              </p>
            </>
          )}

          {earned && (
            <p className="text-sm text-navy/80">
              <span className="font-bold">{TEACHER.name}:</span> well done. That one is yours now.
            </p>
          )}
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame
      title={`Check: ${skill.name}`}
      subtitle={`${correct} correct so far`}
      onBack={back}
      footer={
        <div className="mx-auto w-full max-w-2xl px-4 pb-2">
          <ProgressBar value={index} max={items.length} label="Pre-test progress" />
        </div>
      }
    >
      {question ? (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          total={items.length}
          onResolve={(ok) => setCorrect((c) => c + (ok ? 1 : 0))}
          onAdvance={advance}
        />
      ) : (
        <div className="card-cream p-4">
          <p className="text-indigo">
            There are no check items for this skill yet. The education group is still writing them.
          </p>
        </div>
      )}
    </ScreenFrame>
  )
}