import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSyncPayload, MAX_MISSED_IDS, progressSignature } from './payload'
import { normalizeClassCode, formatClassCode, isValidClassCode } from './classCode'
import { getDeviceId, clearPending, readPending, writePending } from './storage'
import { postPayload, SyncError } from './client'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE SYNC TESTS.

   Three things have to be true for this feature to be worth shipping:

     1. THE NICKNAME NEVER LEAVES. The learner code is the only identifier
        that travels. This is a privacy rule, and a privacy rule that is not
        tested is a wish.
     2. A FAILURE NEVER COSTS THE LEARNER THEIR WORK. The pending slot
        survives an error, and a full payload means the next attempt is
        enough.
     3. THE APP DOES NOT TALK TO THE NETWORK FOR NOTHING. The progress
        signature is what decides, so it has to move on milestones and stay
        still in between.
   =========================================================================== */

const emptyReport = {
  learnerCode: 'AB-12',
  generatedAt: 0,
  overallPerformance: 'not_assessed' as const,
  averageScore: 0,
  totalAttempts: 0,
  completedLevels: 0,
  skills: [],
  tiers: {},
  skillsToFocus: [],
  recommendations: [],
  totals: { correct: 0, incorrect: 0 },
}

function samplePayload(overrides: Partial<Parameters<typeof buildSyncPayload>[0]> = {}) {
  return buildSyncPayload({
    classCode: 'QZ4821',
    learnerCode: 'AB-12',
    deviceId: 'device-1',
    skills: [],
    tiers: {},
    totals: { correct: 0, incorrect: 0 },
    skillMissedCount: {},
    history: [],
    report: emptyReport,
    now: 1_700_000_000_000,
    ...overrides,
  })
}

describe('the sync payload', () => {
  it('carries the class code, the learner code and the device id', () => {
    const payload = samplePayload()
    expect(payload.classCode).toBe('QZ4821')
    expect(payload.learnerCode).toBe('AB-12')
    expect(payload.deviceId).toBe('device-1')
    expect(payload.schemaVersion).toBe(1)
  })

  it('never carries a nickname, because there is no nickname in the input', () => {
    const payload = samplePayload()
    expect(JSON.stringify(payload)).not.toContain('Mia')
    expect(Object.keys(payload)).not.toContain('playerName')
    expect(Object.keys(payload)).not.toContain('playerGender')
  })

  it('sends the missed items, deduped, newest first, and capped', () => {
    const history = [
      { questionId: 'q1', correct: false, timestamp: 1 },
      { questionId: 'q2', correct: true, timestamp: 2 },
      { questionId: 'q1', correct: false, timestamp: 3 },
      { questionId: 'q3', correct: false, timestamp: 4 },
    ]
    const payload = samplePayload({ history })
    expect(payload.missedQuestionIds).toEqual(['q3', 'q1'])
    expect(payload.missedQuestionIds).not.toContain('q2')
  })

  it('caps the missed list so a long install cannot grow the payload forever', () => {
    const history = Array.from({ length: 200 }, (_, i) => ({
      questionId: `q${i}`,
      correct: false,
      timestamp: i,
    }))
    const payload = samplePayload({ history })
    expect(payload.missedQuestionIds.length).toBe(MAX_MISSED_IDS)
    // Newest kept, oldest dropped.
    expect(payload.missedQuestionIds[0]).toBe('q199')
  })

  it('carries the teacher flags the dashboard needs', () => {
    const payload = samplePayload({
      tiers: {
        easy: { needsAttention: true, hintUsed: true, storyId: 'T3' },
      },
    })
    expect(payload.tierFlags.easy).toEqual({
      needsAttention: true,
      hintUsed: true,
      storyId: 'T3',
    })
  })
})

