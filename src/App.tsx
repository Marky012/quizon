import { Suspense, useEffect, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DevFallback } from '@/components/RouteFallback'
import { SkyClouds } from '@/components/SkyClouds'
import { AppHistoryRecorder } from '@/lib/appBack'

import { Boot } from '@/screens/Boot'

import {
  ArenaRoute,
  HubRoute,
  IntroRoute,
  lazyRoute,
  PreTestRoute,
  ProfileRoute,
  QuizRoute,
  RecordRoute,
  ResultRoute,
  SettingsRoute,
  SkillLessonRoute,
  SkillsRoute,
  WelcomeRoute,
  type LazyRoute,
} from '@/lazyRoutes'

/* ===========================================================================
   THE DEV SCREEN INDEX - development only.

   A route table of every screen, plus presets that write a game state so the
   screens that need one can be reviewed without earning it first. See
   src/dev/bypass.ts for why a bypass is worth having at all.

   GUARDED, AND THE GUARD IS THE POINT. Vite replaces import.meta.env.DEV with a
   literal false in a production build, so DevRoute becomes null, the dynamic
   import below is unreachable, and the bundler drops it - there is no dev screen
   in a shipped bundle and no way to navigate to one. Do not move this behind a
   runtime check like a query parameter or localStorage flag: a value that is
   still false at runtime is not something the bundler can prove dead, and a
   QA tool that ships to a classroom is a QA tool a child can reach.
   =========================================================================== */
const DevRoute: LazyRoute | null = import.meta.env.DEV
  ? lazyRoute(
      () => import('@/dev/DevIndex').then((m) => ({ default: m.DevIndex })),
      DevFallback,
    )
  : null

/* ===========================================================================
   THE ROUTE TABLE (art bible 9).

   The shape of the app is a spine with two drill-downs off it, and the spine is
   the only thing that ever decides where a returning learner lands:

/  ->  Boot decides  ->  /welcome  ->  /profile  ->  /intro  ->  /hub
                                                                 |
                          +-------------+---------------+------+----------------+
                          |             |               |               |
                      /skills       /pups           /arena          /record
                          |             |               |
                     /skill/:id  /pretest/:id      /quiz/:level
                                       |               |
                                       +----> /result/:level

   TWO RULES ON THE TABLE.

    1. Boot is the only redirector. No screen navigates on mount except Welcome
       (which advances after a deliberate tap), Profile (which bounces a stale
       deep link to Boot once its one-way step is done) and Quiz/Result (which
       advance on a deliberate answer). If two components both redirect, a
       returning learner
       deep-links to a screen and gets bounced by whichever one mounted second.

       The three setup screens additionally ONE-WAY-DOOR themselves on mount,
       each keyed to its own slice of the spine flags - Welcome bounces once
       introCompleted, Profile once (profileCreated or !hasStarted), Intro
       unless it sits exactly between profileCreated and introCompleted. They
       all bounce to "/", never to a concrete screen: that keeps Boot as the
       single decision-maker while still stopping a typed URL from replaying or
       skipping a setup step.

   2. Every screen self-guards its own params. Quiz and Result render their own
      "no result for that level" message when :level is wrong, and Skills,
      SkillLesson and PreTest render "that does not exist" for a bad :id. They
      deliberately do NOT redirect for this, because a child who taps a stale
      link should be told what happened, not silently moved somewhere else.

   WHAT CODE SPLITTING CHANGED HERE, and the one thing to be careful about.

   Each screen is now a separate chunk fetched on first visit, behind a
   Suspense boundary. Two consequences for anyone editing this file:

     - A route that is NOT wrapped in a Suspense boundary will freeze the entire
       app while it loads, because the nearest boundary is above it. The
       <Suspense> below is deliberately per-route rather than around <Routes>
       so a slow screen suspends only itself.
     - The ErrorBoundary is likewise per-route. Wrapping all routes in one
       boundary would mean a bug in Record blanks Pups too.
   =========================================================================== */

