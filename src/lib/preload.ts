import { PUP_BY_ID } from '@/content/manifest'
import { ALL_ROUTES } from '@/lazyRoutes'
import { musicReady } from '@/lib/audio'

/* ===========================================================================
   THE WARM-UP - what the boot screen is actually doing while the bar fills.

   WHY IT EXISTS. The app is code-split into twelve route chunks, and every
   navigation after the first goes through a Suspense boundary, so a learner
   would meet a skeleton on the way to Reading Trail, a skeleton on the way to
   a level, a skeleton on the way to their record. The art is worse: an <img>
   that has not arrived is a hole in the card it sits in. Both are fixed by
   doing the fetching BEFORE the learner asks for it, and the boot screen is
   the one moment in the game where waiting is expected rather than annoying.

   WHAT IS FETCHED.
     - the twelve route chunks, including the 260 kB question bank that lives
       inside the Quiz chunk. This is the biggest single win.
     - every art asset the app draws, DECODED rather than merely requested, so
       it paints in the frame it is needed.
     - the two web fonts, so no line of text reflows after the first paint.

   THE SERVICE WORKER IS PART OF THE WAIT IN PRODUCTION. Its precache is what
   makes the whole game work offline, so the download is not finished until
   the worker is ready. In development there is no worker, so that task is
   skipped rather than left to hang forever.

   WHAT IS NOT FETCHED AT ALL. The teacher's dashboard endpoint is never
   touched from here. A learner device with no class attached never reaches
   the network for it, and the sync manager keeps its own triggers and its own
   pending slot. See src/sync/manager.ts.

   THE PROGRESS IS REAL. Each task is one promise and the bar advances as they
   settle. A task that FAILS still advances it: a missing picture is a broken
   picture, not a reason to hold a child at a loading screen.
   =========================================================================== */

/**
 * How long the boot screen stays up even when everything is already cached.
 *
 * Without a floor, a warm start resolves the warm-up in about fifty
 * milliseconds and the logo flashes in and out, which reads as a glitch
 * rather than as a game opening. Seven hundred milliseconds is long enough
 * for the eye to land on the mark and short enough that a child does not
 * decide the app is broken.
 */
export const MIN_BOOT_MS = 700

/** How long the fonts get before they are given up on. */
const FONT_TIMEOUT_MS = 4000

/**
 * How long one file gets before it is given up on.
 *
 * Exists so a stalled request cannot hold the start button forever, not as a
 * shortcut: on a working connection a 4 MB track finishes well inside this.
 * The boot gate waits for every task to settle, one way or the other.
 */
const ASSET_TIMEOUT_MS = 20_000

/** The service worker precaches ~20 MB on a first visit. */
const SW_TIMEOUT_MS = 30_000

/**
 * The art the app draws.
 *
 * Every path here is one the app actually requests at runtime, so nothing in
 * this list is speculative. The two files that world.ts and Result.tsx point
 * at and that are NOT on disk are deliberately absent: fetching a missing file
 * would only prove it is missing.
 */
const ART: readonly string[] = [
  '/assets/brand/quizon-logo.png',
  '/assets/brand/logo-mark.svg',
  '/assets/world/app-backdrop.jpg',
  '/assets/world/cloud01.png',
  '/assets/world/cloud02.png',
  '/assets/world/grass.png',
  '/assets/hub/woof-school.png',
  '/assets/hub/reading-trail.png',
  '/assets/hub/your-record.png',
  '/assets/levels/easy.png',
  '/assets/levels/medium.png',
  '/assets/levels/hard.png',
  '/assets/players/boy.png',
  '/assets/players/girl.png',
  ...Object.keys(PUP_BY_ID).map((id) => `/assets/pups/${id}-avatar.png`),
  '/assets/teacher/teacher-idle.png',
  '/assets/teacher/teacher-happy.png',
  '/assets/teacher/teacher-support.png',
  '/assets/teacher/teacher-hint.png',
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

/**
 * Settle a task within a bound, success or failure.
 *
 * The boot gate waits for every task, so no single stalled request may keep
 * the start button off screen forever.
 */
function settle(task: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([task.then(() => undefined, () => undefined), delay(ms)])
}

/**
 * Fetch one image and DECODE it.
 *
 * decode() is the part that matters. A downloaded image still has to be
 * decoded on the main thread when the learner finally reaches the screen that
 * shows it, which is a visible hitch; a decoded one paints in the frame it is
 * asked for.
 *
 * Never rejects. A missing file settles as fast as a present one.
 */
function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Not every engine has decode(). A plain load is still better than
      // nothing, so the absence of it is not a reason to wait forever.
      if (typeof img.decode === 'function') img.decode().then(() => resolve(), () => resolve())
      else resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * The fonts, settled.
 *
 * They come from a CDN, so they get a timeout: a school wifi that is up for
 * the app's own files can still be blocking fonts.googleapis.com.
 */
function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve()
  try {
    // Ask for the two families explicitly. The boot screen is the first thing
    // that renders, so the faces the app uses have to be requested before
    // anything else needs them.
    void document.fonts.load('800 24px "Baloo 2"')
    void document.fonts.load('700 16px "Nunito"')
  } catch {
    // A browser with no font loading API still renders with its fallback.
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined, () => undefined),
    delay(FONT_TIMEOUT_MS),
  ])
}

