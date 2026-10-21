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
}

interface Import {
  readonly env: ImportMetaEnv
}
