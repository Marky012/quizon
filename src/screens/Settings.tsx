import { useNavigate } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { play, setSoundEnabled } from '@/lib/audio'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { WORLD } from '@/content/world'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   SETTINGS - reached from the gear button in the Hub header.

   IT EXISTS BECAUSE THE HEADER HAS A BUTTON. The gear was specified as part of
   the new Hub header, and a button that goes nowhere is worse than no button:
   the codebase already has a rule about this (art bible 7.1, "a locked stage
   never dead-taps"), and a gear that thuds and does nothing teaches a child that
   the app is partly broken. So it opens this.

   It is deliberately small. Sound is the only preference the app has, and
   `soundEnabled` was already in the store and already toggled from two other
   screens - this is the same toggle given a permanent home rather than a new
   setting invented to fill the space.

   REDUCED MOTION IS SHOWN, NOT SET. The app honours the OS setting via
   useReducedMotion, but the OS is where a Grade 5 learner's parents control
   that, not a toggle buried in a game. It is reported here so an adult reviewing
   the app can see it is being respected.
   =========================================================================== */

export function Settings() {
  const navigate = useNavigate()
  const back = useBack()
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const reduced = useReducedMotion()

  return (
    <ScreenFrame title="Settings" onBack={back}>
      <ul className="flex flex-col gap-3">
        <li className="card-cream p-4">
          <button
            type="button"
            onClick={() => {
              /* The store is the source of truth, but audio.ts keeps its own
                 module-level flag and nothing else pushes the change into it -
                 Arena and Record read the flag and re-render, they do not set it.
                 Without this the button would move the label and change nothing
                 audible. */
              const next = !soundEnabled
              toggleSound()
              setSoundEnabled(next)
              if (next) play('tap')
            }}
            aria-pressed={soundEnabled}
            className="flex w-full items-center gap-3 text-left"
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-turquoise text-[22px] text-on-turquoise shadow-[inset_0_-5px_0_0_rgb(26_43_76/0.15)]"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[19px] leading-6 text-indigo">Sound</span>
              <span className="block text-[14px] leading-5 text-navy/80">
                {soundEnabled ? 'Sound on' : 'Sound off'}
              </span>
            </span>
          </button>
        </li>

        <li className="card-cream p-4">
          <p className="font-display text-[19px] leading-6 text-indigo">Motion</p>
          <p className="mt-1 text-[14px] leading-5 text-navy/80">
            {reduced
              ? 'Reduced motion is on in your device settings, so animation is off.'
              : 'Animation follows your device settings.'}
          </p>
        </li>

        {/* The learner code card that was here was removed 2026-10-05. The code
            is still generated and still used in the export filename and the
            printed record - it is only hidden from the interface until the
            teacher workflow is designed. See Welcome.tsx. */}
      </ul>

      <button
        type="button"
        onClick={() => {
          play('tap')
          navigate('/hub')
        }}
        className="btn-chunky mt-4 w-full bg-turquoise py-4 text-on-turquoise"
      >
        Back to {WORLD.gameName}
      </button>
    </ScreenFrame>
  )
}