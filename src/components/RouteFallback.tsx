import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { ScreenFrame, ProgressBar, useBack } from './ScreenFrame'
import { Skeleton, SkeletonLines, SkeletonOptions, LoadingNote } from './Skeleton'
import { SKILLS, SKILL_BY_ID } from '@/content/manifest'
import { SPECIES_NAME } from '@/content/schemas'
import { TIER_ORDER, WORLD, type TierId } from '@/content/world'
import { MAX_ATTEMPTS, PASSING_SCORE, TIERS } from '@/constants/gameConfig'
import { attemptsLeft, isPassing } from '@/logic/scoring'
import { accentSoftVar } from '@/lib/accents'
import { useAppBack } from '@/lib/appBack'
import { useReducedMotion } from '@/lib/useReducedMotion'
import {
  useGameStore,
  selectAvailableTiers,
  selectContinueAttempt,
} from '@/store/gameStore'

/* ===========================================================================
   ROUTE FALLBACKS - what a learner sees while a screen's chunk is fetched.

   This is the single most important loading surface in the app, because code
   splitting means EVERY navigation after the first one goes through it. Get it
   wrong and the app feels broken in a way a slow network alone would not cause.

   ONE FALLBACK PER SCREEN, and each one is a drawing of the screen it stands
   in for - not a generic spinner, and not one shared layout reused with a
   different title. Until 2026-10-07 every route showed the SAME quiz-shaped
   skeleton (passage card + four answer rows) whatever the destination, so a
   trip to Settings looked like a trip to a quiz for as long as the fetch took,
   and then the whole page changed shape underneath the learner.

   FIVE THINGS EVERY FALLBACK BELOW MIRRORS:

     1. THE HEADER, exactly: the same title, the same one-line subtitle slot,
        the same back button (a real one, so back still works mid-load), the
        same right-hand control at the same size, the same footer progress bar
        and the same bottom action bar. Nothing in the chrome moves when the
        real screen lands.
     2. THE CONTENT SHAPE: the grid the destination uses (2 columns for Woof
        School, a 380px carousel card for the Hub, stacked level cards for the
        Arena), on the same surfaces - .card-cream for cream cards,
        .skill-surface / .stage-card for the indigo ones, so the card is
        already in place and only its contents change.
     3. SURFACE TONE: bars on cream use .skeleton (indigo-soft); bars on
        indigo pass tone="dark", because indigo-soft on indigo is invisible.
     4. THE SAME WORDS where they are knowable. The subtitle is one truncated
        line, so its HEIGHT never depends on its content - which means a
        destination whose subtitle is derivable from params, content tables or
        the store can show the real sentence now and swap it for an identical
        one later, at zero cost. Screens with no subtitle at all (Welcome, Hub,
        Record, Settings) carry the loading line as an sr-only status instead;
        see rule 4 in Skeleton.tsx.
     5. STORE-DRIVEN CONDITIONALS, not guesses. The resume banner, the star
        chip, the weak-skill list and the carousel's progress rows are all
        present or absent depending on learner state, so they are read from the
        same store the real screen reads. A placeholder for a thing that is
        usually absent shifts more often than it matches.

   BAR HEIGHTS ARE ARITHMETIC, not taste. A bar standing in for N text lines
   of line-height L is N*h + 8*(N-1) tall (the gap between lines is a fixed
   8px), so h = L - 8*(N-1)/N - a 28px passage over 8 lines wants h=21. A bar
   standing in for ONE line is simply L. Getting this wrong by a few pixels is
   what makes a skeleton "nearly right" and still jump.

   One line-height is worth spelling out, because it is not what it looks like:
   `html` sets an ABSOLUTE `line-height: 24px`, so an element with an arbitrary
   font size (`text-[12px]`, `text-[13px]`) and no leading utility of its own
   inherits 24px - not 1.5x its own size. Every chip, pill and caption below
   was measured with that in mind.

   Dynamic titles (a level's name, a skill's purpose) are resolved here from
   the same params and content tables the real screen reads, so even the words
   in the header are already the destination's words.
   =========================================================================== */

/** The visible loading message, for destinations whose subtitle slot is taken
 *  by something this module cannot derive (only the dev index today). */
const LOADING = 'Just a moment'

/** The message for screens with no subtitle slot to carry it. */
function SpokenNote({ text = 'Getting things ready…' }: { text?: string }) {
  return <LoadingNote srOnly>{text}</LoadingNote>
}

/** The sticky bottom-bar action: a .btn-chunky bar (22px line + py-4 = 54). */
function BarAction() {
  return <Skeleton w="100%" h={54} radius="avatar" />
}

/** An invalid-:id branch's one-line cream bar. Every self-guarding screen
 *  draws exactly this - 24px of text inside a p-4 card. */
function InvalidNote() {
  return (
    <p className="card-cream p-4 text-indigo" aria-hidden="true">
      <Skeleton w="86%" h={24} />
    </p>
  )
}

