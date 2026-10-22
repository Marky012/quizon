import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { PupBench } from '@/components/PupBench'
import { SettingsButton } from '@/components/SettingsButton'
import { StageArt } from '@/components/StageArt'
import { StageCarousel, type CarouselCard } from '@/components/StageCarousel'
import { SKILLS } from '@/content/manifest'
import { TIER_ORDER, WORLD } from '@/content/world'
import { play, buzz } from '@/lib/audio'
import { prefetchForPath } from '@/lazyRoutes'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   HUB - the flat carousel, the header, and the pup bench on the grass.

   THE SCREEN IS DELIBERATELY NOT ScreenFrame. It used to be, and ScreenFrame
   brings two things this screen does not want:

     - a fixed 72px opaque cream bottom bar, which is exactly where the grass
       and the sitting dogs now live. A bar there would sit on top of them.
     - a scrolling <main> with a title header, when this screen's header is a
       small brand-and-settings strip rather than a title bar.

   So the shell is written out here. The trade is real: Hub no longer inherits
   focus management, the safe-area padding, or the print styles that
   ScreenFrame centralises. The safe-area insets are copied in below.

   THREE STAGES, since Pup Roster was deleted on 2026-10-05. The unlock rules
   live here rather than being spread across the screens that check them:

     Woof School     always open. A locked first stage is a dead end.
     Reading Trail   opens once all eight pups are earned, the same rule the
                     Easy tier uses in gameConfig TIERS. Quizzing without the
                     lessons would assess nothing the app taught.
     Your Record    always open. A report of no progress is still true.

   A LOCKED STAGE NEVER DEAD-TAPS: it thuds, it buzzes, and the card states its
   requirement in words (art bible 7.1).
   =========================================================================== */

