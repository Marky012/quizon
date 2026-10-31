import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { QuestionCard } from '@/components/QuestionCard'
import { PupAvatar } from '@/components/PupAvatar'
import { TeacherNote } from '@/components/LessonParts'
import { SKILL_BY_ID } from '@/content/manifest'
import { SPECIES_NAME } from '@/content/schemas'
import { getPreTest } from '@/content/questions'
import { PRETEST_QUESTION_COUNT } from '@/constants/gameConfig'
import { shuffleQuestionOptions } from '@/logic/select'
import { accentGlowVar } from '@/lib/accents'
import { play } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'
import { useReducedMotion } from '@/lib/useReducedMotion'

/* ===========================================================================
   THE PRE-TEST (2026-10-24 Woof School Modernization)

   5 items, concept-scoped. PERFECTION (5/5) earns the pup into the player's roster.
   Unlimited free retries.
   =========================================================================== */

export function PreTest() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack()
  const reduced = useReducedMotion()

  const recordPreTest = useGameStore((s) => s.recordPreTest)
  const skill = SKILL_BY_ID[id]

  const items = useMemo(
    () => getPreTest(skill?.name ?? '').map((q) => shuffleQuestionOptions(q)),
    [skill],
  )

  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  // Ref guarantees immediate, non-stale score tracking across timer closures:
  const correctRef = useRef(0)

  const [done, setDone] = useState(false)
  const [earned, setEarned] = useState(false)
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
  const glow = accentGlowVar(skill.pup.accent)

  const finish = () => {
    const finalScore = correctRef.current
    const hadIt =
      useGameStore.getState().skills.some((k) => k.id === skill.id && k.pupEarned) === true
    const newly = recordPreTest(skill.id, finalScore, total)
    setWasEarned(hadIt)
    setEarned(newly)
    setDone(true)
    if (newly) play('celebrate')
    else if (finalScore >= total) play('unlock')
    else play('tap')
  }

  const advance = () => {
    if (index + 1 >= items.length) {
      finish()
    } else {
      setIndex((i) => i + 1)
    }
  }

  const resetCheck = () => {
    correctRef.current = 0
    setCorrect(0)
    setIndex(0)
    setDone(false)
    setEarned(false)
    play('tap')
  }

  // --- RESULT VIEW ---
  if (done) {
    const finalScore = correctRef.current
    const isPerfect = finalScore >= total
    const isClose = finalScore === total - 1
    const passed = isPerfect

    return (
      <ScreenFrame
        title="The check"
        onBack={() => navigate('/skills')}
        bar={
          <div className="flex w-full items-center gap-3">
            {!passed && (
              <button
                type="button"
                onClick={resetCheck}
                className="btn-chunky flex-1 border-2 border-indigo bg-cream py-4 text-[17px] font-bold text-indigo transition-transform active:scale-[0.98]"
              >
                Try check again
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(passed ? '/skills' : `/skill/${skill.id}`)}
              className="btn-chunky flex-1 bg-turquoise py-4 text-[18px] text-on-turquoise shadow-[0_10px_20px_-8px_rgb(0_210_196/0.5)] transition-transform active:scale-[0.98]"
            >
              {passed ? `Back to ${SPECIES_NAME} School` : 'Look at the lesson again'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          {/* CELEBRATION / RESULT CARD */}
          <div
            className={`school-card halo-center relative flex w-full max-w-md flex-col items-center rounded-[26px] p-6 text-cream shadow-xl ${
              isPerfect ? 'border-2 border-lime/40' : 'border border-white/15'
            }`}
            style={{ '--skill-accent': glow } as CSSProperties}
          >
            {/* PUP AVATAR */}
            <div className="relative z-10 -mt-2 mb-3">
              <PupAvatar
                pup={skill.pup}
                size={180}
                state={isPerfect ? 'happy' : 'idle'}
                plain
                className={`${reduced ? '' : isPerfect ? 'animate-bounce-happy' : 'animate-float'} drop-shadow-[0_8px_16px_rgba(8,12,52,0.6)]`}
              />
            </div>

            {/* SCORE CHIP */}
            <div className="relative z-10 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[13px] font-extrabold uppercase tracking-wider ${
                  isPerfect
                    ? 'bg-lime text-on-lime shadow-[0_0_15px_rgb(75_211_123/0.4)]'
                    : isClose
                      ? 'bg-yellow text-indigo'
                      : 'bg-white/15 text-cream'
                }`}
              >
                {isPerfect ? '★ 5 / 5 Perfect Score ★' : `Score: ${finalScore} / ${total}`}
              </span>
            </div>

            {/* RESULT HEADING & EXPLANATION */}
            <div className="relative z-10 max-w-sm">
              {earned ? (
                <>
                  <h2 className="font-display text-[27px] font-bold leading-tight text-white">
                    {skill.pup.name} has joined your roster!
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
                    Congratulations! {skill.pup.name} helps with{' '}
                    <strong className="text-yellow">{skill.name}</strong> whenever you need hints in the Reading Arena and Quizzes.
                  </p>
                </>
              ) : wasEarned ? (
                <>
                  <h2 className="font-display text-[26px] font-bold leading-tight text-white">
                    Mastery maintained!
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
                    {skill.pup.name} is already on your roster. You mastered this check with all {total} questions correct!
                  </p>
                </>
              ) : isPerfect ? (
                <>
                  <h2 className="font-display text-[27px] font-bold leading-tight text-white">
                    {skill.pup.name} has joined your roster!
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
                    {skill.pup.name} helps with <strong className="text-yellow">{skill.name}</strong> whenever you need hints.
                  </p>
                </>
              ) : isClose ? (
                <>
                  <h2 className="font-display text-[25px] font-bold leading-tight text-yellow">
                    So close &mdash; {finalScore} / {total}!
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
                    You only missed one question! {skill.pup.name} joins your roster when you get all {total} right.
                    Tap &ldquo;Try check again&rdquo; to earn {skill.pup.name} right now.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-display text-[24px] font-bold leading-tight text-white">
                    Not yet &mdash; let&apos;s try that again.
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/85">
                    No problem at all. Look at the rule once more, then come back. You need all {total}{' '}
                    right to earn {skill.pup.name}.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* TEACHER REYES FEEDBACK (Dynamic Emotion: happy for 5/5 pass, support for retry) */}
          <div className="w-full max-w-md text-left">
            <TeacherNote emotion={isPerfect ? 'happy' : 'support'}>
              <p className="text-[14px] leading-snug text-indigo font-medium">
                {isPerfect
                  ? 'Well done! That skill pup is yours for good now.'
                  : isClose
                    ? 'Almost there! Take another quick run and you will nail all 5.'
                    : 'Take your time to understand the rule. Free unlimited retries!'}
              </p>
            </TeacherNote>
          </div>
        </div>
      </ScreenFrame>
    )
  }

  // --- CHECK IN PROGRESS VIEW ---
  return (
    <ScreenFrame
      title={`Check: ${skill.name}`}
      subtitle={`${correct} correct so far`}
      onBack={back}
      footer={
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 pb-3">
          {/* 5-SEGMENT PILL PROGRESS TRACKER */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-navy/70">
              Progress
            </span>
            <span className="text-[12px] font-extrabold text-indigo tabular-nums">
              Question {index + 1} of {items.length}
            </span>
          </div>
          <div className="flex w-full gap-1.5" role="progressbar" aria-valuenow={index} aria-valuemin={0} aria-valuemax={items.length} aria-label="Pre-test progress">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                  i < index
                    ? 'bg-lime'
                    : i === index
                      ? 'bg-turquoise ring-2 ring-turquoise/40 shadow-sm'
                      : 'bg-indigo/15'
                }`}
              />
            ))}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {question ? (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            total={items.length}
            onResolve={(ok) => {
              if (ok) {
                correctRef.current += 1
                setCorrect(correctRef.current)
              }
            }}
            onAdvance={advance}
          />
        ) : (
          <div className="card-cream p-4">
            <p className="text-indigo">
              There are no check items for this skill yet. The education group is still writing them.
            </p>
          </div>
        )}
      </div>
    </ScreenFrame>
  )
}