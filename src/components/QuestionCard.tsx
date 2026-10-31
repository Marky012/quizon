import { useCallback, useEffect, useRef, useState } from 'react'
import type { Question } from '@/content/schemas'
import { OptionButton, type OptionState } from './OptionButton'
import { play, buzz } from '@/lib/audio'
import { TeacherNote, CheckGlyph, BulbGlyph } from './LessonParts'

/* ===========================================================================
   ONE QUESTION, PRESENTED AND MARKED.

   SHARED BY THE PRE-TEST AND THE LEVEL QUIZ because the two differ only in
   where the items come from and how many there are, not in how a child is
   shown an answer. Duplicating this markup for the pre-test was how the two
   drifted apart before.

   THE VERDICT IS ALWAYS SHOWN BEFORE MOVING ON (art bible panel 10: 2 seconds,
   then auto-advance). A learner who is tapped past a wrong answer never learns
   why it was wrong, and the errorTag is the entire pedagogical payload of a
   distractor.

   MULTI-SELECT: tapping toggles and the verdict waits for SUBMIT, so a child is
   not marked wrong for an incomplete first tap on "tap the key details".

   ---------------------------------------------------------------------------
   THE TIMER IS OWNED AND CANCELLED. This is a correctness fix, not tidiness.

   The feedback pause used to be a bare window.setTimeout(onAdvance, feedbackMs)
   with no reference kept. Two real failures came out of that:

     - Leave during feedback and the timer still fires, calling onAdvance on an
       unmounted tree.
     - Worse: on question 19 of 20 the timer would fire AFTER the learner had
       already navigated to the Arena, and onAdvance calls finish(), which
       writes an attempt to the store and pushes /result. A learner who
       abandoned a quiz could come back to find it marked complete.

   The handle is therefore kept in a ref and cleared on unmount. Every path that
   leaves this component early must clear it, which is why the single timer is
   also cleared whenever a new answer is resolved.

   ---------------------------------------------------------------------------
   WHY A WRONG ANSWER IS role="alert" AND A RIGHT ONE IS role="status".

   role="status" is polite: it waits for a pause. role="alert" is assertive: it
   interrupts. A learner who has just answered wrongly needs to hear that
   immediately, because the errorTag is the teaching moment and they will start
   the next question without it if they are not interrupted. Hearing "Correct"
   can wait until they have finished reading the explanation.
   =========================================================================== */

const LETTERS = ['A', 'B', 'C', 'D']

export type Verdict = { correct: boolean; selected: number[] } | null