/**
 * Scroll to the top AND move focus, on every navigation.
 *
 * Scrolling alone was not enough. A keyboard or screen-reader learner who
 * navigates from the Arena to a Quiz is still, focus-wise, standing on the
 * Arena: their next Tab press continues from a link that no longer exists, and
 * a screen reader reads nothing at all, because the document never changed in a
 * way it announces.
 *
 * Focus goes to the <h1> of the new screen, so the heading is what gets read.
 * ScreenFrame gives the h1 tabIndex={-1} for this - programmatically focusable,
 * but not in the tab order, because a child should never Tab onto a heading.
 *
 * WHY AN OBSERVER INSTEAD OF A TIMER. The obvious implementations both fail:
 * a requestAnimationFrame fires before the lazy chunk has resolved and finds no
 * h1 at all, and a fixed setTimeout is a race that will be wrong again the day
 * a screen grows. Watching for the heading to actually appear is correct
 * however long the network takes, and it costs one observer per navigation.
 */
function RouteChangeEffects() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)

    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>('main h1, header h1')
      if (heading) {
        // preventScroll: the scroll reset above already put us at the top, and
        // letting focus scroll again can drag the page past the sticky header.
        heading.focus({ preventScroll: true })
        return true
      }
      return false
    }

    if (focusHeading()) return

    const observer = new MutationObserver(() => {
      if (focusHeading()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Stop watching if the heading somehow never turns up, so a long session
    // does not accumulate observers on every navigation.
    const stop = window.setTimeout(() => observer.disconnect(), 8000)

    return () => {
      observer.disconnect()
      window.clearTimeout(stop)
    }
  }, [pathname])

  return null
}

/** Renders a lazy route inside its own Suspense + error boundary pair. */
function LazyScreen({ route: r }: { route: LazyRoute }) {
  const Component = r.component as ComponentType
  return (
    <ErrorBoundary>
      <Suspense fallback={<r.fallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

function NotFound() {
  return (
    <ScreenFrame title="QuizOn!">
      <p className="card-cream p-4 text-indigo">
        That page does not exist. Go back to the hub and pick a stage.
      </p>
    </ScreenFrame>
  )
}

export function App() {
  return (
    <BrowserRouter>
      {/* Records where the learner has been, so the header back button can go
          to the previous screen of THIS app. Must sit inside the Router to read
          the location. See lib/appBack.ts. */}
      <AppHistoryRecorder />
      <RouteChangeEffects />
      {/* The drifting sky. Fixed and z-index -1, so it sits on the backdrop
          and behind every screen: no screen ever has to know it is there. */}
      <SkyClouds />
      {/* Boot is intentionally outside the lazy table: it is the first render
          on every visit and the only screen guaranteed to be cached. */}
      <Routes>
        <Route path="/" element={<Boot />} />

        <Route path="/welcome" element={<LazyScreen route={WelcomeRoute} />} />
        <Route path="/profile" element={<LazyScreen route={ProfileRoute} />} />
        <Route path="/intro" element={<LazyScreen route={IntroRoute} />} />
        <Route path="/hub" element={<LazyScreen route={HubRoute} />} />

        <Route path="/skills" element={<LazyScreen route={SkillsRoute} />} />
        <Route path="/skill/:id" element={<LazyScreen route={SkillLessonRoute} />} />
        <Route path="/pretest/:id" element={<LazyScreen route={PreTestRoute} />} />

        <Route path="/arena" element={<LazyScreen route={ArenaRoute} />} />
        <Route path="/quiz/:level" element={<LazyScreen route={QuizRoute} />} />
        <Route path="/result/:level" element={<LazyScreen route={ResultRoute} />} />
        <Route path="/record" element={<LazyScreen route={RecordRoute} />} />
        <Route path="/settings" element={<LazyScreen route={SettingsRoute} />} />

        {/* Legacy paths from before the 2026-10-03 renames. Kept so an old
            bookmark or a teacher's printed handout still lands somewhere real
            instead of on the not-found screen. */}
        <Route path="/challenges" element={<Navigate to="/arena" replace />} />
        {/* Used to point at /pups, which no longer exists. The pack now sits on
            the Hub's grass bench, so that is where the old link belongs. */}
        <Route path="/bantayan" element={<Navigate to="/hub" replace />} />
        <Route path="/pups" element={<Navigate to="/hub" replace />} />
        <Route path="/progress" element={<Navigate to="/record" replace />} />

        {/* Dev only. Renders nothing in a production build - see DevRoute above. */}
        {DevRoute && <Route path="/dev" element={<LazyScreen route={DevRoute} />} />}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}