/** QuestionCard's shape: an item count, a two-line prompt, four options.
 *  Shared by PreTest and Quiz because QuestionCard is. */
function QuestionMirror() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton w="34%" h={20} />
      <SkeletonLines lines={2} h={24} />
      <SkeletonOptions count={4} />
    </div>
  )
}

/* --- the spine ------------------------------------------------------------ */

/**
 * WELCOME. No header at all (the logo is the header), so the fallback opens
 * with the same floated logo over the same indigo hero, then the 4-wide helper
 * grid with the store's current pick already marked, then the "Let's start!"
 * bar.
 */
export function WelcomeFallback() {
  const avatarId = useGameStore((s) => s.avatarId)
  return (
    <ScreenFrame bar={<BarAction />}>
      <SpokenNote />
      <div className="-mt-3 flex flex-col gap-6" aria-hidden="true">
        <div className="flex flex-col items-center">
          <Skeleton w={240} h={240} radius="avatar" className="relative z-10 -mb-16" />
          <div className="hero-surface w-full px-4 pt-20 pb-6 text-center">
            <Skeleton w="70%" h={28} tone="dark" className="mx-auto" />
            <Skeleton w="53%" h={24} tone="dark" className="mx-auto mt-1" />
          </div>
        </div>

        <section>
          <Skeleton w="55%" h={23} radius="title" />
          <Skeleton w="53%" h={24} className="mt-1" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {SKILLS.map((skill) => {
              const active = avatarId === skill.pup.id
              return (
                <div
                  key={skill.pup.id}
                  className={`relative flex flex-col items-center gap-1 rounded-[16px] p-2 shadow-[0_3px_0_0_rgb(26_43_76/0.14)] ${
                    active ? 'bg-turquoise' : 'bg-cream'
                  }`}
                >
                  {active && (
                    <Skeleton w={20} h={20} radius="avatar" className="absolute top-1 right-1" />
                  )}
                  <Skeleton w={64} h={64} radius="avatar" />
                  <Skeleton w="72%" h={16} />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </ScreenFrame>
  )
}

/**
 * PROFILE. Panel 0 of the real screen: two picture cards side by side at
 * their true 120px art size, under the "Who are you?" header with the back
 * door to Welcome. Panel 0 has no local state the fallback could read, so the
 * cells are drawn unselected - which is exactly what a fresh panel 0 is.
 */
export function ProfileFallback() {
  return (
    <ScreenFrame
      title="Who are you?"
      subtitle="Pick the player you want to be."
      onBack={useAppBack('/welcome')}
      bar={<BarAction />}
    >
      <SpokenNote />
      <div className="grid grid-cols-2 gap-3" aria-hidden="true">
        {['girl', 'boy'].map((id) => (
          <div
            key={id}
            className="flex flex-col items-center gap-2 rounded-[20px] p-4 shadow-[0_4px_0_0_rgba(26,43,76,0.15)]"
          >
            <Skeleton w={120} h={120} radius="avatar" />
            <Skeleton w="45%" h={24} />
          </div>
        ))}
      </div>
    </ScreenFrame>
  )
}

/**
 * INTRO. Panel 1, and panel 1 has NO back button on the real screen, so the
 * fallback has none either - adding one would make 56px of header evaporate
 * on arrival. The Skip control keeps its slot in the header, and the subtitle
 * is the panel counter the real screen is already showing.
 */
export function IntroFallback() {
  return (
    <ScreenFrame
      title="Before you start"
      subtitle={`Panel 1 of ${WORLD.intro.length}`}
      headerRight={<Skeleton w={74} h={38} radius="avatar" />}
      bar={<BarAction />}
    >
      <SpokenNote />
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton w="72%" h={32} radius="title" />
        <SkeletonLines lines={4} h={22} />
        <div className="flex items-center gap-3">
          <Skeleton w={96} h={96} radius="avatar" />
          <SkeletonLines lines={2} h={20} className="min-w-0 flex-1" />
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
        {WORLD.intro.map((panel, i) => (
          <Skeleton key={panel.title + i} w={16} h={16} radius="avatar" />
        ))}
      </div>
      <div className="mt-6 flex flex-col items-center gap-2" aria-hidden="true">
        <Skeleton w="88%" h={16} />
        <Skeleton w="16%" h={16} />
      </div>
    </ScreenFrame>
  )
}

/**
 * HUB. The one screen that is NOT a ScreenFrame, so it is the one fallback
 * that is not either: transparent three-column header (logo / wordmark /
 * settings at their true 72px), the vertically centred carousel with all THREE
 * cards at the exact min(64vw, 244px) x 380px the real track uses - end
 * spacers included, so card one sits centred at scroll 0 exactly as the real
 * mount leaves it - and the eight-strong pup bench on its real grass below.
 *
 * Each card's progress row is read from the store for the same reason the Hub
 * reads it: card one always has lessons, card two always has levels, and card
 * three has NO progress row at all until something has been answered.
 */
export function HubFallback() {
  const cardVars = { '--card-w': 'min(64vw, 244px)', '--card-h': '380px' } as CSSProperties

  const lessonsDone = useGameStore((s) => s.skills.filter((k) => k.lessonComplete).length)
  const passedCount = useGameStore(
    (s) => Object.values(s.tiers).filter((t) => t && t.bestScore >= PASSING_SCORE).length,
  )
  const totals = useGameStore((s) => s.totals)
  const answered = totals.correct + totals.incorrect

  const cards = [
    {
      label: WORLD.stages.training.name,
      description: WORLD.stages.training.description,
      progress: { value: lessonsDone, total: SKILLS.length, label: 'lessons done' },
    },
    {
      label: WORLD.stages.arena.name,
      description: WORLD.stages.arena.description,
      progress: { value: passedCount, total: TIER_ORDER.length, label: 'levels passed' },
    },
    {
      label: WORLD.stages.chronicle.name,
      description: WORLD.stages.chronicle.description,
      progress:
        answered > 0
          ? { value: totals.correct, total: answered, label: 'answers correct' }
          : undefined,
    },
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <SpokenNote />

      <header
        className="sticky top-0 z-30 px-4"
        style={{ paddingTop: 'max(26px, env(safe-area-inset-top))', paddingBottom: 12 }}
        aria-hidden="true"
      >
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[72px_1fr_72px] items-center gap-2">
          <Skeleton w={72} h={72} radius="avatar" />
          <Skeleton w="92%" h={48} radius="title" className="mx-auto" />
          <Skeleton w={72} h={72} radius="avatar" className="justify-self-end" />
        </div>
      </header>

      <main
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center overflow-y-auto px-4 py-3"
        aria-hidden="true"
      >
        <div className="relative">
          <ul
            style={cardVars}
            className="flex snap-x snap-mandatory items-center gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <li
              aria-hidden="true"
              className="shrink-0 snap-align-none"
              style={{ width: 'calc((100% - var(--card-w)) / 2)' }}
            />
            {cards.map((card, i) => {
              const active = i === 0
              const progress = card.progress
              const pct =
                progress && progress.total > 0
                  ? Math.round(
                      (Math.min(Math.max(progress.value, 0), progress.total) / progress.total) * 100,
                    )
                  : 0
              return (
                <li
                  key={card.label}
                  className="shrink-0 snap-center transition-[transform,opacity] duration-300 ease-out"
                  style={
                    {
                      width: 'var(--card-w)',
                      opacity: active ? 1 : 0.45,
                      transform: `scale(${active ? 1 : 0.82})`,
                    } as CSSProperties
                  }
                >
                  {/* The label sits ABOVE the card, as a sibling of it, and is
                      therefore outside the card's min-height. */}
                  <span className="mb-1.5 block text-center font-display text-[17px] leading-5 text-indigo">
                    <Skeleton w="70%" h={20} radius="title" className="mx-auto" />
                  </span>

                  <div className="stage-card flex min-h-[var(--card-h)] w-full flex-col items-center gap-3 rounded-[28px] p-4 text-center">
                    <span className="flex min-h-0 flex-1 items-center justify-center">
                      <span className="stage-icon flex h-36 w-36 items-center justify-center rounded-[24px]">
                        <Skeleton w={112} h={112} radius="card" tone="dark" />
                      </span>
                    </span>

                    <span className="block w-full text-[14px] leading-5 text-cream/95">
                      <SkeletonLines lines={2} h={16} tone="dark" className="items-center" />
                    </span>

                    {progress && (
                      <span aria-hidden="true" className="mt-0.5 block w-full">
                        <span className="stage-progress block h-2 w-full overflow-hidden rounded-pill">
                          <span
                            className="stage-progress-fill block h-full rounded-pill"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="mt-1 block text-sm font-bold text-cream/85">
                          <Skeleton w="56%" h={20} tone="dark" />
                        </span>
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
            <li
              aria-hidden="true"
              className="shrink-0 snap-align-none"
              style={{ width: 'calc((100% - var(--card-w)) / 2)' }}
            />
          </ul>

          <div className="-mx-4 mt-3 flex items-center justify-between px-6">
            <Skeleton w={56} h={56} radius="avatar" />
            <Skeleton w="22%" h={20} />
            <Skeleton w={56} h={56} radius="avatar" />
          </div>
        </div>
      </main>

      {/* The bench uses the REAL grass image - it is a local, precached asset,
          and an <img> that has not decoded yet has no height, exactly as it
          will not have one on the real screen. Same picture, same maths. */}
      <div aria-hidden="true">
        <section className="relative mx-auto mt-16 w-full max-w-4xl select-none">
          <img
            src="/assets/world/grass.png"
            alt=""
            aria-hidden="true"
            className="block h-auto w-full"
            decoding="async"
          />
          <div className="absolute inset-x-0" style={{ bottom: '35%' }}>
            <ul className="mb-0.5 flex items-end">
              {SKILLS.map((skill) => (
                <li key={skill.pup.id} className="flex min-w-0 flex-1 justify-center">
                  <Skeleton w="70%" h={16} />
                </li>
              ))}
            </ul>
            <ul className="flex items-end">
              {SKILLS.map((skill) => (
                <li key={skill.pup.id} className="flex min-w-0 flex-1 justify-center">
                  <Skeleton w={44} h={112} radius="avatar" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

/* --- skills --------------------------------------------------------------- */

/**
 * WOOF SCHOOL. The 2x4 grid on .skill-surface cards, each with its pup
 * sticker overhanging the card's top-left exactly as the real one does
 * (-mt-8 over the surface's pt-2), the per-skill accent glow carried in from
 * the same accent table the real screen reads, the pup's name bar floating
 * above the top-right edge, and the pt-8 headroom the first row needs to stay
 * clear of the header.
 *
 * The subtitle is the real lesson count, read from the store: it is one
 * truncated line either way, so showing it now costs nothing and removes a
 * visible sentence swap on arrival.
 */
export function SkillsFallback() {
  const done = useGameStore((s) => s.skills.filter((k) => k.lessonComplete).length)
  return (
    <ScreenFrame
      title={`${SPECIES_NAME} School`}
      subtitle={`${done} of ${SKILLS.length} lessons done`}
      onBack={useBack()}
      wide
    >
      <SpokenNote />
      <ul className="grid grid-cols-2 items-start gap-x-3 gap-y-8 pt-8" aria-hidden="true">
        {SKILLS.map((skill) => (
          <li key={skill.id}>
            <div className="relative">
              {/* Floating pup name, mirroring the real one: a glass pill above the
                  top edge, right-aligned, outside the card. */}
              <span className="absolute right-2 -top-6 z-20 block rounded-[9px] bg-cream/60 px-2 py-0.5 shadow-[inset_0_2px_0_0_rgb(255_255_255/0.3)]">
                <Skeleton w={56} h={16} tone="light" />
              </span>
              <div
                className="skill-surface flex flex-col px-2 pb-2 pt-2"
                style={{ '--skill-glow': accentSoftVar(skill.pup.accent) } as CSSProperties}
              >
                <div className="flex items-stretch gap-1.5">
                  <div className="flex w-[76px] shrink-0 flex-col items-center">
                    <span className="relative z-20 -mt-8 block">
                      <Skeleton w={76} h={76} radius="avatar" tone="dark" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-start pt-0.5">
                    {/* The name reserves a fixed two-line slot (line-clamp-2 +
                        min-h-[42px]), so it is two 21px lines: h = (42 - 8) / 2
                        = 17. The pup name moved outside the card (the bar
                        above); the 28px tile stands in for the accordion
                        button directly beneath the name. */}
                    <SkeletonLines lines={2} h={17} tone="dark" className="w-full" />
                    <Skeleton w={28} h={28} radius="title" tone="dark" className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScreenFrame>
  )
}

/**
 * SKILL LESSON. Helper row (64px symbol tile, two text lines - the pup is no
 * longer framed there; it floats in the rule card now), then the rule card:
 * a 160px pup skeleton floated top-right with the same -mt-8 / -mr-7 overhang
 * as the real sticker, title and rule lines flowing beside and under it (the
 * overflow-hidden wrapper is the float-avoidance the bars need - real text
 * lines dodge a float on their own, skeleton bars are boxes and would run
 * under it), then the teacher's turquoise card - under the skill's own name
 * and purpose, resolved from the :id param exactly as the real screen resolves
 * them. A bad id falls back to the real screen's own invalid branch: title
 * "Lesson", the back door, no subtitle, no bar.
 */
export function SkillLessonFallback() {
  const { id = '' } = useParams()
  const skill = SKILL_BY_ID[id]
  const back = useBack()

  if (!skill) {
    return (
      <ScreenFrame title="Lesson" onBack={back}>
        <SpokenNote />
        <InvalidNote />
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame title={skill.name} subtitle={skill.purpose} onBack={back} bar={<BarAction />}>
      <SpokenNote />
      <div className="flex flex-col gap-4" aria-hidden="true">
        <div className="flex items-center gap-3">
          <Skeleton w={64} h={64} radius="avatar" />
          <div className="min-w-0 flex-1">
            <Skeleton w="55%" h={20} />
            <Skeleton w="72%" h={28} />
          </div>
        </div>
        <section className="card-cream flow-root p-4">
          <div className="float-right -mt-8 -mr-7 mb-2 ml-3">
            <Skeleton w={160} h={160} radius="avatar" />
          </div>
          <div className="overflow-hidden">
            <Skeleton w="38%" h={23} radius="title" className="mb-2" />
            <SkeletonLines lines={3} h={22} />
          </div>
        </section>
        <section className="card-cream bg-turquoise-soft p-4">
          <SkeletonLines lines={3} h={18} />
        </section>
      </div>
    </ScreenFrame>
  )
}

/**
 * PRE-TEST. Flat question layout, exactly as QuestionCard draws it: an item
 * count line, the prompt, four option rows - under the check's own title, its
 * real "0 correct so far" subtitle and the same footer progress bar the real
 * screen reports on. A bad id mirrors the real screen's invalid branch.
 */
export function PreTestFallback() {
  const { id = '' } = useParams()
  const skill = SKILL_BY_ID[id]
  const back = useBack()

  if (!skill) {
    return (
      <ScreenFrame title="Check" onBack={back}>
        <SpokenNote />
        <InvalidNote />
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame
      title={`Check: ${skill.name}`}
      subtitle="0 correct so far"
      onBack={back}
      footer={
        <div className="mx-auto w-full max-w-2xl px-4 pb-2">
          <ProgressBar value={0} max={20} label="Pre-test progress" />
        </div>
      }
    >
      <SpokenNote />
      <div aria-hidden="true">
        <QuestionMirror />
      </div>
    </ScreenFrame>
  )
}

/* --- arena ---------------------------------------------------------------- */

/**
 * ARENA. The three stacked level cards on their real surfaces - card one as
 * an open .stage-card, cards two and three as .stage-card-locked, which is
 * the state a learner arrives in with nothing earned - each with the
 * medallion, the name pair, the helper pup, the real progress track and the
 * chips at their true sizes.
 *
 * The resume banner IS drawn, but only when the store actually holds an
 * interrupted attempt: it is ~296px of card, so drawing it speculatively
 * would shift every level card down and then take it away again. Everything
 * in it - the "N to go" pill, the item counter, the stalled warning - comes
 * from the same attempt object the real screen reads.
 */
export function ArenaFallback() {
  const back = useBack()
  const available = useGameStore(useShallow((s) => Array.from(selectAvailableTiers(s))))
  const tiers = useGameStore((s) => s.tiers)
  const resume = useGameStore((s) => selectContinueAttempt(s))
  const stalled = useGameStore((s) => {
    const a = selectContinueAttempt(s)
    if (!a) return false
    return (s.tiers[a.tierId]?.attempts.length ?? 0) >= MAX_ATTEMPTS
  })

  const resumeTier = resume ? WORLD.tiers[resume.tierId] : null
  const resumeTotal = resume ? resume.questionIds.length : 0
  const resumeDone = resume ? resume.index : 0
  const resumePct = resumeTotal > 0 ? Math.round((resumeDone / resumeTotal) * 100) : 0

  return (
    <ScreenFrame
      title={WORLD.stages.arena.name}
      subtitle="Three places to visit"
      onBack={back}
      headerRight={<Skeleton w={56} h={56} radius="avatar" />}
    >
      <SpokenNote />

      {resume && resumeTier && (
        <section
          aria-hidden="true"
          className="card-cream mb-4 overflow-hidden bg-turquoise-soft p-4 shadow-[0_3px_0_0_rgb(0_163_150/0.35),0_18px_32px_-22px_rgb(26_35_126/0.55)]"
        >
          <div className="flex items-start gap-3">
            <Skeleton w={44} h={44} style={{ borderRadius: 16 }} />
            <div className="min-w-0 flex-1">
              <Skeleton w="64%" h={24} radius="title" />
              <Skeleton w="88%" h={20} className="mt-0.5" />
            </div>
          </div>

          <div className="mt-3 rounded-[18px] bg-cream p-3 shadow-[0_1px_0_0_rgb(26_43_76/0.06)]">
            <div className="flex items-center justify-between gap-2">
              <Skeleton w="55%" h={24} radius="title" />
              <Skeleton w={72} h={32} />
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-2.5 flex-1 overflow-hidden rounded-pill bg-indigo-soft"
              >
                <span
                  className="block h-full rounded-pill bg-turquoise"
                  style={{ width: `${resumePct}%` }}
                />
              </span>
              <Skeleton w={64} h={24} />
            </div>
          </div>

          {stalled ? (
            <div className="mt-3 rounded-[16px] bg-coral-soft p-3">
              <SkeletonLines lines={4} h={18} />
              <Skeleton w="100%" h={46} radius="avatar" className="mt-3" />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton w="100%" h={50} radius="avatar" />
              <Skeleton w="100%" h={46} radius="avatar" />
            </div>
          )}
        </section>
      )}

      <ul className="flex flex-col gap-3.5" aria-hidden="true">
        {TIER_ORDER.map((id) => {
          const state = tiers[id]
          const rule = TIERS.find((t) => t.id === id)
          const open = available.includes(id)
          const best = state?.bestScore ?? 0
          const bestPct = Math.min(Math.max(best, 0), 100)
          const passed = best >= PASSING_SCORE
          const tone = open ? ('dark' as const) : ('light' as const)
          /* "Earn all 8 pups to open this place." is one line at the design's
             360px width; the medium and hard strings add " and pass N level(s)"
             and run to two. */
          const requirementLines = rule?.requiresTiersPassed ? 2 : 1

          return (
            <li key={id}>
              <div
                className={`flex w-full flex-col gap-3 rounded-[28px] p-4 text-left ${
                  open ? 'stage-card' : 'stage-card-locked'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${
                      open ? 'stage-icon' : 'stage-icon-locked'
                    }`}
                  >
                    <Skeleton w={44} h={44} radius="card" tone={tone} />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <Skeleton h={24} tone={tone} className="min-w-0 flex-1" />
                      {open && passed && <Skeleton w={52} h={28} tone={tone} />}
                    </span>
                    <Skeleton w="70%" h={20} tone={tone} />
                  </span>

                  <span className="shrink-0">
                    <Skeleton w={52} h={52} radius="avatar" tone={tone} />
                  </span>
                </span>

                {open ? (
                  <>
                    <SkeletonLines lines={2} h={16} tone={tone} />

                    <span aria-hidden="true" className="block">
                      <span className="stage-progress block h-2.5 w-full overflow-hidden rounded-pill">
                        <span
                          className="stage-progress-fill block h-full rounded-pill"
                          style={{ width: `${bestPct}%` }}
                        />
                      </span>
                    </span>

                    {/* Two chips then the status: at 360px the two chips fill
                        the first line (76 + 8 + 76 of 296) and the status wraps
                        to a second, exactly as the real flex-wrap row does. */}
                    <span className="flex flex-wrap items-center gap-2">
                      <Skeleton w={76} h={32} tone={tone} />
                      <Skeleton w={76} h={32} tone={tone} />
                      <Skeleton w={190} h={24} tone={tone} className="ml-auto" />
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-2 rounded-[16px] bg-navy/10 px-3 py-2">
                    <Skeleton w={20} h={20} radius="avatar" />
                    <SkeletonLines
                      lines={requirementLines}
                      h={requirementLines === 1 ? 20 : 16}
                      className="min-w-0 flex-1"
                    />
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </ScreenFrame>
  )
}

/* --- quiz, result --------------------------------------------------------- */

/**
 * QUIZ. The passage card, then the question and its four options, then the
 * helper button in its own right-aligned row - under the level's own name
 * with the hint pill's slot and the progress bar's footer.
 *
 * `note` lets Quiz itself reuse this as its own "choosing your story" and
 * "opening your quiz" branches, so the screen's transient states draw the same
 * picture the route does instead of a bare StorySkeleton.
 */
export function QuizFallback({ note }: { note?: string } = {}) {
  const { level = '' } = useParams()
  const tierId: TierId | null = TIER_ORDER.includes(level as TierId) ? (level as TierId) : null
  const tier = tierId ? WORLD.tiers[tierId] : null
  const back = useAppBack('/arena')
  const correct = useGameStore((s) => (tierId ? (s.activeAttempts[tierId]?.correct ?? 0) : 0))

  if (!tierId || !tier) {
    return (
      <ScreenFrame title="Level">
        <SpokenNote />
        <InvalidNote />
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame
      title={tier.name}
      subtitle={`${correct} correct so far`}
      onBack={back}
      /* "Hint locked" / "1 hint left" / "1 hint used" are all eleven
         characters at 13px extrabold, so one width covers every state. */
      headerRight={<Skeleton w={112} h={32} />}
      footer={
        <div className="mx-auto w-full max-w-2xl px-4 pb-1">
          <ProgressBar value={0} max={tier.itemCount} label="Quiz progress" />
        </div>
      }
    >
      <SpokenNote text={note} />
      <div className="flex flex-col gap-4" aria-hidden="true">
        <section className="card-cream p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <Skeleton w="55%" h={24} radius="title" />
            <Skeleton w={88} h={20} />
          </div>
          <SkeletonLines lines={8} h={21} />
        </section>

        <QuestionMirror />

        <div className="flex justify-end pt-2">
          <Skeleton w={104} h={64} />
        </div>
      </div>
    </ScreenFrame>
  )
}

/**
 * RESULT. The indigo score panel, then whichever of the conditional blocks
 * the store actually holds - the lime unlock line, the teacher's card after a
 * third failed attempt, the weak-skill list, the helper's thank-you - under
 * the level's own results title and Tagalog subtitle. The bar is ONE button,
 * because Result only ever renders one.
 */
export function ResultFallback() {
  const { level = '' } = useParams()
  const tierId: TierId | null = TIER_ORDER.includes(level as TierId) ? (level as TierId) : null
  const tier = tierId ? WORLD.tiers[tierId] : null
  const state = useGameStore((s) => (tierId ? s.tiers[tierId] : undefined))
  const missed = useGameStore((s) => s.skillMissedCount)

  if (!tierId || !tier || !state) {
    return (
      <ScreenFrame title="Results" wide>
        <SpokenNote />
        <InvalidNote />
      </ScreenFrame>
    )
  }

  const last = state.attempts[state.attempts.length - 1]
  const score = last?.score ?? 0
  const passed = isPassing(score)
  const left = attemptsLeft(state.attempts)
  const weak = SKILLS.filter((s) => (missed[s.name] ?? 0) > 0).sort(
    (a, b) => (missed[b.name] ?? 0) - (missed[a.name] ?? 0),
  )
  const nextTier = TIER_ORDER[TIER_ORDER.indexOf(tierId) + 1]
  const nextUnlocked = passed && nextTier !== undefined
  const helper = state.hintSkillId
    ? SKILLS.find((s) => s.id === state.hintSkillId)?.pup
    : undefined

  return (
    <ScreenFrame
      title={`${tier.name} results`}
      subtitle={tier.tagalog}
      wide
      bar={
        <div className="flex w-full gap-3">
          <Skeleton w="100%" h={54} radius="avatar" />
        </div>
      }
    >
      <SpokenNote />
      <div className="flex flex-col gap-4" aria-hidden="true">
        <section className="rounded-[24px] bg-indigo p-5 text-center text-cream shadow-[0_20px_34px_-20px_rgb(26_35_126/0.7)]">
          <Skeleton w="42%" h={48} radius="title" tone="dark" className="mx-auto" />
          <Skeleton w="76%" h={24} tone="dark" className="mx-auto mt-3" />
        </section>

        {passed && nextUnlocked && (
          <div className="card-cream bg-lime-soft p-3 text-center">
            <SkeletonLines lines={2} h={20} className="items-center" />
          </div>
        )}

        {!passed && left === 0 && (
          <section className="card-cream bg-turquoise-soft flex items-center gap-3 p-4">
            <Skeleton w={96} h={96} radius="avatar" />
            <div className="min-w-0 flex-1">
              <Skeleton w="60%" h={24} radius="title" />
              <SkeletonLines lines={3} h={18} />
            </div>
          </section>
        )}

        {weak.length > 0 && (
          <section className="card-cream p-4">
            <Skeleton w="62%" h={23} radius="title" className="mb-2" />
            <ul className="flex flex-col gap-2">
              {weak.slice(0, 5).map((skill) => (
                <li key={skill.id}>
                  <span className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2">
                    <Skeleton w={20} h={20} />
                    <Skeleton h={24} className="min-w-0 flex-1" />
                    <Skeleton w={104} h={20} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {helper && (
          <div className="card-cream flex items-center gap-3 p-3">
            <Skeleton w={56} h={56} radius="avatar" />
            <Skeleton h={24} className="min-w-0 flex-1" />
          </div>
        )}

        <div className="text-center text-sm text-navy/80">
          <Skeleton w="76%" h={20} className="mx-auto" />
        </div>

        {/* Column below 640px, a row above - the real buttons do the same. */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton w="100%" h={54} radius="avatar" />
          <Skeleton w="100%" h={54} radius="avatar" />
        </div>

        <div className="text-center text-sm text-navy/80">
          <Skeleton w="61%" h={20} className="mx-auto" />
        </div>
      </div>
    </ScreenFrame>
  )
}

/* --- record, settings ----------------------------------------------------- */

/**
 * RECORD. No subtitle on the real screen, so the loading message is sr-only
 * and the header stays exactly as tall as it will be. The content mirrors a
 * real <table> rather than a stack of divs, because table layout is what
 * decides the column widths - a div approximation would put every column in a
 * different place the moment the real screen arrived.
 *
 * The hint row and the "See my pups" action are deliberately absent: both are
 * marked .no-print, and .no-print is currently `display: none !important`
 * globally, so neither renders on screen today (see the note in the final
 * report - this is a bug in index.css, not something the skeleton should
 * paper over).
 */
export function RecordFallback() {
  const back = useBack()
  const missed = useGameStore((s) => s.skillMissedCount)
  const totalReview = Object.values(missed).reduce((a, b) => a + b, 0)

  return (
    <ScreenFrame
      title="My reading record"
      onBack={back}
      wide
      footer={
        <div className="mx-auto flex w-full max-w-2xl gap-3 px-4">
          <Skeleton w="100%" h={54} radius="avatar" />
          <Skeleton w="100%" h={54} radius="avatar" />
        </div>
      }
    >
      <SpokenNote />
      <div aria-hidden="true">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-navy/20">
              <th scope="col" className="py-2 text-sm uppercase tracking-wide text-navy">
                <Skeleton w={64} h={20} />
              </th>
              <th scope="col" className="py-2 text-sm uppercase tracking-wide text-navy">
                <Skeleton w={64} h={20} />
              </th>
              <th
                scope="col"
                className="py-2 text-right text-sm uppercase tracking-wide text-navy"
              >
                <Skeleton w={76} h={20} className="ml-auto" />
              </th>
              <th
                scope="col"
                className="py-2 text-right text-sm uppercase tracking-wide text-navy"
              >
                <Skeleton w={56} h={20} className="ml-auto" />
              </th>
              <th
                scope="col"
                className="py-2 text-right text-sm uppercase tracking-wide text-navy"
              >
                <Skeleton w={56} h={20} className="ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((skill) => (
              <tr key={skill.id} className="border-b-2 border-navy/15 align-middle">
                <th scope="row" className="py-2 pr-2 font-bold text-indigo">
                  <span className="flex items-center gap-2">
                    <Skeleton w={18} h={18} />
                    <Skeleton w={104} h={24} />
                  </span>
                </th>
                <td className="py-2 pr-2">
                  <Skeleton w={40} h={40} radius="avatar" />
                </td>
                <td className="py-2 text-right tabular-nums text-indigo">
                  <Skeleton w={48} h={20} className="ml-auto" />
                </td>
                <td className="py-2 text-right tabular-nums text-indigo">
                  <Skeleton w={48} h={20} className="ml-auto" />
                </td>
                <td className="py-2 text-right font-bold tabular-nums">
                  <Skeleton w={48} h={20} className="ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-6 mb-2 text-[20px] text-indigo">
          <Skeleton w="24%" h={23} radius="title" />
        </h2>

        {/* All three level rows always render: freshTiers() creates every
            tier state at start, so the real screen never omits one. */}
        <ul className="flex flex-col gap-1">
          {TIER_ORDER.map((id) => (
            <li
              key={id}
              className="flex items-baseline justify-between gap-2 border-b-2 border-navy/15 py-2"
            >
              <Skeleton w="26%" h={24} />
              <Skeleton w="44%" h={24} />
            </li>
          ))}
        </ul>

        <div className="mt-4 text-[15px] leading-6 text-navy/80">
          {totalReview === 0 ? (
            <Skeleton w="64%" h={24} />
          ) : (
            <SkeletonLines lines={2} h={16} />
          )}
        </div>
      </div>
    </ScreenFrame>
  )
}

/**
 * SETTINGS. No subtitle either - two cream cards (Sound, Motion) and the
 * full-width way-out button, which is exactly what the real list holds. The
 * Motion card's second line is one line or two depending on the OS reduced
 * motion flag, so the fallback asks the same hook the real screen asks.
 */
export function SettingsFallback() {
  const back = useBack()
  const reduced = useReducedMotion()

  return (
    <ScreenFrame title="Settings" onBack={back}>
      <SpokenNote />
      <ul className="flex flex-col gap-3" aria-hidden="true">
        <li className="card-cream p-4">
          <div className="flex w-full items-center gap-3">
            <Skeleton w={48} h={48} radius="avatar" />
            <span className="min-w-0 flex-1">
              <Skeleton w="38%" h={24} radius="title" />
              <Skeleton w="46%" h={20} />
            </span>
          </div>
        </li>
        <li className="card-cream p-4">
          <Skeleton w="34%" h={24} radius="title" />
          {reduced ? (
            <SkeletonLines lines={2} h={16} className="mt-1" />
          ) : (
            <Skeleton w="74%" h={20} className="mt-1" />
          )}
        </li>
      </ul>
      <Skeleton w="100%" h={54} radius="avatar" className="mt-4" aria-hidden="true" />
    </ScreenFrame>
  )
}

/**
 * DEV BYPASS. Development only - this component is unreachable from a
 * production bundle, because the route that renders it is guarded by
 * import.meta.env.DEV. It still gets a real fallback so the dev index does not
 * flash the generic shape while its own chunk arrives.
 */
export function DevFallback() {
  return (
    <ScreenFrame title="Dev bypass" subtitle={LOADING} onBack={useAppBack('/')}>
      <SpokenNote />
      <div className="flex flex-col gap-5" aria-hidden="true">
        <div className="card-cream p-3">
          <SkeletonLines lines={2} h={16} />
        </div>
        <section>
          <Skeleton w="44%" h={23} radius="title" className="mb-2" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[16px] bg-indigo p-3 shadow-[0_3px_0_0_rgb(26_43_76/0.15)]"
              >
                <Skeleton w="70%" h={24} tone="dark" />
                <Skeleton w="86%" h={20} tone="dark" />
                <Skeleton w="52%" h={24} tone="dark" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScreenFrame>
  )
}
