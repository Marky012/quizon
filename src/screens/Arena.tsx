import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SettingsButton } from '@/components/SettingsButton'
import { SKILLS } from '@/content/manifest'
import { TIER_ORDER, WORLD, type TierId } from '@/content/world'
import { MAX_ATTEMPTS, PASSING_SCORE, TIERS } from '@/constants/gameConfig'
import { play, buzz } from '@/lib/audio'
import { prefetchForPath } from '@/lazyRoutes'
import {
  useGameStore,
  selectAvailableTiers,
  selectContinueAttempt,
} from '@/store/gameStore'

/* ===========================================================================
   READING TRAIL - three level cards.

   NO OPPONENT PORTRAIT. The old design put the antagonist's face on the right
   of every card, which quietly implied you were going to fight it. There is no
   fight and there are no opponents.

   THE CARDS NOW SPEAK THE HUB'S DEPTH LANGUAGE (art bible 7.1). They used to be
   flat cream rows with a narrow cover strip on the left; the strip pointed at
   backdrop SVGs that were never drawn, so the only thing it ever rendered was
   the indigo placeholder behind it. A learner judged the whole level from a bar
   of empty colour. The redesign drops the missing-file cover rule entirely and
   gives each level a full indigo surface built from the same stack the Hub stage
   cards use, so the two "places you go" screens read as one product:

      - a LEVEL MEDALLION in the raised turquoise plate carrying that level's
        place icon (art bible 8.9 - Garden, Canteen, Throne), so the three cards
        read as PLACES and not as three numbers. The number is not gone: it is
        in the card's accessible name, and it is what the plate falls back to if
        the icon file ever fails to load, so a missing asset degrades to the old
        design instead of an empty tile;
     - the English name in Baloo 2 with the Tagalog beneath it and the level
       blurb, matching the manifest copy that was already written but unused;
     - a BEST-SCORE progress bar. It turns "Best 85%" from a number a child has
       to hold in their head into a bar they can watch fill, and mirrors the Hub
       card so the same grammar means the same thing on both screens;
     - the helper pup linked to that level's skills, as before.

   A LOCKED LEVEL IS A DIFFERENT SURFACE, not the same card at 60% opacity: the
   desaturated plate, a padlock, and the requirement spelled out in words, so a
   locked tap is never a dead end (art bible 7.1).

   THE HEADER GEAR, NOT A SOUND TOGGLE. The sound switch lived here and was the
   only way to reach it from this screen, but sound is one setting among several
   and a two-state button gave it the prominence of a primary action. The header
   now carries the same settings gear the Hub does, so silence is one hop away
   and the control lives where a learner already learned to look.
   =========================================================================== */

