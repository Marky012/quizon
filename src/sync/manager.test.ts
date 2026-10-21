import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { syncNow, __resetSyncForTests } from './manager'
import { clearPending, readPending } from './storage'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE MANAGER TESTS.

   The manager is the part that touches the network, so these tests are about
   the four things that can go wrong:

     1. Nothing is sent when the learner has not joined a class.
     2. Nothing is sent when the build has no endpoint, and saying so is
        not an error.
     3. A successful send marks the record as synced AND stamps the time.
     4. A failed send keeps the record on the device. The learner never
        loses work because the network was down.
   =========================================================================== */

function mockFetch(impl: (url: string, init: RequestInit) => Response | Promise<Response>) {
  return vi.fn(impl) as unknown as typeof fetch
}

describe('the sync manager', () => {
  beforeEach(() => {
    __resetSyncForTests()
    clearPending()
    localStorage.removeItem('quizon-sync-signature')
    useGameStore.getState().resetGame()
    useGameStore.getState().setSyncStatus('idle')
    vi.stubEnv('VITE_SYNC_ENDPOINT', 'https://sync.test/sync')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('sends nothing when the learner has not joined a class', async () => {
    const fetchImpl = mockFetch(() => new Response('{}', { status: 200 }))
    const ok = await syncNow({ fetchImpl })
    expect(ok).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(useGameStore.getState().syncStatus).toBe('idle')
  })

  it('sends nothing when the build has no endpoint, and says the feature is off', async () => {
    vi.stubEnv('VITE_SYNC_ENDPOINT', '')
    const fetchImpl = mockFetch(() => new Response('{}', { status: 200 }))
    useGameStore.getState().setClassCode('QZ4821')
    const ok = await syncNow({ fetchImpl })
    expect(ok).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(useGameStore.getState().syncStatus).toBe('disabled')
  })

  it('posts the record and stamps the time the teacher got it', async () => {
    const fetchImpl = mockFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    useGameStore.getState().setClassCode('QZ4821')
    useGameStore.getState().recordPreTest('text-type', 5, 5)

    const ok = await syncNow({ fetchImpl })
    expect(ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const call = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(String((call?.[1] as RequestInit).body))
    expect(body.classCode).toBe('QZ4821')
    expect(body.learnerCode).toBe(useGameStore.getState().learnerCode)
    expect(useGameStore.getState().syncStatus).toBe('synced')
    expect(useGameStore.getState().lastSyncedAt).not.toBeNull()
  })

  it('keeps the record on the device when the network fails', async () => {
    const fetchImpl = mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })
    useGameStore.getState().setClassCode('QZ4821')
    useGameStore.getState().recordPreTest('text-type', 5, 5)

    const ok = await syncNow({ fetchImpl })
    expect(ok).toBe(false)
    // The work is still on the device, and the learner has not lost it.
    expect(readPending()).not.toBeNull()
    expect(readPending()?.learnerCode).toBe(useGameStore.getState().learnerCode)
    expect(useGameStore.getState().lastSyncedAt).toBeNull()
  })

  it('does not send the same record twice', async () => {
    const fetchImpl = mockFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    useGameStore.getState().setClassCode('QZ4821')
    useGameStore.getState().recordPreTest('text-type', 5, 5)

    await syncNow({ fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await syncNow({ fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('sends again once the learner has done something new', async () => {
    const fetchImpl = mockFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    useGameStore.getState().setClassCode('QZ4821')
    useGameStore.getState().recordPreTest('text-type', 5, 5)
    await syncNow({ fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    // A new lesson finished. That is worth reporting.
    useGameStore.getState().completeLesson('purpose')
    await syncNow({ fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
})
