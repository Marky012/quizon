import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { play } from '@/lib/audio'
import { useAppBack } from '@/lib/appBack'
import { useGameStore, type PlayerGender } from '@/store/gameStore'

/* ===========================================================================
   PROFILE - the pupil chooses WHO they are and WHAT they are called, once,
   before the intro. Standard games put character-gender before naming, and so
   does this screen: panel 0 picks the player (girl/boy), panel 1 asks for a
   nickname and shows the chosen player so the name has a face.

   TWO COLUMNS, TWO PANELS. The two characters are side by side and need no
   reading to pick (a child who cannot read the word "girl" still recognises
   the picture). The nickname is a real text field, so it is the second, warm
   step - the harder action happens after the easy one, and the chosen avatar
   sits right above the field.

   PRIVACY STAYS. playerName is display-only: the store deliberately does not
   export it to the teacher report (see createProfile in gameStore.ts), so the
   learner-code anonymity posture survives a feature that now knows a name.
   =========================================================================== */

export const MAX_NICKNAME = 12

const CHARACTERS: ReadonlyArray<{ id: PlayerGender; label: string; src: string }> = [
  { id: 'girl', label: 'Girl', src: '/assets/players/girl.svg' },
  { id: 'boy', label: 'Boy', src: '/assets/players/boy.svg' },
]

export function Profile() {
  const navigate = useNavigate()
  const backToWelcome = useAppBack('/welcome')
  const createProfile = useGameStore((s) => s.createProfile)
  const hasStarted = useGameStore((s) => s.hasStarted)
  const profileCreated = useGameStore((s) => s.profileCreated)

  const [gender, setGender] = useState<PlayerGender | null>(null)
  const [name, setName] = useState('')
  const [panel, setPanel] = useState<0 | 1>(0)

  /* One-way door, mirroring Boot exactly: Profile is the current step only when
     the learner has started and has not yet made a profile. Either condition
     being off means a stale deep link (or a URL typed past Welcome), so hand it
     to Boot - it already knows whether Welcome or the hub is the right stop. */
  if (!hasStarted || profileCreated) return <Navigate to="/" replace />

  const chosen = CHARACTERS.find((c) => c.id === gender)
  const readyToName = gender !== null
  const nameReady = name.trim().length > 0

  /* A short beat so the tap that picked a character is felt before the panel
     swaps - the same 220ms feedback Welcome uses when its big button fires. */
  function toName() {
    if (!gender) return
    play('tap')
    window.setTimeout(() => setPanel(1), 220)
  }

  function confirm() {
    if (!gender || !nameReady) return
    play('unlock')
    createProfile(gender, name)
    navigate('/intro')
  }

  return (
    <ScreenFrame
      title={panel === 0 ? 'Who are you?' : 'What is your nickname?'}
      subtitle={panel === 0 ? 'Pick the player you want to be.' : 'Now give yourself a name.'}
      onBack={panel === 0 ? backToWelcome : () => setPanel(0)}
      bar={
        panel === 0 ? (
          <button
            type="button"
            onClick={toName}
            disabled={!readyToName}
            className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={!nameReady}
            className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
          >
            Let&apos;s go!
          </button>
        )
      }
    >
      {panel === 0 ? (
        /* --- PANEL 0: choose a player. Two picture buttons, one selection.
            The active card takes the Hub's turquoise fill plus a yellow ring
            and a check, so the pick survives even when shirt and card are the
            same colour. --- */
        <div className="grid grid-cols-2 gap-3">
          {CHARACTERS.map((c) => {
            const active = gender === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  play('select')
                  setGender(c.id)
                }}
                aria-pressed={active}
                aria-label={`Play as ${c.label}`}
                className={`relative flex flex-col items-center gap-2 rounded-[20px] p-4 pt-4 shadow-[0_4px_0_0_rgba(26,43,76,0.15)] transition-transform duration-150 active:scale-95 ${
                  active ? 'bg-turquoise ring-4 ring-yellow' : 'bg-cream'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo text-[12px] font-bold text-cream"
                  >
                    ✓
                  </span>
                )}
                <img
                  src={c.src}
                  alt=""
                  aria-hidden="true"
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px]"
                />
                <span
                  className={`font-display text-[18px] leading-6 font-extrabold ${
                    active ? 'text-on-turquoise' : 'text-indigo'
                  }`}
                >
                  {c.label}
                </span>
                <span className="sr-only">{active ? 'Selected' : ''}</span>
              </button>
            )
          })}
        </div>
      ) : (
        /* --- PANEL 1: the nickname, with the chosen player above the field so
            the name is attached to a face the child already picked. --- */
        <div className="flex flex-col gap-4">
          {chosen && (
            <div className="card-cream flex items-center gap-3 p-4">
              <img
                src={chosen.src}
                alt=""
                aria-hidden="true"
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0"
              />
              <p className="text-[15px] leading-5 text-indigo">
                You are the <span className="font-extrabold">{chosen.label}</span>. The app will
                call you by your nickname.
              </p>
            </div>
          )}

          <div className="card-cream p-4">
            <label
              htmlFor="nickname"
              className="font-display mb-1 block text-[20px] leading-6 font-extrabold text-indigo"
            >
              Your nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameReady) confirm()
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={MAX_NICKNAME}
              enterKeyHint="done"
              aria-label="Your nickname"
              placeholder="e.g. Gab or Mia"
              className="w-full rounded-[14px] bg-cream px-4 py-3 font-display text-[22px] leading-7 text-indigo shadow-[inset_0_2px_0_0_rgba(26,43,76,0.1)] placeholder:text-indigo/35 focus:outline-3 focus:outline-[var(--color-focus)]"
            />
            <p className="mt-2 text-sm text-navy/80">
              {name.length} / {MAX_NICKNAME} letters
            </p>
          </div>
        </div>
      )}
    </ScreenFrame>
  )
}