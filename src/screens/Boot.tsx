import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ProgressBar } from '@/components/ScreenFrame'
import { LoadingNote } from '@/components/Skeleton'
import { WORLD } from '@/content/world'
import { play } from '@/lib/audio'
import {
  installAvailable,
  installOfferAnswered,
  markInstallOfferAnswered,
  promptInstall,
  subscribeInstall,
} from '@/lib/install'
import { isWarmupDone, subscribeWarmup, startWarmup } from '@/lib/preload'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE BOOT SCREEN.

   What this screen used to be: a redirector. It read three flags out of the
   store and sent the learner to the right screen, and it did it instantly,
   because the only thing that had to happen before the paint was reading
   persisted state, and zustand's localStorage rehydration is synchronous.

   What it is now: the loading screen, and the warm-up behind it.

   WHY THE WARM-UP LIVES HERE AND NOT IN THE BACKGROUND. Every screen after
   this one is code-split, so every navigation the learner makes would
   otherwise land on a skeleton while its chunk arrives, and every image
   would arrive as a hole in the card it sits in. The boot screen is the one
   moment in the game where a bar is expected rather than annoying, so the
   fetching happens here and nowhere else. See lib/preload.ts for what is
   fetched and why.

   THE SCREEN RUNS ONCE PER PAGE LOAD. Not once per visit to this route.
   Welcome, Profile and Intro all bounce to "/" when they are done with the
   setup spine, and a returning learner who types "/" lands here too - so if
   the splash ran on every visit, the first-run experience would show the
   loading screen three times in a row. lib/preload.ts remembers whether the
   warm-up has already run in this page load, and when it has, this screen
   redirects straight through.

   THE ORDER OF THE TWO CHECKS BELOW MATTERS. The splash renders until the
   warm-up is done, and only then does the destination decision happen. It
   was the other way round before - the decision was first and immediate - and
   that is exactly why the bar could never appear: a first-time learner has
   hasStarted === false, so the old screen redirected to /welcome before it
   had drawn anything.
   =========================================================================== */

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
  const hasStarted = useGameStore((s) => s.hasStarted)
  const profileCreated = useGameStore((s) => s.profileCreated)
  const introCompleted = useGameStore((s) => s.introCompleted)

  const [pct, setPct] = useState(0)
  const [ready, setReady] = useState(isWarmupDone)
  const [tip, setTip] = useState(0)
  const [canInstall, setCanInstall] = useState(installAvailable)
  const [offerClosed, setOfferClosed] = useState(false)

  useEffect(() => subscribeInstall(setCanInstall), [])

  useEffect(() => {
    // Already warmed up in this page load: this is an internal bounce back to
    // the spine, not a fresh launch, so there is nothing to show.
    if (isWarmupDone()) return
    const unsubscribe = subscribeWarmup((p) => {
      setPct(Math.round((p.done / p.total) * 100))
    })
    void startWarmup().then(() => {
      setPct(100)
      setReady(true)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const id = globalThis.setInterval(() => {
      setTip((t) => (t + 1) % TIPS.length)
    }, TIP_MS)
    return () => globalThis.clearInterval(id)
  }, [])

  /* THE FIRST-RUN INSTALL OFFER. After the bar hits 100% the app used to
     redirect instantly, so the install button never had a moment on screen.
     Now, once, if the browser can install the app and the learner has not
     answered before, we stop here and ask: install, or carry on in the
     browser. Either answer is remembered. */
  const showOffer = ready && canInstall && !offerClosed && !installOfferAnswered()

  function answerOffer(install: boolean) {
    play('tap')
    markInstallOfferAnswered()
    if (install) void promptInstall().finally(() => setOfferClosed(true))
    else setOfferClosed(true)
  }

  if (showOffer) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6"
        style={{
          paddingTop: 'max(24px, env(safe-area-inset-top))',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <h1 className="sr-only">{`Install QuizOn!`}</h1>
        <img
          src="/assets/brand/quizon-logo.png"
          alt=""
          width={160}
          height={160}
          aria-hidden="true"
          className="h-[140px] w-[140px] animate-float drop-shadow-[0_10px_0_rgba(26,43,76,0.45)]"
        />
        <div className="card-cream animate-feedback-spring w-full max-w-sm p-5 text-center">
          <p className="font-display text-[24px] leading-7 font-bold text-indigo">You are all set!</p>
          <p className="mt-1 text-[15px] leading-6 text-navy/80">
            Put QuizOn! on this device so it opens like an app and works with no signal.
          </p>
          <button
            type="button"
            onClick={() => answerOffer(true)}
            className="btn-chunky mt-4 flex w-full items-center justify-center gap-2 bg-indigo px-5 py-3.5 text-[17px] text-cream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v11" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
            Download the game
          </button>
          <button
            type="button"
            onClick={() => answerOffer(false)}
            className="mt-3 w-full rounded-button px-5 py-3 text-[15px] font-bold text-indigo underline decoration-indigo/30 underline-offset-4 transition-colors hover:bg-indigo-soft/60 active:scale-[0.98]"
          >
            Continue playing in browser
          </button>
        </div>
      </main>
    )
  }

  /* THE SPOKEN PATH. The screen shows until the warm-up is done, and only
     then does the app decide where the learner belongs. */
  if (ready) {
    if (!hasStarted) return <Navigate to="/welcome" replace />
    if (!profileCreated) return <Navigate to="/profile" replace />
    if (!introCompleted) return <Navigate to="/intro" replace />
    return <Navigate to="/hub" replace />
  }

  /* Announced four times, not once per percent. A live region that changes
     on every tick talks over the screen the learner is heading for. */
  const quarter = Math.floor(pct / 25)
  const spoken =
    quarter >= 4 ? 'Ready.' : quarter === 0 ? 'Getting QuizOn! ready.' : `Loading, ${quarter * 25} percent.`

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6"
      style={{
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      }}
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
            {pct >= 100 ? 'All set!' : 'Getting the game ready…'}
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

      {/* The install offer now lives on its own step after 100% (see showOffer). */}
    </main>
  )
}
