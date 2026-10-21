import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenFrame } from '@/components/ScreenFrame'
import { STORAGE_KEY } from '@/store/gameStore'
import {
  applyDevPreset,
  DEV_GROUPS,
  DEV_PRESETS,
  DEV_SCREEN_COUNT,
  type DevPreset,
} from './bypass'

/* ===========================================================================
   THE SCREEN INDEX. Dev only, at /dev.

   A bypass is only useful if reaching a screen is one tap. Typing thirty URLs is
   not a review process, it is a chore that gets skipped, and the screens that get
   skipped are always the awkward ones - the empty bench, the locked trail, the
   bad-parameter copy.

   SO: every route is a button, and every preset is a button that writes a game
   state and then navigates. Reviewing "the Result screen for a learner who has
   failed three times" should be two taps, not a thought experiment.

   The presets run first in any real pass. A screen opened against the wrong
   state shows its guard instead of its content, which is a true thing about the
   screen but not a review of the screen.
   =========================================================================== */

export function DevIndex() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState<string | null>(null)
  const [applied, setApplied] = useState<string | null>(null)

  async function run(preset: DevPreset) {
    setBusy(preset.id)
    try {
      await applyDevPreset(preset.id)
      setApplied(preset.id)
      navigate(preset.lands)
    } finally {
      setBusy(null)
    }
  }

  return (
    <ScreenFrame
      title="Dev bypass"
      subtitle={`${DEV_SCREEN_COUNT} routes, ${DEV_PRESETS.length} state presets`}
      onBack={() => navigate('/')}
    >
      <div className="flex flex-col gap-5">
        <p className="card-cream p-3 text-[15px] leading-6 text-indigo">
          Nothing here reaches a production build. Pick a state first, then open a
          screen - a screen opened against the wrong state will show its lock
          message instead of its content.
        </p>

        {/* --- state presets ---------------------------------------------- */}
        <section>
          <h2 className="mb-2 font-display text-[20px] text-indigo">1. Set the state</h2>
          <div className="flex flex-col gap-2">
            {DEV_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={busy !== null}
                onClick={() => void run(preset)}
                className={`rounded-[16px] p-3 text-left shadow-[0_3px_0_0_rgb(26_43_76/0.15)] ${
                  applied === preset.id ? 'bg-lime-soft text-indigo' : 'bg-indigo text-cream'
                }`}
              >
                <span className="block font-bold">
                  {busy === preset.id ? 'Applying...' : preset.label}
                </span>
                <span className="block text-[14px] leading-5 opacity-90">{preset.note}</span>
                <span className="block text-[13px] opacity-70">lands on {preset.lands}</span>
              </button>
            ))}
          </div>
        </section>

        {/* --- routes ----------------------------------------------------- */}
        {DEV_GROUPS.map((group) => (
          <section key={group.group}>
            <h2 className="mb-2 font-display text-[20px] text-indigo">{group.group}</h2>
            <div className="flex flex-col gap-2">
              {group.screens.map((screen) => (
                <button
                  key={screen.path}
                  type="button"
                  onClick={() => navigate(screen.path)}
                  className="card-cream flex items-center gap-3 p-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-indigo">{screen.label}</span>
                    <span className="block text-[14px] leading-5 text-navy/85">
                      {screen.note}
                    </span>
                  </span>
                  <code className="shrink-0 text-[13px] text-navy/70">{screen.path}</code>
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* --- last resort ------------------------------------------------- */}
        <section className="card-cream p-3">
          <h2 className="mb-1 font-display text-[18px] text-indigo">Nuclear</h2>
          <p className="mb-2 text-[14px] leading-5 text-navy/85">
            Clears persisted state from localStorage and reloads. Use this when a
            preset has left something half-written.
          </p>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(STORAGE_KEY)
              window.location.reload()
            }}
            className="btn-chunky w-full bg-coral py-3 text-indigo"
          >
            Wipe saved progress
          </button>
        </section>
      </div>
    </ScreenFrame>
  )
}