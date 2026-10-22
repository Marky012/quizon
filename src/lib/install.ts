/* ===========================================================================
   THE INSTALL PROMPT.

   WHAT THIS IS. Chrome's own "install this app" offer, caught and held so the
   app can put it somewhere a nine-year-old will actually notice. Without this,
   the only way to install QuizOn! is to find the browser's own menu - which is
   three taps deep in a menu that also has bookmarks, history and print, and
   which a child will not go looking through.

   WHY IT IS CAPTURED RATHER THAN USED IN PLACE. The event fires once per page
   load, and only while the page is running. If nothing is listening at that
   moment, it is gone for good - the browser will not fire it a second time on
   the same page. So the event is caught here, at startup, and held.

   WHY THE CAPTURE IS CALLED FROM main.tsx AND NOT AT MODULE LEVEL. A module
   with a side effect on import is the kind of thing that gets imported by a
   test and quietly attaches a listener to the window. One explicit call at
   startup is the same guarantee with none of the surprise. See main.tsx.

   WHY IT IS NOT OFFERED ON EVERY SCREEN. The prompt is a decision the child
   makes once, at the moment they arrive, and it competes with everything else
   on the screen it appears on. So it appears in two places only: the boot
   screen, where the app is opening and there is nothing else to do, and the
   welcome screen, where the child is choosing a helper and has time to think
   about it. It is never in the way of the quiz.
   =========================================================================== */

/**
 * The shape of the event Chrome fires. It is not in the DOM lib yet, so it is
 * declared here rather than pulled from a types package.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferred: BeforeInstallPromptEvent | null = null
let available = false

const listeners = new Set<(available: boolean) => void>()

function notify(): void {
  for (const fn of listeners) fn(available)
}

/**
 * Start listening for the browser's install offer.
 *
 * Safe to call more than once: the second call does nothing, because the
 * listener is only attached the first time.
 */
let capturing = false
export function captureInstallPrompt(): void {
  if (capturing) return
  capturing = true
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (event) => {
    // preventDefault() is the whole point: without it the browser shows its
    // own mini-infobar, and the app never gets to show the offer in its own
    // time and place.
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    available = true
    notify()
  })

  window.addEventListener('appinstalled', () => {
    // It is installed. There is nothing left to offer.
    deferred = null
    available = false
    notify()
  })
}

/**
 * Watch whether an install offer is available.
 *
 * The callback fires immediately with the current answer if there already is
 * one, so a caller does not have to ask and then subscribe.
 */
export function subscribeInstall(fn: (available: boolean) => void): () => void {
  listeners.add(fn)
  if (available) fn(true)
  return () => {
    listeners.delete(fn)
  }
}

/** Is there an install offer to make right now? */
export function installAvailable(): boolean {
  return available
}

/**
 * Show the browser's install dialog.
 *
 * The event is spent once it is used - the browser will not let the same
 * event prompt twice - so it is cleared whether the child accepted or
 * dismissed. A child who dismisses it gets the offer again on the next
 * launch, which is how browsers behave anyway.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const event = deferred
  deferred = null
  available = false
  notify()
  try {
    await event.prompt()
    const choice = await event.userChoice
    return choice.outcome
  } catch {
    // A browser that refuses to show the dialog. The offer is gone either
    // way, so the button goes away and nothing breaks.
    return 'unavailable'
  }
}

/** Test seam: pretend the browser made an offer. */
export function __setInstallPromptForTests(value: BeforeInstallPromptEvent | null): void {
  deferred = value
  available = value !== null
  notify()
}
