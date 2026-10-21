import { useNavigate } from 'react-router-dom'
import { play } from '@/lib/audio'
import { prefetchForPath } from '@/lazyRoutes'

/* ===========================================================================
   SETTINGS BUTTON - the gear that opens /settings.

   ONE COMPONENT, TWO HEADERS. It first lived inline in the Hub's brand strip.
   The Reading Trail header now needs the identical control, and the gear is a
   long SVG path that would be a mistake to keep in two files.

   THE BUTTON IS LAYOUT-NEUTRAL. It ships the control and nothing else; callers
   set its size and placement through `className`, because the Hub centres it in
   a 72px grid track while the Reading Trail sits it at the end of ScreenFrame's
   ordinary header row.

   THE ICON IS A DRAWN GEAR, not the ⚙ character. The character's glyph box is
   centred on the font's baseline, which in Baloo's fallback for U+2699 does not
   sit dead in a square button, and the offset moved with the button's size. An
   SVG viewBox is centred by definition, so the cog is optically centred at any
   size.
   =========================================================================== */

export function SettingsButton({
  className = '',
  label = 'Settings',
}: {
  className?: string
  label?: string
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        play('tap')
        navigate('/settings')
      }}
      onPointerEnter={() => prefetchForPath('/settings')}
      onFocus={() => prefetchForPath('/settings')}
      aria-label={label}
      className={`btn-chunky grid shrink-0 place-items-center bg-turquoise text-on-turquoise ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="h-7 w-7">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    </button>
  )
}