/**
 * The service worker.
 *
 * A boot task in production, and only in production. The app is offline-first
 * and that promise is kept by the worker's precache, which is why the download
 * is not finished until the worker is ready.
 *
 * In development there is no worker registered at all, so
 * navigator.serviceWorker.ready NEVER settles. That is why warmUp adds this
 * task behind import.meta.env.PROD instead of always waiting on it.
 */
function serviceWorkerReady(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve()
  }
  return navigator.serviceWorker.ready.then(() => undefined, () => undefined)
}

/** How far along the warm-up is. */
export interface WarmupProgress {
  done: number
  total: number
}

type Listener = (progress: WarmupProgress) => void

const listeners = new Set<Listener>()

/**
 * Watch the warm-up's progress.
 *
 * The listener set is module-level rather than a callback passed into the
 * run, because the run is a singleton: a second caller - React's StrictMode
 * double-invoke, or a re-mount - joins the run already in flight, and it has
 * to be able to hear about it too.
 */
export function subscribeWarmup(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function report(progress: WarmupProgress): void {
  for (const fn of listeners) fn(progress)
}

/**
 * Run a list of tasks and report progress as each one lands.
 *
 * Never rejects, and a failed task advances the bar exactly like a
 * successful one. Exported so the accounting can be tested without touching
 * the network.
 */
export function runTasks(
  tasks: Promise<unknown>[],
  onProgress: (progress: WarmupProgress) => void,
): Promise<void> {
  const total = tasks.length
  let done = 0
  onProgress({ done, total })
  return Promise.all(
    tasks.map((task) =>
      task.then(
        () => {
          done += 1
          onProgress({ done, total })
        },
        () => {
          done += 1
          onProgress({ done, total })
        },
      ),
    ),
  ).then(() => undefined)
}

/**
 * Fetch everything, all at once, and report progress as it arrives.
 *
 * Everything starts together. The bar is therefore a count of how many of the
 * pieces are ready, not a guess at how long the whole thing will take - which
 * is the only honest way to report progress when the tasks are concurrent and
 * of wildly different sizes.
 */
export function warmUp(): Promise<void> {
  const tasks: Promise<unknown>[] = [
    ...ALL_ROUTES.map((route) => settle(route.prefetch(), ASSET_TIMEOUT_MS)),
    ...ART.map((src) => settle(loadImage(src), ASSET_TIMEOUT_MS)),
    settle(fontsReady(), FONT_TIMEOUT_MS),
    settle(musicReady(), ASSET_TIMEOUT_MS),
  ]
  // The worker is where the offline copy lives. In dev there is none to wait
  // for, so the task is skipped rather than left to hang.
  if (import.meta.env.PROD) tasks.push(settle(serviceWorkerReady(), SW_TIMEOUT_MS))
  return runTasks(tasks, report)
}

let warmupPromise: Promise<void> | null = null
let warmupDone = false

/**
 * The warm-up, once per page load.
 *
 * The promise is kept at module scope so that a second call - StrictMode's
 * double-invoke, or a re-mount of the boot screen - joins the run already in
 * flight instead of starting a second one.
 */
export function startWarmup(): Promise<void> {
  if (warmupPromise) return warmupPromise
  const startedAt = Date.now()
  warmupPromise = warmUp()
    .then(() => undefined)
    .then(() => delay(Math.max(0, MIN_BOOT_MS - (Date.now() - startedAt))))
    .then(() => {
      warmupDone = true
    })
  return warmupPromise
}

/**
 * Has the warm-up already finished in this page load?
 *
 * The boot screen asks this on mount. When the answer is yes, the learner
 * has already been through the loading screen once and the app should move
 * straight on - a second pass through the same splash would be a loop, not a
 * greeting.
 */
export function isWarmupDone(): boolean {
  return warmupDone
}