export function Hub() {
  const navigate = useNavigate()
  const lessonsDone = useGameStore((s) => s.skills.filter((k) => k.lessonComplete).length)
  const passedCount = useGameStore(
    (s) => Object.values(s.tiers).filter((t) => t && t.bestScore >= 70).length,
  )
  const totals = useGameStore((s) => s.totals)
  const answered = totals.correct + totals.incorrect
  const lastEarnedPupId = useGameStore((s) => s.lastEarnedSkillId)
  const consumePupCelebration = useGameStore((s) => s.consumePupCelebration)

  /* THE CONFETTI WINDOW. A freshly-earned pup sets lastEarnedSkillId in the
     store; the first time this screen sees it, the burst mounts and the
     window runs for 3.4s (longer than the longest piece: delay 0.4 + a
     2.7s-duration piece), then unmounts AND clears the store flag - all in
     the same pass, so revisiting the Hub is a calm screen, not confetti on
     loop. Consuming happens on the visible run, not in an effect tearing on
     and off, so React StrictMode's double-invoke cannot eat the celebration
     before it shows. */
  const [celebrate, setCelebrate] = useState<string | null>(null)
  useEffect(() => {
    if (!lastEarnedPupId) return
    setCelebrate(lastEarnedPupId)
  }, [lastEarnedPupId])

  useEffect(() => {
    if (!celebrate) return
    play('celebrate')
    const t = window.setTimeout(() => {
      setCelebrate(null)
      consumePupCelebration()
    }, 3400)
    return () => window.clearTimeout(t)
  }, [celebrate, consumePupCelebration])

  /* Each card now reports its own progress, so the Hub answers "how far am I?"
     without opening a stage. The Reading Trail's bar points at the PUPS that
     unlock it while it is locked, and switches to levels passed once it opens -
     the same bar means "the way in" and then "how far in" rather than sitting
     empty behind a padlock. */
  const cards: CarouselCard[] = [
    {
      id: 'training',
      label: WORLD.stages.training.name,
      /* STAGE ART. Each card renders <StageArt/>, which shows the image at
         /public/assets/hub/ when it exists and falls back to a hand-drawn SVG
         otherwise - so a missing or misnamed file is a vector rather than a
         broken image. The three cards' art has landed:

           woof-school.png    reading-trail.png    your-record.png

         The extension in the path has to match the file on disk exactly: a
         .png path at a .jpg file is a silent 404 and the card keeps showing
         the placeholder vector forever. */
      art: <StageArt stage="training" image="/assets/hub/woof-school.png" />,
      description: WORLD.stages.training.description,
      locked: false,
      done: lessonsDone === SKILLS.length,
      progress: {
        value: lessonsDone,
        total: SKILLS.length,
        label: 'lessons done',
      },
    },
    {
      id: 'arena',
      label: WORLD.stages.arena.name,
      art: <StageArt stage="arena" image="/assets/hub/reading-trail.png" />,
      description: WORLD.stages.arena.description,
      locked: false,
      done: passedCount >= TIER_ORDER.length,
      progress: { value: passedCount, total: TIER_ORDER.length, label: 'levels passed' },
    },
    {
      id: 'chronicle',
      label: WORLD.stages.chronicle.name,
      art: <StageArt stage="chronicle" image="/assets/hub/your-record.png" />,
      description: WORLD.stages.chronicle.description,
      locked: false,
      done: false,
      progress:
        answered > 0
          ? { value: totals.correct, total: answered, label: 'answers correct' }
          : undefined,
    },
  ]

  const destination: Record<string, string> = {
    training: '/skills',
    arena: '/arena',
    chronicle: '/record',
  }

  return (
    /* ONE SCREEN ON A LAPTOP. On a phone the page is allowed to be taller than
       the glass - the carousel is 380px and the grass is a footer you scroll to.
       At lg the same stack measured 1056px, so on every common laptop (768, 800,
       900 tall) the grass and the pups' names sat BELOW THE FOLD: the footer was
       sliced by the window edge and the spotlighted name, which is the whole
       point of the bench, could not be seen at all. Fixing the height to the
       glass and letting main flex (below) puts the grass on the bottom edge and
       keeps the names in view; the card and grass shrink to fit - see
       StageCarousel's --card-h and PupBench's lg band. */
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      {/* --- Header: logo left, wordmark centred, settings right -------------
           NO SURFACE. This used to be an opaque cream bar with a navy rule and a
           turquoise shadow, which read as a second toolbar stacked over the app
           backdrop - chrome the screen did not earn. It is transparent now, so the
           backdrop runs continuously from behind the header all the way to the
           grass, and the three controls are the only thing that says "header".

           The LAYOUT IS A THREE-COLUMN GRID, not a flex row with a centred child.
           In a flex row the centre item's position depends on the WIDTH of its
           neighbours, and here the neighbours are an image and a 72px button, so
           the wordmark sat a few pixels off true centre and drifted differently
           at every breakpoint. Three equal tracks put the middle track dead centre
           regardless of what is in the side tracks.

           WHITE TEXT ON A TRANSPARENT BAR IS A CONTRAST RISK, so the wordmark
           carries a navy text-shadow rather than relying on the backdrop staying
           dark. Without it, "Quiz" disappears the moment the backdrop loads
           lighter than expected. The shadow is what makes white safe here. */}
      <header
        className="sticky top-0 z-30 px-4"
        style={{ paddingTop: 'max(26px, env(safe-area-inset-top))', paddingBottom: 12 }}
      >
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[72px_1fr_72px] items-center gap-2">
          <img
            src="/assets/brand/quizon-logo.png"
            alt=""
            width={72}
            height={72}
            aria-hidden="true"
            className="h-[72px] w-[72px] shrink-0 drop-shadow-[0_3px_0_rgba(26,43,76,0.35)]"
          />

          {/* HUGE, and split by hand. WORLD.gameName is the string 'QuizOn!' and
              colouring "Quiz" and "On!" differently needs the two runs to exist as
              separate elements - there is no reliable way to split a display name
              at runtime. The trade is that the header now owns its own spelling
              instead of reading it from the world config; if gameName ever changes,
              this line has to change with it. */}
          <p
            className="min-w-0 truncate text-center font-display text-[48px] leading-none sm:text-[56px]"
            style={{
              textShadow:
                '0 3px 0 var(--color-navy), 0 0 10px rgba(26,43,76,0.55)',
            }}
          >
            <span className="text-white">Quiz</span>
            <span className="text-[#e6b800]">On!</span>
          </p>

          <SettingsButton className="h-[72px] w-[72px] justify-self-end [&_svg]:h-9 [&_svg]:w-9" />
        </div>
      </header>

      {/* --- Carousel -------------------------------------------------------
           flex + justify-center, because `flex-1` alone stretches main to fill
           the leftover height while its children stay pinned to the top. That
           left a band of empty page between the arrows and the pup bench, and
           the cards read as a header strip rather than the middle of the screen.

           `overflow-y-auto` goes with it deliberately: justify-content:center
           CLIPS content that overflows the top of a box, so on a short screen
           (or with large system text) the first thing in main would have been
           unreachable above the scroll origin. Letting main scroll keeps every
           part of it reachable in that case. */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center overflow-y-auto px-4 py-3">
        {/* The learner code line that used to sit here was removed 2026-10-05.
            It was the only thing between the header and the carousel, and the
            carousel is vertically centred in this space - so one line of "Your
            code is BAL-47" pushed the cards off centre and made the Hub read as
            an admin page. The code is untouched in the store; see Welcome.tsx. */}
        {/* Fetching a card's chunk on intent is the same trick the old list used.
            A child takes a noticeable moment to move a thumb onto a card, and
            that gap is long enough to finish a fetch - so the transition lands
            without a stutter. onFocus matters as much as onPointerEnter here,
            because a keyboard learner never generates a pointer event. */}
        <StageCarousel
          cards={cards}
          onOpen={(card) => {
            if (card.locked) {
              play('locked')
              buzz(40)
              return
            }
            play('tap')
            const to = destination[card.id]!
            navigate(to)
          }}
          onIntent={(card) => {
            if (!card.locked) prefetchForPath(destination[card.id]!)
          }}
        />
      </main>

      {/* --- Grass, and the pack sitting on it ------------------------------
           Edge-to-edge on purpose: the grass is the screen's last surface and
           there is nothing interactive in its bottom strip, so it must run to
           the very bottom of the viewport. NO safe-area bottom padding here -
           `env(safe-area-inset-bottom)` on the old wrapper turned into a band
           of page background under the grass on any device that reports an
           inset (phone PWA / DevTools emulation). The home indicator or
           emulated inset simply overlaps the soil, which is the standard look
           for a full-bleed footer illustration. */}
      <PupBench />

      {celebrate && <ConfettiBurst />}
    </div>
  )
}