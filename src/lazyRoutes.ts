import { lazy, type ComponentType } from 'react'
import {
  ArenaFallback,
  HubFallback,
  IntroFallback,
  PreTestFallback,
  ProfileFallback,
  QuizFallback,
  RecordFallback,
  ResultFallback,
  SettingsFallback,
  SkillLessonFallback,
  SkillsFallback,
  WelcomeFallback,
} from '@/components/RouteFallback'

/* ===========================================================================
   THE LAZY ROUTE TABLE.

   The problem this solves. Every screen used to be imported eagerly into one
   bundle, so a learner on a first visit downloaded the entire app - the full
   360-question bank, all eleven screens, the print and export machinery -
   before seeing a single word. Measured at 683kB. The split goes at the route
   boundary, because that is where the app genuinely diverges.

   TWO THINGS WORTH KNOWING BEFORE EDITING THIS FILE.

   1. BOOT IS EAGER, AND EVERY OTHER SCREEN IS NOT. Boot is the first thing
      rendered on every single visit. Making it lazy would mean fetching a chunk
      in order to decide which chunk to fetch next: two round trips before the
      learner sees anything, and it would break the offline case, because the one
      screen guaranteed to be in the cache is the one screen that cannot afford
      to wait on a fetch that has already failed. Boot's own dependencies come
      along in the main chunk, so keeping it eager costs nothing extra.

   2. THE SCREENS USE NAMED EXPORTS, AND React.lazy NEEDS A DEFAULT. Every
      screen in this codebase is `export function Quiz()`, not
      `export default function Quiz()`. So each loader maps the namespace object
      to `{ default: ... }`. Writing `lazy(() => import('@/screens/Quiz'))`
      compiles cleanly and then fails at render time with "Element type is
      invalid", which is a genuinely baffling error to debug - hence the explicit
      mapping everywhere below.

   A ROUTE CARRIES ITS OWN FALLBACK. The third field of LazyRoute is the
   skeleton that stands in for this specific screen while its chunk arrives -
   see components/RouteFallback.tsx for why one shared fallback was wrong.
   Fallbacks live in the main chunk (they are what renders before the lazy code
   exists), so they must not import the screens themselves: the cycle would put
   every screen back in the entry bundle. Helpers from components/, lib/,
   store/, content/ and constants/ are safe; other screens are not.
   =========================================================================== */

export interface LazyRoute {
  component: ComponentType
  /** Fetch this screen's chunk before it is needed. Safe to call repeatedly. */
  prefetch: () => Promise<void>
  /** This screen's own skeleton, rendered inside <Suspense> while it loads. */
  fallback: ComponentType
}

/** Exported so the dev-only screen index can be wrapped the same way as every
 *  product route. App.tsx registers it behind import.meta.env.DEV. */
export function lazyRoute(
  load: () => Promise<{ default: ComponentType }>,
  fallback: ComponentType,
): LazyRoute {
  const Component = lazy(load)
  return {
    component: Component,
    // Calls the loader directly rather than reaching for any `.preload` API.
    // The bundler's module registry dedupes concurrent calls, so a prefetch
    // that lands before navigation is simply reused by React.lazy, and one
    // that is still in flight is awaited rather than restarted.
    prefetch: () => load().then(
      () => undefined,
      // A failed prefetch is not an error worth surfacing: the real navigation
      // will hit the same failure and be handled by the error boundary with a
      // message a learner can act on.
      () => undefined,
    ),
    fallback,
  }
}

/* --- the spine ------------------------------------------------------------ */

/* Boot is NOT here. It is imported directly by App.tsx and stays in the main
   chunk: see note 1 above. Everything after Boot is lazy. */

