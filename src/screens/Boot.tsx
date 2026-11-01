import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ProgressBar } from '@/components/ScreenFrame'
import { LoadingNote } from '@/components/Skeleton'
import { WORLD } from '@/content/world'
import { play } from '@/lib/audio'
import {
  bootSeen,
  installAvailable,
  isStandalone,
  markBootSeen,
  promptInstall,
} from '@/lib/install'
import { isWarmupDone, subscribeWarmup, startWarmup } from '@/lib/preload'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE BOOT GATE.

   Every page load stops here and nothing after it renders until the game is
   whole. That is the promise the start button makes: when the learner presses
   it, the next screen will not pop pictures in, fetch a route chunk, or start
   the music halfway through a sentence.

   THREE PHASES.

   1. Download. Only on a very first launch. The child is offered the app, and
      the download is the thing they choose - so the bar does not run before
      that choice. An installed app never sees this phase.

   2. Loading. Every launch, first or returning. The warm-up fetches every
      route chunk, every picture, the fonts, the music track and (in
      production) the service worker's offline precache. The bar reports real
      tasks finishing, not a guess.

   3. Start. "Start playing" on a fresh profile, "Continue playing" for a
      learner with a game in progress. This is a deliberate tap, not a
      redirect: the child gets a moment where the app is visibly ready, and a
      returning child gets the same gate every time they open the game.

   INTERNAL BOUNCES PASS THROUGH. Welcome, Profile and Intro all bounce back
   to "/" when they are done, and a learner who types "/" lands here too. Once
   the page has already warmed, this screen must not replay the gate - that
   would put a second loading screen and a second tap in the middle of setup.
   The `wasWarmAtMount` check is the difference between a fresh launch and a
   bounce inside the same page load.
   =========================================================================== */

type Phase = 'download' | 'loading' | 'start'

/**
 * The tips that rotate under the bar.
 *
 * Reassuring, never technical: no file counts, no byte sizes, no "caching"
 * (art bible, panel 01). The first one is the art bible's own example. The
 * rest are in the same voice - one idea, one short sentence, something the
 * child can act on the moment the game opens.
 */
const TIPS = [
  'Tip: a good reader looks for the name of the place.',
  'Tip: read the title first. It tells you what the text is about.',
  'Tip: "should" and "I think" are usually someone’s opinion.',
  'Tip: ask who, what, when, where and why.',
] as const

/** How long a tip stays up. Long enough to be read by a nine-year-old. */
const TIP_MS = 3200

