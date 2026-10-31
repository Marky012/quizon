/// <reference types="vite/client" />

/**
 * The one build-time knob the sync feature has.
 *
 * EMPTY MEANS THE FEATURE IS OFF. The app then plays exactly as it did
 * before, and nothing reaches for the network. That is deliberate: a build
 * that ships to a school with no teacher dashboard must not fail, must not
 * retry, and must not show a broken status.
 */
interface ImportMetaEnv {
  readonly VITE_SYNC_ENDPOINT?: string
  /**
   * Turns on the /dev screen index in an otherwise production build. Set only
   * on the devmode Netlify site; never on the learner site.
   */
  readonly VITE_DEV_MODE?: string
}

interface Import {
  readonly env: ImportMetaEnv
}
