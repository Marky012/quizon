import { useGameStore } from '@/store/gameStore'
import { postPayload, syncConfigured, syncEndpoint, SyncError } from './client'
import { buildSyncPayload, progressSignature } from './payload'
import {
  clearPending,
  getDeviceId,
  readPending,
  readSyncedSignature,
  writePending,
  writeSyncedSignature,
} from './storage'
import type { SyncPayload } from './types'

/* ===========================================================================
   THE SYNC MANAGER.

   THE JOB. Get one snapshot of the learner's progress to the teacher's
   dashboard, at the right moment, without ever getting in the way of the
   game.

   THE SCENARIO THIS WAS BUILT FOR. A Grade 5 classroom in Barangay Quezon.
   The phones do not have data. The teacher brings a hotspot, opens it for
   ten minutes, and the class plays. During those ten minutes the devices
   should quietly send their records and then get out of the way. When the
   hotspot goes away, nothing should break, and nothing should be lost.

   THE FOUR TRIGGERS, AND WHY EACH ONE EXISTS.

     1. THE DEVICE CAME BACK ONLINE. The `online` event is the single most
        important trigger in the file. It fires the moment a hotspot appears
        and the device reconnects, which is exactly the moment the record
        needs to move.
     2. THE LEARNER DID SOMETHING WORTH REPORTING. A store subscription
        watches the progress signature, so finishing a lesson or a level
        schedules a send within seconds rather than at the next heartbeat.
     3. THE APP CAME BACK TO THE FRONT. A phone that was asleep in a pocket
        for an hour fires `visibilitychange` when it is picked up, and that
        is a good moment to flush what is pending.
     4. A HEARTBEAT. Every minute, if anything is pending, try again. This
        is the backstop for the case where the app was killed mid-sync and
        the browser never fired `online`.

   WHY THE SIGNATURE, AND NOT "ANY CHANGE". See progressSignature. Without
   it, every answer would be an upload, and a class of thirty children
   working through questions on one hotspot would saturate it.

   WHY NOTHING IS EVER AWAITED IN THE GAME. The manager never blocks a
   screen. It listens, it schedules, it posts in the background, and every
   failure path ends in "try again later" rather than in an error the
   learner can see.
   =========================================================================== */

/** How long to wait after a change before sending. Batches a burst of taps. */
const DEBOUNCE_MS = 2500

/** The heartbeat. One minute is short enough to be useful, long enough to be free. */
const HEARTBEAT_MS = 60_000

let started = false
let timer: number | null = null
let inFlight = false

/** Set by tests to avoid real network calls. */
export interface SyncOptions {
  fetchImpl?: typeof fetch
  now?: () => number
}

let options: SyncOptions = {}

/** The current progress signature, or null when there is no class to sync to. */
function currentSignature(): string | null {
  const s = useGameStore.getState()
  if (!s.classCode) return null
  return progressSignature({
    learnerCode: s.learnerCode,
    skills: s.skills,
    tiers: s.tiers,
    totals: s.totals,
  })
}

/** The payload for right now, or null when there is nothing to send. */
function currentPayload(now: number): SyncPayload | null {
  const s = useGameStore.getState()
  if (!s.classCode) return null
  const report = s.getStudentReport()
  return buildSyncPayload({
    classCode: s.classCode,
    learnerCode: s.learnerCode,
    deviceId: getDeviceId(),
    skills: s.skills,
    tiers: s.tiers,
    totals: s.totals,
    skillMissedCount: s.skillMissedCount,
    history: s.history,
    report,
    now,
  })
}

/**
 * Is there anything the server has not seen yet?
 *
 * Two ways to be behind: the pending slot is not empty, or the progress
 * signature moved since the last successful sync. The second case matters
 * because the app may have been closed before it could write the slot.
 */
function isDirty(): boolean {
  if (readPending()) return true
  const signature = currentSignature()
  if (!signature) return false
  return signature !== readSyncedSignature()
}

