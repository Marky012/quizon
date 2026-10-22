import type { HistoryEntry } from '@/logic/select'
import type { StudentReport } from '@/logic/scoring'
import { SYNC_APP, SYNC_SCHEMA_VERSION, type SyncPayload, type SyncSkill, type SyncTierFlag } from './types'

/* ===========================================================================
   BUILDING THE PAYLOAD.

   A PURE FUNCTION. It takes the state it needs and returns the document. It
   does not read the store, does not touch localStorage, and does not know
   whether the device is online. That is what makes it testable, and the
   privacy rule below is worth a test of its own.
   =========================================================================== */

export interface PayloadInput {
  classCode: string
  learnerCode: string
  /**
   * The official name. The ONE human identifier in the document.
   *
   * It is trimmed and capped here rather than trusted from the store, because
   * this is the last place before the wire and the field is free text typed
   * by a child on a phone keyboard.
   */
  fullName: string
  deviceId: string
  skills: SyncSkill[]
  tiers: Record<string, { needsAttention: boolean; hintUsed: boolean; storyId: string | null }>
  totals: { correct: number; incorrect: number }
  skillMissedCount: Record<string, number>
  history: readonly HistoryEntry[]
  report: StudentReport
  now: number
}

/**
 * The official name, cleaned up for the wire.
 *
 * Whitespace is collapsed so a phone keyboard's stray double spaces do not
 * turn "Maria  Santos" into a different name from "Maria Santos", and it is
 * capped so a paste of an entire novel cannot land in a dashboard cell.
 */
export function normalizeFullName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 60)
}

/**
 * How many missed item ids travel.
 *
 * The history ring buffer holds 200 answers. Sending every miss would make
 * the payload grow with the session for no gain: a learner who missed the
 * same item three times needs it recorded once. 50 is well above the number
 * of distinct items a learner can miss in one sitting, so the cap only bites
 * on a long-running install, and it keeps the document small.
 */
export const MAX_MISSED_IDS = 50

export function buildSyncPayload(input: PayloadInput): SyncPayload {
  const missed: string[] = []
  const seen = new Set<string>()
  // Newest first, so if the cap bites we keep the most recent misses and drop
  // the oldest, which is the opposite of what a queue would do and exactly
  // what a teacher wants: the recent struggle is the one to talk about.
  for (let i = input.history.length - 1; i >= 0; i--) {
    const entry = input.history[i]
    if (!entry || entry.correct) continue
    if (seen.has(entry.questionId)) continue
    seen.add(entry.questionId)
    missed.push(entry.questionId)
    if (missed.length >= MAX_MISSED_IDS) break
  }

  const tierFlags: Record<string, SyncTierFlag> = {}
  for (const [id, tier] of Object.entries(input.tiers)) {
    tierFlags[id] = {
      needsAttention: tier.needsAttention,
      hintUsed: tier.hintUsed,
      storyId: tier.storyId,
    }
  }

  return {
    app: SYNC_APP,
    schemaVersion: SYNC_SCHEMA_VERSION,
    classCode: input.classCode.trim().toUpperCase(),
    learnerCode: input.learnerCode,
    fullName: normalizeFullName(input.fullName),
    deviceId: input.deviceId,
    sentAt: input.now,
    skills: input.skills,
    tierFlags,
    totals: input.totals,
    skillMissedCount: input.skillMissedCount,
    missedQuestionIds: missed,
    report: input.report,
  }
}

/**
 * THE PROGRESS SIGNATURE: one string that says "has anything worth sending
 * changed since the last successful sync?"
 *
 * This is what keeps the app from talking to the network on every tap. The
 * naive version of this would include the answer totals, which change on
 * every single answer, and a learner working through twenty questions would
 * cause twenty uploads over a school hotspot. Instead the signature only
 * moves on things a teacher would want to see:
 *
 *   - a lesson finished, a pup earned, a pup called
 *   - a level attempted, passed, failed, or flagged
 *   - every TEN answers, so a learner who is stuck in a long run still
 *     appears on the dashboard before the period ends
 *
 * The answer counter is divided rather than rounded so the bucket only moves
 * when it should.
 */
export function progressSignature(input: {
  learnerCode: string
  /** The official name. See the note on the field itself. */
  fullName: string
  skills: { id: string; lessonComplete: boolean; pupEarned: boolean; pupUses: number; bestPreTestScore: number }[]
  tiers: Record<
    string,
    {
      attempts: number | readonly unknown[]
      bestScore: number
      needsAttention: boolean
      hintUsed: boolean
      storyId: string | null
    }
  >
  totals: { correct: number; incorrect: number }
}): string {
  return JSON.stringify({
    // THE LEARNER CODE IS PART OF THE SIGNATURE, and it has to be.
    //
    // A teacher hands the same tablet to the next child, and the app gives
    // that child a new learner code. If the signature did not include it,
    // a new child who had done nothing yet would have the SAME signature as
    // the previous child who had also done nothing, so the app would decide
    // there was nothing to send, and the new child would never appear on the
    // teacher's dashboard at all.
    learner: input.learnerCode,
    // THE OFFICIAL NAME IS PART OF THE SIGNATURE TOO, for the same reason the
    // learner code is: the record on the dashboard has to be able to change
    // when the name changes. Without it, a device that synced before the
    // learner had typed their name would decide there was "nothing new to
    // send" and the teacher would never see the name at all - the one field
    // the dashboard exists to show.
    name: input.fullName,
    skills: input.skills.map((k) => [k.id, k.lessonComplete, k.pupEarned, k.pupUses, k.bestPreTestScore]),
    tiers: Object.entries(input.tiers).map(([id, t]) => [
      id,
      typeof t.attempts === 'number' ? t.attempts : t.attempts.length,
      t.bestScore,
      t.needsAttention,
      t.hintUsed,
      t.storyId,
    ]),
    // Every ten answers. The learner is seen in the middle of a run too.
    answers: Math.floor((input.totals.correct + input.totals.incorrect) / 10),
  })
}
