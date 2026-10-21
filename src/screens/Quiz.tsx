import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { ScreenFrame, ProgressBar } from '@/components/ScreenFrame'
import { QuestionCard } from '@/components/QuestionCard'
import { Sheet } from '@/components/Sheet'
import { PupAvatar } from '@/components/PupAvatar'
import { QuizFallback } from '@/components/RouteFallback'
import { SKILLS, SKILL_BY_ID } from '@/content/manifest'
import { getTierPools, storyPoolIsThin } from '@/content/questions'
import { PASSAGE_BY_ID } from '@/content/texts'
import { TIER_ORDER, WORLD, type TierId } from '@/content/world'
import type { Question } from '@/content/schemas'
import { resumeAttempt, startAttempt } from '@/logic/attempt'
import { ANSWER_FEEDBACK_DELAY, PRETEST_QUESTION_COUNT } from '@/constants/gameConfig'
import { play, buzz } from '@/lib/audio'
import { useAppBack } from '@/lib/appBack'
import {
  useGameStore,
  selectHintUnlocked,
  selectHintLockReason,
  selectHintablePups,
} from '@/store/gameStore'

/* ===========================================================================
   THE QUIZ - the most-used screen in the product.

   FIVE THINGS ON THIS SCREEN ARE RULES, NOT STYLE:

   1. NO TIMER. ANYWHERE. Ever. A clock raises anxiety and, worse, corrupts the
      mastery data the education group needs: a score under time pressure
      measures reading speed, not reading.

   2. ONE STORY, SITTING IN FRONT OF THE LEARNER, IN FULL. The passage is never
      truncated and never behind a "more" link. The assigned story comes from
      ensureStory() once and is then reused on every retry, so attempt 2
      measures the same text as attempt 1 and the best score means something.

   3. THE HINT IS CHOSEN, NOT SERVED. One hint, and the learner picks which of
      their EARNED helpers to call, because working out which skill they are
      stuck on is part of the work. The picker lists only earned pups.

   4. THE HINT IS LOCKED UNTIL ONE ANSWER IS CORRECT. Until then the pill is
      still VISIBLE and states the requirement. A control that vanishes reads
      as a bug; an instructional one reads as a goal.

   5. LEAVING IS SAFE, SO THE SCREEN WARNS ABOUT NOTHING. This used to carry a
      confirm dialog. Once the attempt is persisted there is nothing left to
      lose, so a confirmation guards nothing - and a "leave this page?" modal in
      front of a nine-year-old mid-assessment is precisely the wrong thing to
      add. The Arena offers Continue instead. See ActiveAttempt in the store.

   ---------------------------------------------------------------------------
   WHY THE DISPLAYED INDEX IS LOCAL STATE AND NOT THE STORE'S INDEX.

   The persisted index and the question on screen are deliberately two different
   values, and conflating them produces a bug that is easy to write.

   An answer is recorded in one atomic store write (submitAttemptAnswer) that
   also advances the persisted index. That write has to happen at ANSWER time,
   so a crash during feedback cannot lose the answer. But the learner is still
   reading feedback for the question they just answered, and must keep reading
   it for ANSWER_FEEDBACK_DELAY. If the rendered index were read straight from
   the store, that write would swap the question instantly and the feedback -
   the entire reason for pausing - would never be seen.

   So: the store owns the truth for persistence, displayIndex owns what is on
   screen, and displayIndex re-syncs from the store whenever the attempt is
   built or resumed. The two agree at rest and deliberately disagree for one
   beat.
   =========================================================================== */