describe('the progress signature', () => {
  const base = {
    learnerCode: 'AB-12',
    skills: [{ id: 'text-type', lessonComplete: false, pupEarned: false, pupUses: 0, bestPreTestScore: 0 }],
    tiers: { easy: { attempts: 0, bestScore: 0, needsAttention: false, hintUsed: false, storyId: null } },
    totals: { correct: 0, incorrect: 0 },
  }

  it('does not move for a single answer, so answering does not spam the network', () => {
    const before = progressSignature(base)
    const after = progressSignature({ ...base, totals: { correct: 1, incorrect: 0 } })
    expect(after).toBe(before)
  })

  it('moves once ten answers have been given, so a stuck learner is still seen', () => {
    const before = progressSignature(base)
    const after = progressSignature({ ...base, totals: { correct: 10, incorrect: 0 } })
    expect(after).not.toBe(before)
  })

  it('moves when a lesson is finished', () => {
    const before = progressSignature(base)
    const after = progressSignature({
      ...base,
      skills: [{ ...base.skills[0]!, lessonComplete: true }],
    })
    expect(after).not.toBe(before)
  })

  it('moves when a level is attempted', () => {
    const before = progressSignature(base)
    const after = progressSignature({
      ...base,
      tiers: { easy: { ...base.tiers.easy!, attempts: 1, bestScore: 80 } },
    })
    expect(after).not.toBe(before)
  })

  it('moves when the LEARNER changes, so a new child on a reused device is sent', () => {
    // The bug this guards: a teacher hands the tablet to the next child.
    // The new child has done nothing, the old child had also done nothing,
    // and without the learner code in the signature the app decided there
    // was nothing to send. The new child never appeared on the dashboard.
    const before = progressSignature(base)
    const after = progressSignature({ ...base, learnerCode: 'CD-34' })
    expect(after).not.toBe(before)
  })
})

describe('the class code', () => {
  it('ignores case, spaces and dashes', () => {
    expect(normalizeClassCode('qz-4821')).toBe('QZ4821')
    expect(normalizeClassCode('qz 4821')).toBe('QZ4821')
    expect(normalizeClassCode('QZ4821')).toBe('QZ4821')
  })

  it('reads as a dashed code on a whiteboard', () => {
    expect(formatClassCode('QZ4821')).toBe('QZ-4821')
  })

  it('rejects a code that is not six characters', () => {
    expect(isValidClassCode('QZ48')).toBe(false)
    expect(isValidClassCode('QZ4821')).toBe(true)
  })
})

describe('the pending slot', () => {
  beforeEach(() => {
    clearPending()
  })

  it('keeps a snapshot until it is cleared', () => {
    const payload = samplePayload()
    writePending(payload)
    expect(readPending()).not.toBeNull()
    expect(readPending()?.learnerCode).toBe('AB-12')
    clearPending()
    expect(readPending()).toBeNull()
  })

  it('survives a corrupt value instead of throwing', () => {
    localStorage.setItem('quizon-sync-pending', '{not json')
    expect(readPending()).toBeNull()
  })

  it('gives the same device id every time', () => {
    expect(getDeviceId()).toBe(getDeviceId())
  })
})

describe('the request', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts the payload as JSON and accepts a 200', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const res = await postPayload('https://example.test/sync', samplePayload(), fetchImpl as never)
    expect(res.ok).toBe(true)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }]
    expect(url).toBe('https://example.test/sync')
    expect(init.method).toBe('POST')
    expect(init.headers['content-type']).toContain('application/json')
    expect(JSON.parse(String(init.body)).learnerCode).toBe('AB-12')
  })

  it('treats a 500 as retryable, so the record is not thrown away', async () => {
    const fetchImpl = vi.fn(async () => new Response('boom', { status: 500 }))
    await expect(
      postPayload('https://example.test/sync', samplePayload(), fetchImpl as never),
    ).rejects.toMatchObject({ retryable: true })
  })

  it('treats a 400 as final, because retrying it can never work', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: 'bad class' }), { status: 400 }))
    await expect(
      postPayload('https://example.test/sync', samplePayload(), fetchImpl as never),
    ).rejects.toMatchObject({ retryable: false })
  })

  it('reports a network failure as retryable', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const err = await postPayload('https://example.test/sync', samplePayload(), fetchImpl as never).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(SyncError)
    expect((err as SyncError).retryable).toBe(true)
  })
})

describe('the class link in the store', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('normalises the code the learner typed', () => {
    useGameStore.getState().setClassCode('qz-4821')
    expect(useGameStore.getState().classCode).toBe('QZ4821')
  })

  it('survives a game reset, because the class belongs to the device', () => {
    useGameStore.getState().setClassCode('QZ4821')
    useGameStore.getState().resetGame()
    expect(useGameStore.getState().classCode).toBe('QZ4821')
  })

  it('clears the link when the learner leaves the class', () => {
    useGameStore.getState().setClassCode('QZ4821')
    useGameStore.getState().setClassCode(null)
    expect(useGameStore.getState().classCode).toBeNull()
  })
})
