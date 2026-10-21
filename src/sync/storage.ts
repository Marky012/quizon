import type { SyncPayload } from './types'

/* ===========================================================================
   THE PENDING SLOT.

   WHY ONE SLOT AND NOT A QUEUE. The payload is a full snapshot, so a second
   pending snapshot would strictly contain everything the first one contained.
   Keeping both would mean replaying stale states at the server for no
   benefit. One slot, newest wins, is the entire "queue".

   That also means the slot is self-healing: if a request is lost, the next
   one still carries the complete state, so a learner never has to wonder
   whether the teacher saw them.

   EVERY READ AND WRITE IS WRAPPED. A phone in private mode, a browser with
   storage disabled, or a full quota all throw on localStorage. A learner
   losing the ability to sync is a nuisance; a learner whose game crashes
   because sync could not write is a bug. Sync degrades, the game does not.
   =========================================================================== */

const DEVICE_KEY = 'quizon-device-id'
const PENDING_KEY = 'quizon-sync-pending'
const SIGNATURE_KEY = 'quizon-sync-signature'

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function removeRaw(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* Nothing to do. The slot is an optimisation, not a requirement. */
  }
}

/**
 * A stable id for this browser install.
 *
 * Used by the server to tell two devices apart when they share a learner
 * code, which happens whenever a child re-installs the app or a second
 * device is used. It is a random id, not a fingerprint: no screen size, no
 * platform, no hardware list. It says "this install", and nothing else.
 */
export function getDeviceId(): string {
  const existing = readRaw(DEVICE_KEY)
  if (existing) return existing
  const id = createId()
  writeRaw(DEVICE_KEY, id)
  return id
}

function createId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  // No randomUUID: older Android WebViews, and a few locked-down school
  // browsers. A timestamp plus randomness is good enough here, because this
  // id only has to be unique between two devices in the same class.
  return `d-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

/** The snapshot waiting to be sent, or null. */
export function readPending(): SyncPayload | null {
  const raw = readRaw(PENDING_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as SyncPayload) : null
  } catch {
    // Corrupt JSON. Drop it rather than crash on it: the next change to the
    // learner's progress rebuilds it from scratch.
    removeRaw(PENDING_KEY)
    return null
  }
}

export function writePending(payload: SyncPayload): void {
  writeRaw(PENDING_KEY, JSON.stringify(payload))
}

export function clearPending(): void {
  removeRaw(PENDING_KEY)
}

/**
 * The progress signature as of the LAST SUCCESSFUL SYNC.
 *
 * Compared against the current signature to decide whether anything is worth
 * sending. It is written only after the server accepts the payload, so a
 * failed sync leaves the signature alone and the next attempt still tries.
 */
export function readSyncedSignature(): string | null {
  return readRaw(SIGNATURE_KEY)
}

export function writeSyncedSignature(signature: string): void {
  writeRaw(SIGNATURE_KEY, signature)
}

export function clearSyncedSignature(): void {
  removeRaw(SIGNATURE_KEY)
}