export function Boot() {
  const navigate = useNavigate()
  const hasStarted = useGameStore((s) => s.hasStarted)
  const profileCreated = useGameStore((s) => s.profileCreated)
  const introCompleted = useGameStore((s) => s.introCompleted)

  /** True when this mount is an internal bounce, not a fresh launch. */
  const [wasWarmAtMount] = useState(isWarmupDone)

  /**
   * A device that has never been through the gate. An installed app is never
   * "first", and a device with a game in progress is not first either - the
   * download screen must never appear in front of a child mid-quest.
   */
  const [firstVisit] = useState(() => !bootSeen() && !hasStarted && !isStandalone())

  const [phase, setPhase] = useState<Phase>(firstVisit ? 'download' : 'loading')
  const [pct, setPct] = useState(0)
  const [tip, setTip] = useState(0)
  const wantsInstall = useRef(false)

  /** Where the start button goes. Same spine decision Boot has always made. */
  const destination = !hasStarted
    ? '/welcome'
    : !profileCreated
      ? '/profile'
      : !introCompleted
        ? '/intro'
        : '/hub'

  useEffect(() => {
    if (wasWarmAtMount) return

    const unsubscribe = subscribeWarmup((p) => {
      setPct(Math.round((p.done / p.total) * 100))
    })

    // A returning learner starts downloading the moment the screen opens. A
    // first visit waits for the button, because the download is the offer.
    if (!firstVisit) {
      void startWarmup().then(() => {
        setPct(100)
        setPhase('start')
      })
    }

    return unsubscribe
  }, [firstVisit, wasWarmAtMount])

  useEffect(() => {
    const id = globalThis.setInterval(() => {
      setTip((t) => (t + 1) % TIPS.length)
    }, TIP_MS)
    return () => globalThis.clearInterval(id)
  }, [])

  function begin(install: boolean) {
    play('tap')
    markBootSeen()
    setPhase('loading')
    // The prompt must be called from this tap. It is fired alongside the
    // warm-up, not awaited: a dismissed prompt must not stop the download.
    // If the browser's beforeinstallprompt event arrives while the bar is
    // filling, remember the learner's choice and fire it on the Start tap.
    if (install) {
      if (installAvailable()) void promptInstall()
      else wantsInstall.current = true
    }
    void startWarmup().then(() => {
      setPct(100)
      setPhase('start')
    })
  }

  function enterGame() {
    play('tap')
    markBootSeen()
    if (wantsInstall.current && installAvailable()) {
      wantsInstall.current = false
      void promptInstall()
    }
    navigate(destination, { replace: true })
  }

  // A setup screen bounced back to "/" after the page was already warmed. Pass
  // straight through - see INTERNAL BOUNCES above.
  if (wasWarmAtMount) return <Navigate to={destination} replace />

  const pageStyle = {
    paddingTop: 'max(24px, env(safe-area-inset-top))',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  }

  /* ---- 1. THE DOWNLOAD OFFER (very first launch only) ------------------- */
  if (phase === 'download') {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6"
        style={pageStyle}
      >
        <h1 className="sr-only">{`QuizOn! - ${WORLD.subtitle}`}</h1>
        <img
          src="/assets/brand/quizon-logo.png"
          alt=""
          width={160}
          height={160}
          aria-hidden="true"
          className="h-[140px] w-[140px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
        />
        <div className="card-cream animate-feedback-spring w-full max-w-sm p-5 text-center">
          <p className="font-display text-[24px] leading-7 font-bold text-indigo">Ready to play?</p>
          <p className="mt-1 text-[15px] leading-6 text-navy/80">
            Download QuizOn! once, then it opens like an app and works with no signal.
          </p>
          <button
            type="button"
            onClick={() => begin(true)}
            className="btn-chunky mt-4 flex w-full items-center justify-center gap-2 bg-indigo px-5 py-3.5 text-[17px] text-cream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v11" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
            Download and play offline
          </button>
          <button
            type="button"
            onClick={() => begin(false)}
            className="mt-3 w-full rounded-button px-5 py-3 text-[15px] font-bold text-indigo underline decoration-indigo/30 underline-offset-4 transition-colors hover:bg-indigo-soft/60 active:scale-[0.98]"
          >
            Continue playing in browser
          </button>
        </div>
      </main>
    )
  }

  /* ---- 2. THE WARM-UP --------------------------------------------------- */
  if (phase === 'loading') {
    /* Announced four times, not once per percent. A live region that changes
       on every tick talks over the screen the learner is heading for. */
    const quarter = Math.floor(pct / 25)
    const spoken =
      quarter >= 4 ? 'Ready.' : quarter === 0 ? 'Getting QuizOn! ready.' : `Loading, ${quarter * 25} percent.`

    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6"
        style={pageStyle}
      >
        {/* The heading is for screen readers. The visible wordmark is drawn into
            the logo file, so printing it as text as well would say it twice. */}
        <h1 className="sr-only">{`QuizOn! - ${WORLD.subtitle}`}</h1>

        {/* The same mark Welcome and the Hub use, at the same 3px navy drop
            shadow. The float is CSS and index.css neutralises it when the OS
            asks for reduced motion. */}
        <div className="relative">
          <span aria-hidden="true" className="absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.75),transparent_65%)] blur-md" />
          <img
            src="/assets/brand/quizon-logo.png"
            alt=""
            width={200}
            height={200}
            aria-hidden="true"
            className="h-[200px] w-[200px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
          />
        </div>

        <p className="font-display text-[22px] leading-7 font-bold text-indigo">{WORLD.subtitle}</p>

        <div className="card-cream w-full max-w-sm bg-cream/95 p-5 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] leading-6 font-semibold text-navy/80">
              Getting the game ready…
            </span>
            <span className="font-display w-[68px] text-right text-[28px] leading-8 text-indigo tabular-nums">
              {pct}%
            </span>
          </div>

          {/* The same bar the quiz uses. Determinate on purpose: it reports real
              progress, so it is never a lie about how long the wait is. */}
          <div className="mt-2">
            <ProgressBar value={pct} max={100} label="Getting QuizOn! ready" />
          </div>

          {/* min-h holds two lines, so a long tip does not push the card down
              when the next one is shorter. */}
          <p className="mt-3 min-h-[48px] text-[15px] leading-6 text-navy/80">{TIPS[tip]}</p>
        </div>

        <LoadingNote srOnly>{spoken}</LoadingNote>
      </main>
    )
  }

  /* ---- 3. THE START GATE ------------------------------------------------ */
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6"
      style={pageStyle}
    >
      <h1 className="sr-only">{`QuizOn! - ${WORLD.subtitle}`}</h1>
      <img
        src="/assets/brand/quizon-logo.png"
        alt=""
        width={160}
        height={160}
        aria-hidden="true"
        className="h-[140px] w-[140px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
      />
      <div className="card-cream animate-feedback-spring w-full max-w-sm p-5 text-center">
        <p className="font-display text-[24px] leading-7 font-bold text-indigo">All set!</p>
        <p className="mt-1 text-[15px] leading-6 text-navy/80">
          {hasStarted
            ? 'Your helper is waiting. Pick up where you left off.'
            : 'Everything is ready. Your quest is waiting.'}
        </p>
        <button
          type="button"
          onClick={enterGame}
          className="btn-chunky mt-4 flex w-full items-center justify-center gap-2 bg-indigo px-5 py-3.5 text-[17px] text-cream"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v14l11-7z" />
          </svg>
          {hasStarted ? 'Continue playing' : 'Start playing'}
        </button>
      </div>
    </main>
  )
}
