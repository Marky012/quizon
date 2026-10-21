import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SkillSymbol } from '@/components/SkillSymbol'
import { SyncBadge } from '@/components/SyncBadge'
import { SKILLS, TEACHER } from '@/content/manifest'
import { TIER_ORDER, WORLD, type TierId } from '@/content/world'
import { attemptsLeft, bestScore, isPassing } from '@/logic/scoring'
import { play } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   RESULTS.

   UNDER 70% IS STILL WARM. Never a red screen, never the word FAILED, never
   "defeated". Art bible 13.3 bans the harsh vocabulary outright and this is
   where it would otherwise all land. The score is shown honestly, the specific
   skills to review are listed with links, and a retry is offered.

   THE ONLY PLACE THE OPPONENTS USED TO APPEAR. Their slot is now a plain
   statement of what the learner needs, because there is nothing to have beaten.

   TEACHER REYES APPEARS HERE, AND ONLY AFTER THREE FAILED ATTEMPTS. She is
   never a scoreboard and never a punishment: she offers to go over the weakest
   skill together. She never appears mid-quiz.
   =========================================================================== */

/**
 * Teacher Reyes' portrait, with a graceful stand-in while the art does not
 * exist.
 *
 * The file is not in the repo yet, and a bare <img> pointed at a missing asset
 * renders the browser's broken-image glyph - which on this screen appears at the
 * exact moment a learner has failed three times and is being told it is fine.
 * That is the worst possible place for a broken-image icon.
 *
 * The fallback is her initials on the same cream card, which keeps the layout
 * from collapsing and reads as intentional rather than as failure. When the art
 * lands this swaps itself out with no other change.
 */
function TeacherPortrait() {
  const [failed, setFailed] = useState(false)
  const initials = TEACHER.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-[24px] bg-cream font-display text-[32px] text-indigo shadow-[inset_0_-8px_0_0_rgb(26_43_76/0.1)]"
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src="/assets/teacher/teacher-reyes-happy.svg"
      alt=""
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-[96px] w-[96px] shrink-0 object-contain"
    />
  )
}