export const WelcomeRoute = lazyRoute(
  () => import('@/screens/Welcome').then((m) => ({ default: m.Welcome })),
  WelcomeFallback,
)
export const ProfileRoute = lazyRoute(
  () => import('@/screens/Profile').then((m) => ({ default: m.Profile })),
  ProfileFallback,
)
export const IntroRoute = lazyRoute(
  () => import('@/screens/Intro').then((m) => ({ default: m.Intro })),
  IntroFallback,
)
export const HubRoute = lazyRoute(
  () => import('@/screens/Hub').then((m) => ({ default: m.Hub })),
  HubFallback,
)

/* --- skills --------------------------------------------------------------- */

export const SkillsRoute = lazyRoute(
  () => import('@/screens/Skills').then((m) => ({ default: m.Skills })),
  SkillsFallback,
)
export const SkillLessonRoute = lazyRoute(
  () => import('@/screens/SkillLesson').then((m) => ({ default: m.SkillLesson })),
  SkillLessonFallback,
)
export const PreTestRoute = lazyRoute(
  () => import('@/screens/PreTest').then((m) => ({ default: m.PreTest })),
  PreTestFallback,
)

/* --- arena ---------------------------------------------------------------- */

export const ArenaRoute = lazyRoute(
  () => import('@/screens/Arena').then((m) => ({ default: m.Arena })),
  ArenaFallback,
)
export const QuizRoute = lazyRoute(
  () => import('@/screens/Quiz').then((m) => ({ default: m.Quiz })),
  QuizFallback,
)
export const ResultRoute = lazyRoute(
  () => import('@/screens/Result').then((m) => ({ default: m.Result })),
  ResultFallback,
)
export const RecordRoute = lazyRoute(
  () => import('@/screens/Record').then((m) => ({ default: m.Record })),
  RecordFallback,
)
export const SettingsRoute = lazyRoute(
  () => import('@/screens/Settings').then((m) => ({ default: m.Settings })),
  SettingsFallback,
)

/**
 * Eager on purpose, and imported directly by App rather than declared here.
 *
 * It is what a stale bookmark or a mistyped URL lands on, and a not-found
 * screen that must fetch before it can explain itself is a confusing thing to
 * hand someone who only mistyped. It is two dozen lines.
 */

/* --- prefetching by destination -------------------------------------------- */

/** Static routes, keyed by the path a screen navigates to. */
const BY_PATH: Record<string, LazyRoute> = {
  '/welcome': WelcomeRoute,
  '/profile': ProfileRoute,
  '/intro': IntroRoute,
  '/hub': HubRoute,
  '/skills': SkillsRoute,
  '/arena': ArenaRoute,
  '/record': RecordRoute,
  '/settings': SettingsRoute,
}

/**
 * Routes with a parameter. Matched by segment rather than by regex so that
 * /quiz/hard and /quiz/medium both resolve to the same chunk, and an unknown
 * path like /quiz/ does not accidentally match.
 */
const BY_PREFIX: ReadonlyArray<readonly [string, LazyRoute]> = [
  ['/quiz/', QuizRoute],
  ['/result/', ResultRoute],
  ['/skill/', SkillLessonRoute],
  ['/pretest/', PreTestRoute],
]

/**
 * Fetch the chunk for a destination the learner has not navigated to yet.
 *
 * Called on pointer-enter and focus from the hub and arena cards. A child takes
 * a noticeable moment to move a thumb onto a card and press it, and that gap is
 * long enough to finish a fetch - so by the time the navigation commits the
 * code is usually already resident and the transition is instant. This is the
 * difference between code splitting being invisible and being a visible stutter.
 *
 * Takes a path rather than a route object so that screens holding a table of
 * destinations can call it directly with `stage.to` and not have to import the
 * route table at all.
 *
 * Unknown paths return silently. Prefetching is only ever an optimisation, so
 * there is nothing to report and nothing to fail.
 */
export function prefetchForPath(path: string): void {
  const exact = BY_PATH[path]
  if (exact) {
    void exact.prefetch()
    return
  }
  for (const [prefix, route] of BY_PREFIX) {
    if (path.startsWith(prefix) && path.length > prefix.length) {
      void route.prefetch()
      return
    }
  }
}