export function QuestionCard({
  question,
  index,
  total,
  onResolve,
  /** Called after the feedback pause. The parent decides what happens next. */
  onAdvance,
  feedbackMs = 2000,
  disabled = false,
}: {
  question: Question
  index: number
  total: number
  onResolve: (correct: boolean, selected: number[]) => void
  onAdvance: () => void
  feedbackMs?: number
  disabled?: boolean
}) {
  const multi = Array.isArray(question.correctIndices)
  const [selected, setSelected] = useState<number[]>([])
  const [verdict, setVerdict] = useState<Verdict>(null)
  /** Which option currently holds Tab focus. Roving, so the set is one stop. */
  const [focusIndex, setFocusIndex] = useState(0)
  const groupRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const answered = verdict !== null
  const correctSet = new Set(
    multi ? (question.correctIndices ?? []) : [question.correctIndex ?? 0],
  )

  /** Clears the pending auto-advance. Safe to call when nothing is pending. */
  const clearAdvance = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onAdvanceRef = useRef(onAdvance)
  useEffect(() => {
    onAdvanceRef.current = onAdvance
  }, [onAdvance])

  // The unmount cleanup. Without it the stale-advance bug above is live.
  useEffect(() => clearAdvance, [clearAdvance])

  const userPicks = verdict ? verdict.selected : selected

  function stateFor(i: number): OptionState {
    if (!answered) return 'idle'
    const isSelected = userPicks.includes(i)
    const isCorrect = correctSet.has(i)
    if (isCorrect) return 'correct'
    if (isSelected) return 'incorrect'
    return 'idle'
  }

  function tap(i: number) {
    if (answered || disabled) return
    play('select')
    if (multi) {
      setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
      setFocusIndex(i)
    } else {
      setSelected([i])
      setFocusIndex(i)
      resolve([i])
    }
  }

  function resolve(picks: number[]) {
    setSelected(picks)
    const correct = picks.length === correctSet.size && picks.every((i) => correctSet.has(i))
    setVerdict({ correct, selected: picks })
    if (correct) {
      play('correct')
    } else {
      play('incorrect')
      buzz(30)
    }
    onResolve(correct, picks)
    // Clear any earlier pending advance first, so a double-tap in multi mode
    // cannot leave two timers racing to advance.
    clearAdvance()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      onAdvanceRef.current()
    }, feedbackMs)
  }

  /**
   * Keyboard control for the option set.
   *
   * Arrow keys move focus (the standard radio-group interaction) and the number
   * keys and letter keys ANSWER directly. The letter shortcuts matter more than
   * they look: the letters are already printed on every option because children
   * read letters faster than they scan, so "B" is a natural thing to press - it
   * should work.
   */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (answered || disabled) return
    const count = question.options.length

    const focusOption = (next: number) => {
      const wrapped = ((next % count) + count) % count
      setFocusIndex(wrapped)
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('button[data-option]')
      buttons?.[wrapped]?.focus()
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        focusOption(focusIndex + 1)
        return
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        focusOption(focusIndex - 1)
        return
      case 'Home':
        e.preventDefault()
        focusOption(0)
        return
      case 'End':
        e.preventDefault()
        focusOption(count - 1)
        return
      default:
        break
    }

    const digit = Number(e.key)
    if (Number.isInteger(digit) && digit >= 1 && digit <= count) {
      e.preventDefault()
      tap(digit - 1)
      return
    }

    const letterIndex = LETTERS.indexOf(e.key.toUpperCase())
    if (letterIndex >= 0 && letterIndex < count) {
      e.preventDefault()
      tap(letterIndex)
    }
  }

  const selectedWrong = verdict ? (verdict.selected.find((i) => !correctSet.has(i)) ?? null) : null
  const chosenOption = selectedWrong === null ? null : question.options[selectedWrong]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-pill bg-indigo px-3 py-1 text-[12px] font-extrabold tracking-wide text-cream shadow-sm">
          Item {index + 1} of {total}
        </span>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: Math.min(total, 12) }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < index ? 'bg-lime' : i === index ? 'bg-turquoise ring-2 ring-turquoise/30' : 'bg-indigo/15'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="card-cream relative overflow-hidden px-4 py-4 pl-5 ring-1 ring-indigo/10">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-turquoise to-violet" />
        <p id="prompt-text" className="text-[20px] leading-7 font-bold text-indigo">
          {question.prompt}
        </p>
      </div>

      <div
        ref={groupRef}
        className="flex flex-col gap-2"
        /* A radio group for single-select, a plain group for multi-select,
           because checkboxes in a group would imply the wrong interaction. */
        role={multi ? 'group' : 'radiogroup'}
        aria-labelledby="prompt-text"
        onKeyDown={onKeyDown}
      >
        {question.options.map((option, i) => (
          <OptionButton
            key={i}
            option={option}
            index={i}
            letter={LETTERS[i] ?? '?'}
            state={stateFor(i)}
            selected={userPicks.includes(i)}
            multi={multi}
            disabled={answered || disabled}
            tabIndex={i === focusIndex ? 0 : -1}
            onSelect={() => tap(i)}
          />
        ))}
      </div>

      {multi && !answered && (
        <button
          type="button"
          className="btn-chunky bg-turquoise px-6 py-3 text-on-turquoise"
          disabled={selected.length === 0}
          onClick={() => resolve(selected)}
        >
          Check my answer
        </button>
      )}

      {/* The feedback panel. The specific reason is what makes a distractor
          useful, so the errorTag is always shown when one exists. */}
      {verdict && (
        <div
          className="animate-feedback-spring"
          /* Assertive only when wrong. See the note at the top of the file. */
          role={verdict.correct ? 'status' : 'alert'}
        >
          <TeacherNote
            emotion={verdict.correct ? 'happy' : 'support'}
            tone={verdict.correct ? 'lime' : 'yellow'}
            size={96}
          >
            {verdict.correct ? (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime text-indigo shadow-sm animate-badge-pop"
                  >
                    <CheckGlyph className="h-4 w-4" />
                  </span>
                  <p className="font-display text-[19px] font-bold leading-6 text-indigo">
                    Correct! That is the right answer.
                  </p>
                </div>
                <p className="leading-6 font-medium text-indigo/90">{question.explanation}</p>
              </div>
            ) : (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow text-indigo shadow-sm animate-badge-wobble"
                  >
                    <BulbGlyph className="h-4 w-4" />
                  </span>
                  <p className="font-display text-[19px] font-bold leading-6 text-indigo">
                    Not quite. Let&apos;s look again.
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {chosenOption?.errorTag && (
                    <p className="leading-6 text-indigo/90">
                      <span className="font-bold text-navy">Why not: </span>
                      {chosenOption.errorTag}
                    </p>
                  )}
                  <p className="leading-6 text-indigo/90">
                    <span className="font-bold text-navy">The rule: </span>
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </TeacherNote>
        </div>
      )}    </div>
  )
}