export function Result() {
  const { level = '' } = useParams()
  const navigate = useNavigate()
  const tierId = TIER_ORDER.includes(level as TierId) ? (level as TierId) : null
  const tier = tierId ? WORLD.tiers[tierId] : null

  const state = useGameStore((s) => (tierId ? s.tiers[tierId] : undefined))
  const missed = useGameStore((s) => s.skillMissedCount)

  /* The celebration fires here and ONLY here.
     Quiz used to play it too as it navigated here, so passing a level played the
     sound twice, half a second apart, which reads as a glitch rather than a
     reward. Whoever navigates to this screen owns the sound.

     Firing exactly once needs a ref, not just the dependency array: `state` is
     a fresh object every time the tier is written, so [state] alone can replay
     the sound on any later store change. */
  const celebrated = useRef(false)
  useEffect(() => {
    if (celebrated.current) return
    if (state && state.attempts.length > 0) {
      celebrated.current = true
      play('celebrate')
    }
  }, [state])

  if (!tierId || !tier || !state) {
    return (
      <ScreenFrame title="Results">
        <p className="card-cream p-4 text-indigo">There is no result for that level yet.</p>
      </ScreenFrame>
    )
  }

  const last = state.attempts[state.attempts.length - 1]
  const score = last?.score ?? 0
  const passed = isPassing(score)
  const left = attemptsLeft(state.attempts)
  const best = bestScore(state.attempts)

  const weak = SKILLS.filter((s) => (missed[s.name] ?? 0) > 0).sort(
    (a, b) => (missed[b.name] ?? 0) - (missed[a.name] ?? 0),
  )

  const nextTier = TIER_ORDER[TIER_ORDER.indexOf(tierId) + 1]
  const nextUnlocked = passed && nextTier !== undefined

  return (
    <ScreenFrame
      title={`${tier.name} results`}
      subtitle={tier.tagalog}
      wide
      bar={
        <div className="flex w-full gap-3">
          {/* When a level unlocks, going there is what the learner wants to do
              next, so it takes the primary slot. "Back to Reading Trail" stays
              available but stops competing for the same emphasis. Previously the
              screen said "Medium is now unlocked" and then offered nothing but
              the way back - the news and the action were on different screens. */}
          {nextUnlocked ? (
            <button
              type="button"
              onClick={() => navigate(`/quiz/${nextTier}`)}
              className="btn-chunky flex-1 bg-lime py-4 text-indigo"
            >
              Start {WORLD.tiers[nextTier].name}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/arena')}
              className="btn-chunky flex-1 bg-turquoise py-4 text-on-turquoise"
            >
              Back to Reading Trail
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Indigo hero band. */}
        <section className="rounded-[24px] bg-indigo p-5 text-center text-cream shadow-[0_20px_34px_-20px_rgb(26_35_126/0.7)]">
          <p className="font-display text-[44px] leading-12 tabular-nums">
            {Math.round(score / 5) * 5}
            <span className="text-[24px]">%</span>
          </p>
          <p className="text-cream/90">
            {passed
              ? `Passed. You needed 70% and you got ${Math.round(score)}%.`
              : left > 0
                ? `You needed 70%. You have ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
                : 'You needed 70%. Let us look at this together.'}
          </p>
        </section>

        {passed && nextUnlocked && (
          <p className="card-cream bg-lime-soft p-3 text-center text-[19px] leading-6 text-indigo">
            {WORLD.tiers[nextTier].name} is now unlocked.
          </p>
        )}

        {/* Teacher Reyes, after three spent attempts. Not a scoreboard. */}
        {!passed && left === 0 && (
          <section className="card-cream bg-turquoise-soft flex items-center gap-3 p-4">
            <TeacherPortrait />
            <div>
              <p className="font-display text-[20px] leading-6 text-indigo">{TEACHER.name}</p>
              <p className="leading-6 text-indigo">
                Not yet, and that is fine. Let&apos;s go over{' '}
                {weak[0]?.name ?? 'the passage'} together.
              </p>
            </div>
          </section>
        )}

        {/* What to review. Specific, linked, never a generic rule.

            The heading used to read "What you got right" over a list of the
            learner's WEAKEST skills. It is the one piece of copy in the app that
            actively contradicted its own contents, and it sat on the screen a
            struggling learner is most likely to be looking at hard. */}
        {weak.length > 0 && (
          <section className="card-cream p-4">
            <h2 className="mb-2 text-[20px] text-indigo">What to practise next</h2>
            <ul className="flex flex-col gap-2">
              {weak.slice(0, 5).map((skill) => {
                const count = missed[skill.name] ?? 0
                return (
                  <li key={skill.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/skill/${skill.id}`)}
                      className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left transition-colors hover:bg-indigo-soft/60"
                    >
                      <SkillSymbol id={skill.symbol} size={20} />
                      <span className="flex-1 font-bold text-indigo">{skill.name}</span>
                      <span className="text-sm text-navy/80">
                        {count} {count === 1 ? 'item' : 'items'} to review
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {state.hintSkillId &&
          (() => {
            const helper = SKILLS.find((s) => s.id === state.hintSkillId)?.pup
            if (!helper) return null
            return (
              <div className="card-cream flex items-center gap-3 p-3">
                <PupAvatar pup={helper} size={56} state="happy" />
                <p className="text-[15px] text-indigo">
                  <span className="font-bold">{helper.name}</span> helped you on this attempt.
                </p>
              </div>
            )
          })()}

        <p className="text-center text-sm text-navy/80">
          Best so far: {best}%. Attempts used: {state.attempts.length} of 3.
        </p>

        {/* The record now travels by itself. The learner does not save a file
            and hand it over; the device sends it to the teacher's dashboard
            when it can. Printing stays, because a paper copy still goes into
            the pupil's DepEd portfolio. */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-chunky flex-1 bg-white py-4 text-indigo"
            style={{ backgroundColor: 'var(--color-cream)' }}
          >
            Print my report
          </button>
        </div>
        <SyncBadge className="justify-center text-center" />
      </div>
    </ScreenFrame>
  )
}