/**
 * Try to send the record. Safe to call at any time, from anywhere.
 *
 * Returns true when the server has the current state.
 *
 * The options exist so the tests can supply their own fetch. In the app
 * there is only one caller that cares, and it does not pass any.
 */
export async function syncNow(opts: SyncOptions = {}): Promise<boolean> {
  const store = useGameStore.getState()
  const fetchImpl = opts.fetchImpl ?? options.fetchImpl ?? fetch
  const now = opts.now ?? options.now ?? Date.now

  if (!syncConfigured()) {
    // No endpoint in this build. The feature is off, and the game does not
    // know or care.
    store.setSyncStatus('disabled')
    return false
  }
  if (!store.classCode) {
    store.setSyncStatus('idle')
    return false
  }
  if (inFlight) return false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    // Offline. Keep the slot, tell the UI, and wait for the `online` event.
    store.setSyncStatus('offline')
    return false
  }
  if (!isDirty()) {
    // Nothing new since the last successful sync. If there was one, the
    // learner is up to date and the badge should say so.
    const status = store.lastSyncedAt ? 'synced' : 'idle'
    store.setSyncStatus(status)
    return store.lastSyncedAt !== null
  }

  const payload = currentPayload(now())
  if (!payload) return false

  inFlight = true
  store.setSyncStatus('syncing')
  try {
    await postPayload(syncEndpoint(), payload, fetchImpl)
    // The server has it. Record the signature so we do not send it again
    // until something changes, and clear the slot.
    const signature = currentSignature()
    if (signature) writeSyncedSignature(signature)
    clearPending()
    useGameStore.getState().markSynced(now())
    return true
  } catch (err) {
    const retryable = err instanceof SyncError ? err.retryable : true
    const message = err instanceof Error ? err.message : 'Could not reach the server.'
    if (retryable) {
      // Keep the snapshot. The next trigger, or the next heartbeat, tries
      // again with the same or a newer payload.
      writePending(payload)
      useGameStore.getState().setSyncStatus('offline', message)
    } else {
      // The server will never accept this payload. Holding it would block
      // every future sync behind a payload that cannot succeed, so it is
      // dropped and the next change starts clean.
      clearPending()
      useGameStore.getState().setSyncStatus('error', message)
    }
    return false
  } finally {
    inFlight = false
  }
}

/** Schedule a send, batching bursts of changes into one request. */
function schedule(): void {
  if (timer !== null) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void syncNow()
  }, DEBOUNCE_MS) as unknown as number
}

/**
 * Start syncing. Call once, at app start.
 *
 * Safe to call more than once: the second call does nothing. The tests call
 * it repeatedly.
 */
export function startSync(opts: SyncOptions = {}): void {
  options = { ...options, ...opts }
  if (started) return
  started = true

  const store = useGameStore.getState()
  if (!syncConfigured()) {
    store.setSyncStatus('disabled')
  } else if (!store.classCode) {
    store.setSyncStatus('idle')
  } else {
    // There may be a snapshot from a session that ended before it could be
    // sent. Try it now.
    void syncNow()
  }

  // 1. The hotspot appeared.
  window.addEventListener('online', () => {
    void syncNow()
  })

  // 2. The learner did something worth reporting.
  let lastSignature = currentSignature()
  useGameStore.subscribe((s) => {
    if (!s.classCode) return
    const signature = progressSignature({ learnerCode: s.learnerCode, skills: s.skills, tiers: s.tiers, totals: s.totals })
    if (signature === lastSignature) return
    lastSignature = signature
    schedule()
  })

  // 3. The app came back to the front.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })

  // 4. The heartbeat.
  window.setInterval(() => {
    if (isDirty()) void syncNow()
  }, HEARTBEAT_MS)
}

/** Test seam: forget that sync was ever started. */
export function __resetSyncForTests(): void {
  started = false
  inFlight = false
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}
