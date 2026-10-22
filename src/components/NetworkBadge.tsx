import { useEffect, useState } from 'react'

/* ===========================================================================
   THE NETWORK BADGE - one honest word about connectivity, in the header.

   `navigator.onLine` is a coarse signal: it reports whether the device has a
   network interface, not whether this app can reach anything, so a captive
   portal still reads "Online". That is the failure mode worth living with - the
   alternative is a periodic fetch, which spends battery and data answering a
   question the badge exists to answer at a glance.

   The app never gates play on this. Everything a learner does is local, so this
   is information, not permission: "Offline" is a normal state here, not an
   error. The events are the only source of change, because the alternative - a
   polling timer - would re-render the header every few seconds for a value that
   only ever changes on those two events.
   =========================================================================== */

export function NetworkBadge() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return (
    /* role="status" so the change is announced, not just painted: a learner
       watching the screen does not need it, but a screen-reader user gets the
       same information the colour and the dot carry. */
    <span
      role="status"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 font-display text-[13px] leading-5 text-indigo ${
        online ? 'bg-lime-soft' : 'bg-yellow'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${online ? 'bg-turquoise' : 'bg-navy'}`}
      />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