export function Arena() {
  const navigate = useNavigate()
  const back = useBack()
  /* useShallow is REQUIRED here, not stylistic. selectAvailableTiers builds a
   fresh Set on every call, and zustand v5 compares snapshots with Object.is,
   so a plain selector would see a new reference on every store read and
   re-render forever. useShallow compares the members instead. */
  const available = useGameStore(useShallow((s) => Array.from(selectAvailableTiers(s))))
  const tiers = useGameStore((s) => s.tiers)

  /* An attempt the learner left part-finished. Surfacing it here is the visible
     half of persistence: without a Continue, saving the attempt is invisible
     work and the learner reasonably assumes their answers were lost. */
  const resume = useGameStore((s) => selectContinueAttempt(s))
  const clearAttempt = useGameStore((s) => s.clearAttempt)
  /* True when the saved attempt has no attempt left to spend. Offering Continue
     here would let a learner answer all twenty questions and only then be told
     the result does not count. */
  const stalled = useGameStore((s) => {
    const a = selectContinueAttempt(s)
    if (!a) return false
    return (s.tiers[a.tierId]?.attempts.length ?? 0) >= 3
  })

  const resumeTier = resume ? WORLD.tiers[resume.tierId] : null
  const resumeTotal = resume ? resume.questionIds.length : 0
  const resumeDone = resume ? resume.index : 0
  const resumeLeft = resume ? resumeTotal - resume.index : 0
  /* Progress is the share of the attempt already answered, so the bar reads
     "how far in" the same way the level cards' best-score bar reads "how well".
     resumeDone is the COUNT answered; item 5 of 20 means four are behind you. */
  const resumePct = resumeTotal > 0 ? Math.round((resumeDone / resumeTotal) * 100) : 0

  return (
    <ScreenFrame
      title={WORLD.stages.arena.name}
      subtitle="Three places to visit"
      onBack={back}
      headerRight={<SettingsButton className="h-14 w-14" />}
    >
      {resume && resumeTier && (
        <section
          aria-labelledby="resume-heading"
          className="card-cream mb-4 overflow-hidden bg-turquoise-soft p-4 shadow-[0_3px_0_0_rgb(0_163_150/0.35),0_18px_32px_-22px_rgb(26_35_126/0.55)]"
        >
          {/* Head: a bookmark plate says "saved" before a word is read, and the
              two lines split the reassurance from the instruction so neither has
              to do both jobs. The old card dropped a bare "item 5 of 20" into
              one flat paragraph and left the child to work out whether that was
              good or bad. */}
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-turquoise text-on-turquoise shadow-[inset_0_2px_0_0_rgb(255_255_255/0.45)]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M7 4h10v16l-5-3.5L7 20z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="resume-heading" className="font-display text-[20px] leading-6 text-indigo">
                You stopped halfway
              </h2>
              <p className="mt-0.5 text-[14px] leading-5 text-navy/75">
                Your answers are saved. Pick up right where you left off.
              </p>
            </div>
          </div>

          {/* Where you are, on its own cream panel. The level name, the distance
              left, and a bar that fills as the attempt advances: the same
              picture the level cards above use, so "a bar means progress" is one
              idea in this screen, not two. */}
          <div className="mt-3 rounded-[18px] bg-cream p-3 shadow-[0_1px_0_0_rgb(26_43_76/0.06)]">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-display text-[18px] leading-6 text-indigo">
                {resumeTier.name}
              </p>
              <span className="shrink-0 rounded-pill bg-yellow-soft px-2.5 py-1 text-[12px] font-bold text-indigo">
                {resumeLeft} to go
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-2.5 flex-1 overflow-hidden rounded-pill bg-indigo-soft"
              >
                <span
                  className="block h-full rounded-pill bg-turquoise transition-[width] duration-500 ease-out"
                  style={{ width: `${resumePct}%` }}
                />
              </span>
              <span className="shrink-0 text-[13px] font-bold tabular-nums text-indigo">
                Item {resumeDone + 1}/{resumeTotal}
              </span>
            </div>
          </div>

          {stalled ? (
            /* Better to say this plainly than to offer a button that cannot
               deliver. The coral tint marks this as the one state on the screen
               that needs attention, the same meaning coral carries everywhere
               else. The saved answers are dropped so the tier starts clean. */
            <div className="mt-3 rounded-[16px] bg-coral-soft p-3">
              <p className="leading-6 text-navy/85">
                You have already used all three attempts here, so this one cannot be finished.
                Start it again when you are ready.
              </p>
              <button
                type="button"
                onClick={() => {
                  play('tap')
                  clearAttempt(resume.tierId)
                }}
                className="btn-chunky mt-3 w-full bg-navy py-3 text-cream"
              >
                Clear it
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  play('tap')
                  navigate(`/quiz/${resume.tierId}`)
                }}
                className="btn-chunky flex items-center justify-center gap-2 bg-turquoise py-3.5 text-[17px] text-on-turquoise"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="h-5 w-5">
                  <path d="M8 5.14v14l11-7z" />
                </svg>
                Continue
              </button>
              {/* A real secondary button, not an underline, so the two choices
                  read as two buttons of different weight rather than a button
                  and a link the child may not recognise as tappable. */}
              <button
                type="button"
                onClick={() => {
                  play('tap')
                  clearAttempt(resume.tierId)
                }}
                className="btn-chunky bg-cream py-3 text-[15px] text-indigo"
              >
                Start this level over
              </button>
            </div>
          )}
        </section>
      )}

      <ul className="flex flex-col gap-3.5">
        {TIER_ORDER.map((id: TierId, index) => {
          const tier = WORLD.tiers[id]
          const state = tiers[id]
          const rule = TIERS.find((t) => t.id === id)
          const open = available.includes(id)
          const best = state?.bestScore ?? 0
          const attempts = state?.attempts.length ?? 0
          const left = MAX_ATTEMPTS - attempts
          const passed = best >= PASSING_SCORE
          const bestPct = Math.min(Math.max(best, 0), 100)

          const helper = SKILLS[TIER_ORDER.indexOf(id) % SKILLS.length]!.pup

          const requirement = `Earn all ${rule?.requiresPups ?? 8} pups${rule?.requiresTiersPassed
              ? ` and pass ${rule.requiresTiersPassed} level${rule.requiresTiersPassed === 1 ? '' : 's'}`
              : ''
            } to open this place.`

          const status = attempts > 0 ? `Best ${best}%` : 'Not started'
          const statusLine = `${status} \u00b7 ${left} ${left === 1 ? 'attempt' : 'attempts'} left`

          /* The control has no plain text name once the progress bar and chips
             are moved out from under the screen reader's reading order, so the
             whole state is composed into one label. */
          const accessibleName = open
            ? `${tier.name}. ${tier.tagalog}. Level ${index + 1}. ${tier.itemCount} items, pass ${PASSING_SCORE} percent. ${status}, ${left} ${left === 1 ? 'attempt' : 'attempts'} left.${passed ? ' Passed.' : ''}`
            : `${tier.name}. Level ${index + 1}, locked. ${requirement}`

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  if (!open) {
                    play('locked')
                    buzz(40)
                    return
                  }
                  play('tap')
                  navigate(`/quiz/${id}`)
                }}
                aria-disabled={!open}
                aria-label={accessibleName}
                onPointerEnter={() => prefetchForPath(`/quiz/${id}`)}
                onFocus={() => prefetchForPath(`/quiz/${id}`)}
                className={`flex w-full flex-col gap-3 rounded-[28px] p-4 text-left transition-transform duration-200 ${open
                    ? 'stage-card hover:-translate-y-1 active:scale-[0.99]'
                    : 'stage-card-locked'
                  }`}
              >
                {/* Head row. Medallion carries the level's place icon, the
                    name and Tagalog hold the middle, and the helper pup
                    anchors the end. */}
                <span className="flex items-center gap-3">
                  <LevelMedallion id={id} level={index + 1} open={open} />

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span
                        className={`min-w-0 truncate font-display text-[21px] leading-6 ${open ? 'text-yellow' : 'text-navy'
                          }`}
                      >
                        {tier.name}
                      </span>
                      {open && passed && (
                        <span className="shrink-0 rounded-pill bg-yellow px-2 py-0.5 text-[11px] font-extrabold text-indigo">
                          ★ {best}%
                        </span>
                      )}
                    </span>
                    <span
                      className={`truncate text-[13px] leading-5 ${open ? 'text-cream/75' : 'text-navy/60'
                        }`}
                    >
                      {tier.tagalog}
                    </span>
                  </span>

                  <span className="shrink-0">
                    <PupAvatar pup={helper} size={52} />
                  </span>
                </span>

                {open ? (
                  <>
                    <span className="text-[14px] leading-5 text-cream/90">{tier.blurb}</span>

                    {/* The bar is decorative - its numbers are already in the
                        button's aria-label - so it is hidden from assistive tech
                        rather than announced on top of them. */}
                    <span aria-hidden="true" className="block">
                      <span className="stage-progress block h-2.5 w-full overflow-hidden rounded-pill">
                        <span
                          className="stage-progress-fill block h-full rounded-pill transition-[width] duration-500 ease-out"
                          style={{ width: `${bestPct}%` }}
                        />
                      </span>
                    </span>

                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-pill bg-cream/15 px-2.5 py-1 text-[12px] font-bold text-cream/90">
                        {tier.itemCount} items
                      </span>
                      <span className="rounded-pill bg-cream/15 px-2.5 py-1 text-[12px] font-bold text-cream/90">
                        Pass {PASSING_SCORE}%
                      </span>
                      <span className="ml-auto text-[12px] font-bold text-cream/85">
                        {statusLine}
                      </span>
                    </span>
                  </>
                ) : (
                  /* Requirement row. The padlock is drawn, not the 🔒 character,
                     for the same optical-centring reason as the header gear. */
                  <span className="flex items-center gap-2 rounded-[16px] bg-navy/10 px-3 py-2">
                    <LockGlyph />
                    <span className="text-[14px] leading-5 text-navy/80">{requirement}</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </ScreenFrame>
  )
}

/* THE LEVEL MEDALLION. Art bible 8.9: one flavour icon per level (Garden of
   Words, Canteen of Riddles, Throne of Answers) so the three cards read as
   PLACES rather than three numbers. The 56px plate is the frame - the icon
   sits inside it with a 6px inset, transparent background and no sky or floor
   of its own.

   The locked card keeps the icon but desaturates it, matching the greyed
   surface the rest of the locked card uses; the padlock and the requirement
   written in words still carry the "not yet" meaning.

   LEVEL NUMBER AS FALLBACK, not as content. The number moved out of the plate
   and into the button's accessible name ("Level 2, locked"), but it is still
   drawn here when the file is missing or fails to load, exactly as it was
   before the art landed. A broken asset degrades to the old design instead of
   an empty turquoise tile. */
function LevelMedallion({
  id,
  level,
  open,
}: {
  id: TierId
  level: number
  open: boolean
}) {
  const [failed, setFailed] = useState(false)

  return (
    <span
      aria-hidden="true"
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${open ? 'stage-icon' : 'stage-icon-locked'
        }`}
    >
      {failed ? (
        <span className="flex flex-col items-center justify-center">
          <span className="text-[9px] leading-none font-bold tracking-wider text-indigo/70 uppercase">
            Level
          </span>
          <span className="font-display text-[24px] leading-7 text-indigo">
            {level}
          </span>
        </span>
      ) : (
        <img
          src={`/assets/levels/${id}.png`}
          alt=""
          width={44}
          height={44}
          decoding="async"
          onError={() => setFailed(true)}
          className={`h-11 w-11 object-contain ${open ? '' : 'grayscale opacity-70'}`}
        />
      )}
    </span>
  )
}

/* The padlock for a locked level. Drawn rather than typed so it sits dead in
   the requirement row at any size, matching the header gear and the Hub lock. */
function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="h-5 w-5 shrink-0"
    >
      <path
        d="M8 10 V7 a4 4 0 0 1 8 0 v3"
        fill="none"
        stroke="var(--color-navy)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="var(--color-navy)" />
      <circle cx="12" cy="14.5" r="1.6" fill="var(--color-cream)" />
      <path
        d="M12 15.5 V18"
        stroke="var(--color-cream)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}