export function Quiz() {
  const { level = '' } = useParams()
  const navigate = useNavigate()
  const back = useAppBack('/arena')

  const tierId: TierId | null = TIER_ORDER.includes(level as TierId) ? (level as TierId) : null
  const tier = tierId ? WORLD.tiers[tierId] : null
  const itemCount = tier?.itemCount ?? 20

  const assigned = useGameStore((s) => (tierId ? (s.tiers[tierId]?.storyId ?? null) : null))
  const ensureStory = useGameStore((s) => s.ensureStory)
  const beginAttempt = useGameStore((s) => s.beginAttempt)
  const clearAttempt = useGameStore((s) => s.clearAttempt)
  const submitAttemptAnswer = useGameStore((s) => s.submitAttemptAnswer)

  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [repairNote, setRepairNote] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [lockNote, setLockNote] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const hintUnlocked = useGameStore((s) => (tierId ? selectHintUnlocked(s, tierId) : false))
  const lockReason = useGameStore((s) =>
    tierId ? selectHintLockReason(s, tierId) : 'That level does not exist.',
  )
  const hintSkillId = useGameStore((s) => (tierId ? (s.tiers[tierId]?.hintSkillId ?? null) : null))

  /**
   * useShallow is REQUIRED here, not stylistic. selectHintablePups builds a
   * fresh array on every call, and zustand v5 compares snapshots with
   * Object.is, so a plain selector would see a new reference on every store
   * read and re-render forever. useShallow compares the members instead, and
   * the members are the stable PUP objects from the manifest.
   */
  const hintable = useGameStore(useShallow((s) => (tierId ? selectHintablePups(s) : [])))

  const recordAnswer = useGameStore((s) => s.recordAnswer)
  const completeTier = useGameStore((s) => s.completeTier)
  const spendHint = useGameStore((s) => s.spendHint)
  const recordPupUse = useGameStore((s) => s.recordPupUse)

  /**
   * The running score, read live from the store. Unlike the index this is safe
   * to take straight from the store: it changes at answer time and the learner
   * SHOULD see it move, feedback or not. That is the point of a running score.
   */
  const attempt = useGameStore((s) => (tierId ? (s.activeAttempts[tierId] ?? null) : null))
  const correct = attempt?.correct ?? 0
  const missed = attempt?.missedSkills ?? []

  // Assign the ONE story for this level. Idempotent, so a retry keeps it.
  useEffect(() => {
    if (tierId && !assigned) ensureStory(tierId)
  }, [tierId, assigned, ensureStory])

  /**
   * Build or resume the attempt, ONCE per tier.
   *
   * The ref guard is load-bearing. beginAttempt writes to the store, which
   * re-renders this component, which would otherwise re-enter this effect and
   * start a second, competing attempt. The ref is deliberately absent from the
   * dependency array: it is a once-per-mount latch, not a reactive value, and
   * treating it as one is what produces the double-start bug.
   */
  const preparedFor = useRef<TierId | null>(null)
  useEffect(() => {
    if (!tierId || !assigned) return
    if (preparedFor.current === tierId) return
    preparedFor.current = tierId

    const tierPools = getTierPools(tierId)
    const existing = useGameStore.getState().activeAttempts[tierId]

    if (existing) {
      const resumed = resumeAttempt(tierPools, existing)
      if (resumed.ok) {
        setQuestions(resumed.questions)
        setDisplayIndex(resumed.index)
        return
      }
      // The bank changed under a saved attempt, so it cannot be reopened
      // faithfully. Say so and start clean, rather than silently shortening the
      // quiz and leaving the progress bar disagreeing with the questions.
      clearAttempt(tierId)
      setRepairNote(
        'Your last quiz could not be reopened, so we are starting it again. You have not lost any ' +
        'pups or stars.',
      )
    }

    // The history is read ONCE, here, at the moment the attempt is drawn.
    // Reading it during render or inside a memo would let an answer re-weight
    // the remaining items, so the quiz would reorder itself under the learner
    // mid-passage.
    const snapshot = useGameStore.getState().history
    const started = startAttempt({
      pools: tierPools,
      storyId: assigned,
      itemCount,
      history: snapshot,
    })
    beginAttempt(tierId, assigned, started.seed, started.questions.map((q) => q.id))
    setQuestions(started.questions)
    setDisplayIndex(0)
  }, [tierId, assigned, itemCount, beginAttempt, clearAttempt])

  const thin = tierId && assigned ? storyPoolIsThin(tierId, assigned) : false
  const question = questions ? questions[displayIndex] : undefined
  const passage = assigned ? PASSAGE_BY_ID[assigned] : undefined
  const hintSkill = hintSkillId ? SKILL_BY_ID[hintSkillId] : undefined
  const hintPup = hintSkill?.pup ?? null

  function finish() {
    if (!tierId || finished) return
    setFinished(true)
    // completeTier clears the persisted attempt, so there is nothing left to
    // resume and no way to double-count this result if finish is reached twice.
    completeTier(tierId, correct, questions?.length ?? 0, missed)
    navigate(`/result/${tierId}`)
  }

  function onResolve(ok: boolean) {
    if (!tierId || !question) return
    recordAnswer(tierId, question.id, question.skillTested, ok)
    // Persist the answer and advance in ONE write, so the saved index and the
    // saved score can never disagree after a crash. See the note at the top
    // about why this does not move the question on screen.
    submitAttemptAnswer(tierId, ok, question.skillTested)
  }

  function advance() {
    setLockNote(null)
    if (!questions) return
    if (displayIndex + 1 >= questions.length) finish()
    else setDisplayIndex(displayIndex + 1)
  }

  function tapHint() {
    if (hintUnlocked) {
      play('tap')
      setPickerOpen(true)
      return
    }
    // A locked hint says WHY. Art bible 7.3: never a dead tap.
    play('locked')
    buzz(30)
    setLockNote(lockReason)
  }

  function choose(skillId: string) {
    if (!tierId) return
    if (spendHint(tierId, skillId)) {
      recordPupUse(skillId)
      setPickerOpen(false)
      setHintOpen(true)
      play('unlock')
    }
  }

  if (!tierId || !tier) {
    return (
      <ScreenFrame title="Level">
        <p className="card-cream p-4 text-indigo">That level does not exist.</p>
      </ScreenFrame>
    )
  }

  // The story is assigned in an effect, so this branch is genuinely transient.
  // It used to be the bare words "Choosing your story...", which read as a
  // half-loaded page rather than a screen doing its job.
  if (!assigned) return <QuizFallback note="Choosing your story…" />

  if (!questions) return <QuizFallback note="Opening your quiz…" />

  return (
    <ScreenFrame
      title={tier.name}
      subtitle={`${correct} correct so far`}
      /* Back goes to the previous screen of this app, falling back to the
         Arena. It used to be a hardcoded navigate('/arena'), which PUSHED - so
         the stack went hub -> quiz -> arena and the Android back gesture from
         the Arena walked straight back into the quiz. See lib/appBack.ts. */
      onBack={back}
      headerRight={
        <span
          className={`shrink-0 rounded-pill px-3 py-1 text-[13px] font-extrabold ${hintUnlocked
              ? 'bg-turquoise text-on-turquoise'
              : hintSkillId
                ? 'bg-navy/20 text-navy line-through'
                : 'bg-indigo-soft text-indigo'
            }`}
        >
          {hintSkillId ? '1 hint used' : hintUnlocked ? '1 hint left' : 'Hint locked'}
        </span>
      }
      footer={
        <div className="mx-auto w-full max-w-2xl px-4 pb-1">
          <ProgressBar value={displayIndex} max={questions.length} label="Quiz progress" />
        </div>
      }
    >
      {/* Art bible 7.2: a keyboard learner must be able to skip the repeated
          story text. Hidden until focused, then pinned so that appearing does
          not reflow the passage underneath it. */}
      <a
        href="#answers"
        className="sr-only focus:not-sr-only focus:mb-3 focus:block focus:rounded-[12px] focus:bg-turquoise focus:px-4 focus:py-2 focus:text-on-turquoise"
      >
        Skip to the answers
      </a>

      <div className="flex flex-col gap-4">
        <section className="card-cream p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[20px] leading-6 text-indigo">
              {passage?.title ?? 'Story'}
            </h2>
            <span className="shrink-0 text-sm text-navy/80">
              Story {assigned.replace('T', '')} of 6
            </span>
          </div>
          {/* The passage, IN FULL. Never truncated, never behind a "more". */}
          <div className="passage text-indigo">
            {passage ? passage.sentences.join(' ') : 'This story is missing.'}
          </div>
        </section>

        {repairNote && (
          <p
            role="status"
            className="card-cream bg-yellow-soft p-3 text-[15px] leading-6 text-indigo"
          >
            {repairNote}
          </p>
        )}

        {thin && (
          <p className="card-cream bg-yellow-soft p-3 text-[15px] leading-6 text-indigo">
            This story still has fewer questions than the level needs, so this quiz is shorter
            than {itemCount} items. The education group is still writing them.
          </p>
        )}

        {lockNote && (
          <p
            role="status"
            className="card-cream bg-turquoise-soft animate-slide-up p-3 text-[15px] leading-6 text-indigo"
          >
            {lockNote}
          </p>
        )}

        {question ? (
          <div id="answers">
            <QuestionCard
              key={question.id}
              question={question}
              index={displayIndex}
              total={questions.length}
              feedbackMs={ANSWER_FEEDBACK_DELAY}
              onResolve={onResolve}
              onAdvance={advance}
            />
          </div>
        ) : (
          <p className="card-cream p-4 text-indigo">
            No questions for this story yet. The education group is still writing them.
          </p>
        )}

        {/* The helper button. Never disabled: it explains itself when locked. */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={tapHint}
            className={`flex h-16 items-center gap-2 rounded-full px-5 font-bold shadow-[0_4px_0_0_rgb(26_43_76/0.18)] ${hintUnlocked
                ? 'animate-pulse-badge bg-turquoise text-on-turquoise'
                : hintSkillId
                  ? 'bg-indigo-soft text-indigo'
                  : 'bg-yellow-soft text-indigo'
              }`}
          >
            <span aria-hidden="true" className="text-[20px] leading-none">
              {hintSkillId ? '✓' : '💡'}
            </span>
            <span>{hintUnlocked ? 'Call a helper' : hintSkillId ? 'Helper called' : 'Hint'}</span>
          </button>
        </div>

        {/* NO TIMER. Not hidden lower down, not behind the debug panel. Absent. */}
      </div>

      <Sheet
        open={hintOpen && hintPup !== null}
        onClose={() => setHintOpen(false)}
        title={`Help from ${hintPup?.name ?? ''}`}
      >
        {hintPup && hintSkill && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <PupAvatar pup={hintPup} state="hint" size={120} />
              <div>
                <p className="text-sm text-navy/80">{hintSkill.name}</p>
                <p className="font-display text-[22px] leading-7 text-indigo">{hintPup.name}</p>
              </div>
            </div>
            <p className="card-cream bg-yellow-soft p-3 leading-7 text-indigo">{hintSkill.hint}</p>
            <p className="text-[15px] text-navy/80">
              That is the rule, not the answer. Try the item again.
            </p>
            <button
              type="button"
              onClick={() => setHintOpen(false)}
              className="btn-chunky bg-turquoise py-3 text-on-turquoise"
            >
              Got it
            </button>
          </div>
        )}
      </Sheet>

      {/* The picker. ONE hint, EIGHT possible helpers, only earned ones listed. */}
      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Which helper do you need?">
        <ul className="grid grid-cols-4 gap-2">
          {hintable.map((pup) => {
            const skill = SKILLS.find((s) => s.pup.id === pup.id)
            return (
              <li key={pup.id}>
                <button
                  type="button"
                  onClick={() => choose(skill?.id ?? '')}
                  className="flex w-full flex-col items-center gap-1 rounded-[16px] bg-cream p-2 shadow-[0_3px_0_0_rgb(26_43_76/0.12)]"
                >
                  <PupAvatar pup={pup} state="hint" size={64} />
                  <span className="text-[13px] leading-4 font-bold text-indigo">{pup.name}</span>
                  <span className="text-[11px] leading-4 text-navy/80">{skill?.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {hintable.length === 0 && (
          <p className="text-indigo">
            You have not earned a helper yet. Get all {PRETEST_QUESTION_COUNT} right on a skill
            check.
          </p>
        )}
      </Sheet>
    </ScreenFrame>
  )
}