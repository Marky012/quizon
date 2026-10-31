import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NetworkBadge } from '@/components/NetworkBadge'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { SyncBadge } from '@/components/SyncBadge'
import { FEATURES, ROADMAP } from '@/constants/features'
import { play } from '@/lib/audio'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { WORLD } from '@/content/world'
import { useGameStore } from '@/store/gameStore'
import { formatClassCode, isValidClassCode, normalizeClassCode } from '@/sync/classCode'
import { syncNow } from '@/sync/manager'
import { syncConfigured } from '@/sync/client'

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

   THE HEADER CARRIES THE NETWORK BADGE, right of the title. It is small on
   purpose: this app plays entirely offline, so being offline is a normal state
   and the badge is reassurance, not a warning.
   =========================================================================== */

/* THE CLASS LINK IS CLOSED WHILE THE TEACHER SIDE IS REBUILT. The flag lives
   in constants/features.ts so every roadmap item opens from one place. The
   form and its handlers are kept behind it rather than deleted, so reopening is
   one line and the deliberately-careful copy (typed offline, nothing to
   remember) is not lost. */

export function Settings() {
  const navigate = useNavigate()
  const back = useBack()
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const playerFullName = useGameStore((s) => s.playerFullName)
  const playerNickname = useGameStore((s) => s.playerNickname)
  const classCode = useGameStore((s) => s.classCode)
  const setClassCode = useGameStore((s) => s.setClassCode)
  const reduced = useReducedMotion()
  const [codeInput, setCodeInput] = useState('')

  /* Whether this build can sync at all.
     A build with no teacher dashboard attached must not show a class code
     box: a learner who types a code into a screen that can never do
     anything with it has been told a lie by the interface. */
  const canSync = syncConfigured()

  function joinClass() {
    const code = normalizeClassCode(codeInput)
    if (!isValidClassCode(code)) return
    setClassCode(code)
    setCodeInput('')
    play('unlock')
    void syncNow()
  }

  function leaveClass() {
    setClassCode(null)
    play('tap')
  }

  return (
    <ScreenFrame title="Settings" onBack={back} headerRight={<NetworkBadge />}>
      <ul className="flex flex-col gap-3">
        <li className="card-cream p-4">
          <button
            type="button"
            onClick={() => {
              /* main.tsx subscribes to the store and pushes every change into
                 audio.ts, so this only has to flip the store. The confirmation
                 tick is played here because turning sound ON must be audible. */
              const next = !soundEnabled
              toggleSound()
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
                {soundEnabled ? 'Music & effects on' : 'Music & effects off'}
              </span>
              <span className="block text-[12px] leading-4 text-navy/60">
                Volume slider coming soon.
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

        <li className="card-cream p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-[19px] leading-6 text-indigo">Your profile</p>
              <p className="mt-1 text-[14px] leading-5 text-navy/80">
                {playerFullName || 'No name yet.'}
                {playerNickname ? ` — called ${playerNickname}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-pill bg-yellow px-3 py-1 font-display text-[13px] leading-5 text-indigo">
              Coming soon
            </span>
          </div>
          <p className="mt-2 text-[14px] leading-5 text-navy/80">
            {FEATURES.profileEdit
              ? 'Change your name and nickname here.'
              : 'Changing your name and nickname is coming soon.'}
          </p>
        </li>

        <li className="card-cream p-4">
          <p className="font-display text-[19px] leading-6 text-indigo">What&apos;s next</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {ROADMAP.map((item) => (
              <li
                key={item}
                className="flex items-center justify-between gap-3 text-[14px] leading-5 text-navy/80"
              >
                <span>{item}</span>
                <span className="shrink-0 rounded-pill bg-yellow px-2.5 py-0.5 font-display text-[12px] leading-5 text-indigo">
                  Coming soon
                </span>
              </li>
            ))}
          </ul>
        </li>

        {/* THE CLASS LINK.

            The teacher creates a class and gets a short code. The learner
            types it once, here, and from then on the device sends its
            record on its own whenever it can reach the network. No file, no
            hand-off, nothing for a child to remember.

            THE CODE CAN BE TYPED OFFLINE. It is six characters of text, so
            it can be written on the board and copied in with no signal at
            all. The record waits on the device and goes when the teacher
            opens the hotspot. */}
        {canSync &&
          (FEATURES.teacherSync ? (
            <li className="card-cream p-4">
              <p className="font-display text-[19px] leading-6 text-indigo">Sync to your class</p>

              {classCode === null ? (
                <>
                  <p className="mt-1 text-[14px] leading-5 text-navy/80">
                    Your teacher will give you a class code. Type it here and your teacher can see
                    how you are doing. You can still play without a code.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <label htmlFor="class-code" className="text-[14px] text-navy/80">
                      Class code
                    </label>
                    <input
                      id="class-code"
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isValidClassCode(codeInput)) joinClass()
                      }}
                      autoComplete="off"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={7}
                      enterKeyHint="done"
                      aria-label="Class code from your teacher"
                      placeholder="QZ-4821"
                      className="w-full rounded-[14px] bg-cream px-4 py-3 font-display text-[22px] leading-7 text-indigo shadow-[inset_0_2px_0_0_rgba(26,43,76,0.1)] placeholder:text-indigo/35 focus:outline-3 focus:outline-[var(--color-focus)]"
                    />
                    <button
                      type="button"
                      onClick={joinClass}
                      disabled={!isValidClassCode(codeInput)}
                      className="btn-chunky w-full bg-turquoise py-3 text-on-turquoise"
                    >
                      Join class
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-[14px] leading-5 text-navy/80">
                    This device sends its record to class{' '}
                    <span className="font-bold text-indigo">{formatClassCode(classCode)}</span>.
                  </p>
                  <div className="mt-2">
                    <SyncBadge />
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        play('tap')
                        void syncNow()
                      }}
                      className="btn-chunky flex-1 bg-yellow py-3 text-indigo"
                    >
                      Send now
                    </button>
                    <button
                      type="button"
                      onClick={leaveClass}
                      className="btn-chunky flex-1 bg-white py-3 text-indigo"
                      style={{ backgroundColor: 'var(--color-cream)' }}
                    >
                      Leave class
                    </button>
                  </div>
                </>
              )}
            </li>
          ) : (
            /* WHAT A CHILD SEES INSTEAD. No input and no code: just the truth
               about where this is up to, and the promise that nothing depends
               on it. The badge is a word, not a button - there is nothing here
               to press, so there is nothing to dead-tap. */
            <li className="card-cream p-4">
              <p className="font-display text-[19px] leading-6 text-indigo">Sync to your class</p>
              <p className="mt-1 text-[14px] leading-5 text-navy/80">
                Your teacher will be able to see your progress here once it is ready. For now,
                everything you do is saved on this device.
              </p>
              <p className="mt-3 inline-flex items-center rounded-pill bg-yellow px-3 py-1 font-display text-[14px] leading-5 text-indigo">
                Under development
              </p>
            </li>
          ))}

        {/* The learner code card was removed 2026-10-05. The code is still
            generated and still used by the sync record, but it is hidden from
            the interface until the teacher workflow is designed. See
            Welcome.tsx. */}
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
