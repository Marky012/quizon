import { useEffect, useState } from 'react'
import { play } from '@/lib/audio'
import { promptInstall, subscribeInstall } from '@/lib/install'

/* ===========================================================================
   THE INSTALL BUTTON.

   THE OFFER, IN THE APP'S OWN WORDS. The browser's own offer is a menu item
   called "Install QuizOn!", which is good, and it is also buried three taps
   deep in a menu that also has bookmarks, history and print. This button is
   the same offer, said out loud on a screen the child is already looking at.

   WHY THE COPY SAYS "INSTALL" AND NOT "DOWNLOAD". Downloading something means
   getting a file. Installing means getting an app that opens from the home
   screen and works with no signal - which is what the school actually needs,
   and what the second line promises. The download arrow in the icon says
   "downloading" to anyone who reads icons; the word says what happens.

   WHY IT IS INDIGO AND NOT TURQUOISE. Turquoise is the app's primary action
   colour, and on the welcome screen the primary action is "Start the quest!".
   An install button in the same colour as the button that starts the game
   reads as a second "Start the quest!". Indigo with cream text is the strongest
   pairing the palette allows (art bible 2.3) and it says "this is a different
   thing".

   IT IS A CARD, NOT A LOOSE BUTTON. The offer is one thing, with a reason
   under it, so it is one panel: a cream card holding the indigo button and
   the line that explains it. Floating on the page it read as a stray button.

   WHY IT DISAPPEARS AFTER ONE TAP. The browser's install event is spent once
   it is used. The offer comes back on the next launch, which is the next
   page load, and that is the browser's rule rather than this app's.
   =========================================================================== */

export function InstallButton({ className = '' }: { className?: string }) {
  const [available, setAvailable] = useState(false)

  useEffect(() => subscribeInstall(setAvailable), [])

  if (!available) return null

  return (
    <div className={`card-cream p-3 ${className}`}>
      <button
        type="button"
        onClick={() => {
          play('tap')
          void promptInstall()
        }}
        className="btn-chunky flex w-full items-center justify-center gap-2 bg-indigo px-5 py-3 text-[16px] text-cream"
      >
        {/* A download arrow into a line. Drawn here rather than taken from the
            icon set because the icon folder has not landed, and every other
            icon in the app is drawn inline the same way. */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v11" />
          <path d="M7 10l5 5 5-5" />
          <path d="M4 19h16" />
        </svg>
        Install QuizOn! on this device
      </button>
      {/* The reason it is worth doing, in one line. Reassuring, never
          technical (art bible, panel 01). */}
      <p className="mt-2 text-center text-[13px] leading-4 text-navy/75">
        Then it opens like an app, and works with no signal.
      </p>
    </div>
  )
}
