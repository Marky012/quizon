import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { play } from '@/lib/audio'
import { useAppBack } from '@/lib/appBack'
import { MAX_FULL_NAME, MAX_NICKNAME } from '@/constants/gameConfig'
import { useGameStore, type PlayerGender } from '@/store/gameStore'

/* ===========================================================================
   PROFILE - the pupil chooses WHO they are, WHAT they are called officially,
   and WHAT the game calls them. Once, before the intro.

   THREE PANELS, THREE JOBS, and the order is the order of the questions:
   which character, then the official name, then the nickname. The easy
   no-reading choice comes first, and the two typing steps come after it, so
   a child who cannot read "girl" still recognises the picture and can get
   past the first screen.

   TWO NAMES, AND THEY ARE NOT THE SAME THING. This is the important part of
   the screen, so it is worth being blunt about it:

     THE FULL NAME is the official record. It is the name on the attendance
     sheet, the one the teacher reads off the dashboard and matches to a face
     in the classroom. It travels to the teacher dashboard and nowhere else.

     THE NICKNAME is the in-game alias. It is what the app calls the learner
     while they play. It NEVER leaves the device: the sync payload is built
     without it and a test asserts its absence.

   Before 2026-10-22 this screen asked for ONE name and refused to send it
   anywhere, because the app's original privacy posture was that no name ever
   travels and the anonymous learner code was the only identifier. That
   posture is unchanged for the nickname and for everything else in the
   record - the full name is the one deliberate exception, and it was made
   because a teacher cannot act on "BAL-47".

   THE FULL NAME NEEDS AT LEAST TWO WORDS. A single first name does not
   identify a child in a class of thirty, which is the whole point of asking,
   so the button stays disabled until there is a first name AND a last name.
   The hint under the field says so before the child types anything.

   THE NICKNAME IS PRE-FILLED with the first name, so the common case is one
   tap on "Let's go!" and the child never has to think about it. Clearing it
   falls back to the first name rather than leaving the learner nameless.
   =========================================================================== */

const CHARACTERS: ReadonlyArray<{ id: PlayerGender; label: string; src: string }> = [
  { id: 'girl', label: 'Girl', src: '/assets/players/girl.svg' },
  { id: 'boy', label: 'Boy', src: '/assets/players/boy.svg' },
]

/** First name and last name. A single word is not an identification. */
function words(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean)
}

export function Profile() {
  const navigate = useNavigate()
  const backToWelcome = useAppBack('/welcome')
  const createProfile = useGameStore((s) => s.createProfile)
  const hasStarted = useGameStore((s) => s.hasStarted)
  const profileCreated = useGameStore((s) => s.profileCreated)

  const [gender, setGender] = useState<PlayerGender | null>(null)
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [panel, setPanel] = useState<0 | 1 | 2>(0)

  /* One-way door, mirroring Boot exactly: Profile is the current step only when
     the learner has started and has not yet made a profile. Either condition
     being off means a stale deep link (or a URL typed past Welcome), so hand it
     to Boot - it already knows whether Welcome or the hub is the right stop. */
  if (!hasStarted || profileCreated) return <Navigate to="/" replace />

  const chosen = CHARACTERS.find((c) => c.id === gender)
  const nameParts = words(fullName)
  const fullNameReady = nameParts.length >= 2
  const firstName = nameParts[0] ?? ''
  /* The nickname falls back to the first name, so the learner can never end
     up with nothing to be called. */
  const finalNickname = nickname.trim() || firstName
  const nicknameReady = finalNickname.length > 0

  /* A short beat so the tap that picked a character is felt before the panel
     swaps - the same 220ms feedback Welcome uses when its big button fires. */
  function toFullName() {
    if (!gender) return
    play('tap')
    window.setTimeout(() => setPanel(1), 220)
  }

  function toNickname() {
    if (!fullNameReady) return
    play('tap')
    /* Pre-fill with the first name. The child can shorten it to "Mia" or
       leave it as "Maria" - both are one tap away from done. */
    setNickname((n) => n || firstName)
    window.setTimeout(() => setPanel(2), 220)
  }

  function confirm() {
    if (!gender || !fullNameReady || !nicknameReady) return
    play('unlock')
    createProfile(gender, fullName, finalNickname)
    navigate('/intro')
  }

  const titles = ['Who are you?', 'Your full name', 'Your nickname']
  const subtitles = [
    'Pick the player you want to be.',
    /* SHORT ON PURPOSE. The header subtitle is a single truncated line, and
       "This is how your teacher knows whose work this is" was cut off after
       "whose...". The full explanation lives in the card below the field, so
       the subtitle only has to say what to do. */
    'Type your first and last name.',
    'This is what the game calls you.',
  ]

  return (
    <ScreenFrame
      title={titles[panel]}
      subtitle={subtitles[panel]}
      onBack={panel === 0 ? backToWelcome : () => setPanel((panel - 1) as 0 | 1 | 2)}
      bar={
        panel === 0 ? (
          <button
            type="button"
            onClick={toFullName}
            disabled={chosen === undefined}
            className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
          >
            Next
          </button>
        ) : panel === 1 ? (
          <button
            type="button"
            onClick={toNickname}
            disabled={!fullNameReady}
            className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={!nicknameReady}
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
      ) : panel === 1 ? (
        /* --- PANEL 1: the official name. The chosen player is above the
            field so the name is attached to a face the child already picked. --- */
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
                You are the <span className="font-extrabold">{chosen.label}</span>.
              </p>
            </div>
          )}

          <div className="card-cream p-4">
            <label
              htmlFor="full-name"
              className="font-display mb-1 block text-[20px] leading-6 font-extrabold text-indigo"
            >
              Your full name
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && fullNameReady) toNickname()
              }}
              autoFocus
              autoComplete="name"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={MAX_FULL_NAME}
              enterKeyHint="next"
              aria-label="Your full name"
              aria-describedby="full-name-hint"
              placeholder="First name and last name"
              className="w-full rounded-[14px] bg-cream px-4 py-3 font-display text-[20px] leading-7 text-indigo shadow-[inset_0_2px_0_0_rgba(26,43,76,0.1)] placeholder:text-indigo/35 focus:outline-3 focus:outline-[var(--color-focus)]"
            />
            {/* THE HINT IS LIVE, and it is the rule. The button stays disabled
                until there are two words, so the screen has to say what it is
                waiting for rather than just looking broken. */}
            <p id="full-name-hint" className="mt-2 text-sm leading-5 text-navy/80">
              {fullNameReady
                ? 'Your teacher will see this name.'
                : 'First name and last name, please.'}
            </p>
          </div>

          <p className="text-[14px] leading-5 text-navy/80">
            Only your teacher sees this. Other students never do.
          </p>
        </div>
      ) : (
        /* --- PANEL 2: the alias. Pre-filled with the first name, and the
            same face above it. --- */
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
                The app will call you <span className="font-extrabold">{finalNickname}</span>.
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
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nicknameReady) confirm()
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
              {nickname.length} / {MAX_NICKNAME} letters
            </p>
          </div>

          <p className="text-[14px] leading-5 text-navy/80">
            Your nickname stays on this device. Only your teacher sees your full name.
          </p>
        </div>
      )}
    </ScreenFrame>
  )
}
