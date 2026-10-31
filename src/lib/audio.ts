/* ===========================================================================
   SOUND - synthesised effects plus one looping background track.

   Every effect is generated with the Web Audio API so the app keeps almost no
   media files. The one exception is the background music the education team
   chose. It is preloaded early and started on the first real gesture, because
   mobile browsers refuse to play audio before one.

   ONE SWITCH. `soundEnabled` in the store governs the effects, the music and
   the haptics together. A future update adds a volume slider; until then the
   music sits at a fixed, quiet level so it never competes with reading.

   THE WHOLE MODULE IS DEFENSIVE. Audio is the one thing that can throw on a
   device the designer never tested, so every entry point is wrapped and a
   failure degrades to silence rather than taking the quiz down with it.
   =========================================================================== */

let ctx: AudioContext | null = null
let unlocked = false

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx ??= new Ctor()
    // Mobile autoplay policy: a context starts suspended until a real gesture.
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Called from the first real tap. Safe to call repeatedly. */
export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true
  audio()
  startMusic()
}

/* --- background music ---------------------------------------------------- */

const MUSIC_SRC = '/assets/music/viacheslavstarostin-cute-pets-animals-music-382060.mp3'
/** Quiet on purpose: it sits under reading, never over it. */
const MUSIC_VOLUME = 0.22

let music: HTMLAudioElement | null = null

function musicElement(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  if (!music) {
    try {
      music = new Audio(MUSIC_SRC)
      music.loop = true
      music.preload = 'auto'
      music.volume = MUSIC_VOLUME
    } catch {
      return null
    }
  }
  return music
}

/**
 * Begin fetching the track immediately, without playing it.
 *
 * Called at boot so the music is one of the first assets in flight. Browsers
 * allow a silent preload before any gesture; they only block playback.
 */
export function preloadMusic(): void {
  musicElement()
}

let musicReadyPromise: Promise<void> | null = null

/** Resolves once the track can play. Never rejects: a missing file is silence. */
export function musicReady(): Promise<void> {
  const el = musicElement()
  if (!el) return Promise.resolve()
  if (el.readyState >= 2) return Promise.resolve()
  if (musicReadyPromise) return musicReadyPromise
  musicReadyPromise = new Promise<void>((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      el.removeEventListener('loadeddata', done)
      el.removeEventListener('error', done)
      resolve()
    }
    el.addEventListener('loadeddata', done)
    el.addEventListener('error', done)
    if (el.readyState >= 2) done()
  })
  return musicReadyPromise
}

/** Start (or resume) the loop. Never throws. */
export function startMusic(): void {
  if (!enabled) return
  const el = musicElement()
  if (!el || !el.paused) return
  try {
    const attempt = el.play()
    if (attempt) void attempt.catch(() => {})
  } catch {
    // Autoplay refused. The next real gesture calls unlockAudio again.
  }
}

/** Pause the loop, keeping the buffered file for when sound returns. */
function stopMusic(): void {
  try {
    music?.pause()
  } catch {
    // Nothing to pause.
  }
}

/** True when effects and music should actually be produced. */
let enabled = true
export function setSoundEnabled(on: boolean): void {
  enabled = on
  if (on) startMusic()
  else stopMusic()
}

/* --- every control gets a tick ------------------------------------------- */

let clickSoundsInstalled = false

/**
 * Play a quiet tick for any button, link or label, so no control is silent.
 *
 * Delegated on purpose: a new screen cannot forget it. Screens with their own
 * sound (a quiz option plays `select`, a correct answer plays `correct`) still
 * fire; the guard in `play` collapses the resulting double `tap`.
 */
export function installClickSounds(): void {
  if (clickSoundsInstalled || typeof document === 'undefined') return
  clickSoundsInstalled = true
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest(
        'button, a[href], [role="button"], label, input[type="checkbox"], input[type="radio"]',
      )
      if (!control) return
      if (control instanceof HTMLButtonElement && control.disabled) return
      play('tap')
    },
    true,
  )
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  gain: number,
): void {
  const a = audio()
  if (!a) return
  const osc = a.createOscillator()
  const amp = a.createGain()
  const t0 = a.currentTime + startOffset

  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  // A short ramp in and out. Without it an oscillator clicks, and a click in a
  // learning app reads as a malfunction.
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(amp).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

type Effect =
  | 'correct'
  | 'incorrect'
  | 'celebrate'
  | 'tap'
  | 'select'
  | 'locked'
  | 'unlock'
  | 'page'
  | 'star'

const N: Record<string, number> = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 }

let lastTapAt = 0

/**
 * Plays one effect. NEVER throws and never returns a promise the UI has to
 * await: sound must not be able to delay an answer being shown.
 */
export function play(effect: Effect): void {
  if (!enabled) return
  if (effect === 'tap') {
    // The global click tick and a screen's own tap can land together. One tick.
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (now - lastTapAt < 40) return
    lastTapAt = now
  }
  const a = audio()
  if (!a) return
  try {
    switch (effect) {
      case 'correct':
        tone(N.C5!, 0, 0.09, 'sine', 0.12)
        tone(N.E5!, 0.06, 0.09, 'sine', 0.12)
        tone(N.G5!, 0.12, 0.09, 'sine', 0.12)
        break
      case 'incorrect':
        // A soft "hmm", not a buzzer. 300 -> 200Hz.
        tone(300, 0, 0.2, 'sine', 0.08)
        tone(200, 0.02, 0.2, 'sine', 0.08)
        break
      case 'celebrate':
        tone(N.C5!, 0, 0.14, 'triangle', 0.12)
        tone(N.E5!, 0.13, 0.14, 'triangle', 0.12)
        tone(N.G5!, 0.26, 0.14, 'triangle', 0.12)
        tone(N.C6!, 0.4, 0.2, 'triangle', 0.12)
        break
      case 'tap':
        tone(1200, 0, 0.04, 'sine', 0.05)
        break
      case 'select':
        tone(880, 0, 0.03, 'sine', 0.04)
        break
      case 'locked':
        tone(140, 0, 0.15, 'sine', 0.09)
        break
      case 'unlock':
        tone(440, 0, 0.1, 'sine', 0.08)
        tone(660, 0.1, 0.18, 'sine', 0.08)
        break
      case 'page':
        tone(520, 0, 0.12, 'sine', 0.04)
        break
      case 'star':
        tone(N.G5!, 0, 0.1, 'sine', 0.09)
        tone(N.C6!, 0.05, 0.15, 'sine', 0.09)
        break
    }
  } catch {
    // Silence is the correct failure mode for audio.
  }
}

/** Haptic tick. No-op where unsupported, which is most desktop browsers. */
export function buzz(ms = 12): void {
  if (!enabled) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    // Not every browser exposes vibrate. Nothing to do.
  }
}