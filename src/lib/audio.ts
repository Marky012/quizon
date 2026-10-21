/* ===========================================================================
   SOUND - synthesised, zero audio files (art bible section 12).

   Every effect is generated with the Web Audio API so the app keeps no media
   files and stays fully offline-capable. Background music is deliberately
   absent: it is distracting for a reading task and it is the classic source of
   "the teacher complained about the app". Sound effects on, music off.

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
  const a = audio()
  if (!a) return
  unlocked = true
}

/** True when effects should actually be produced. */
let enabled = true
export function setSoundEnabled(on: boolean): void {
  enabled = on
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

/**
 * Plays one effect. NEVER throws and never returns a promise the UI has to
 * await: sound must not be able to delay an answer being shown.
 */
export function play(effect: Effect): void {
  if (!enabled) return
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