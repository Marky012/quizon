import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE SYNC BADGE.

   ONE LINE, said plainly, about where the learner's record currently is.

   It exists because the old flow made the learner responsible for their
   record: press "Save my data", find the file, hand it to the teacher, and
   hope. That is a chain of three actions a Grade 5 child will not reliably
   complete, and it fails silently when it is skipped. The record now travels
   by itself, so the only thing left to tell the learner is the truth about
   whether it arrived.

   THE COPY RULES.

     - Never say "failed" in a way that sounds like the learner failed. A
       network error is not the child's problem and must not read as one.
     - Never promise a time. "When you are back online" is true; "in five
       minutes" is a promise the app cannot keep.
     - Say nothing at all when there is no class. A learner who was never
       given a code has nothing to wait for, and a line about syncing on
       every screen would be noise.
   =========================================================================== */

function relativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function SyncBadge({ className = '' }: { className?: string }) {
  const status = useGameStore((s) => s.syncStatus)
  const classCode = useGameStore((s) => s.classCode)
  const lastSyncedAt = useGameStore((s) => s.lastSyncedAt)

  if (!classCode) return null

  let icon = '✓'
  let text: string
  switch (status) {
    case 'synced':
      icon = '✓'
      text = lastSyncedAt
        ? `Your teacher can see your progress. Last sent ${relativeTime(lastSyncedAt, Date.now())}.`
        : 'Your teacher can see your progress.'
      break
    case 'syncing':
      icon = '↻'
      text = 'Sending your record to your teacher.'
      break
    case 'offline':
      icon = '⏳'
      text = 'Your work is saved. It will go to your teacher when this device is online.'
      break
    case 'pending':
      icon = '⏳'
      text = 'Your work is saved and waiting to be sent.'
      break
    case 'error':
      icon = '!'
      text = 'Your work is saved. It will try to send again.'
      break
    case 'disabled':
      // The build has no teacher dashboard attached. There is nothing to
      // promise, so say nothing.
      return null
    default:
      return null
  }

  return (
    <p
      className={`flex items-start gap-2 text-left text-[14px] leading-5 text-navy/80 ${className}`}
      role="status"
    >
      <span aria-hidden="true" className="font-bold text-turquoise">
        {icon}
      </span>
      <span>{text}</span>
    </p>
  )
}
