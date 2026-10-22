import type { StudentReport } from '@/logic/scoring'

/* ===========================================================================
   THE SYNC WIRE FORMAT.

   WHAT THIS IS. The shape of the one JSON document a student device sends to
   the teacher's dashboard. It is the contract between two apps that live in
   different repositories, so it is the one place in this codebase where a
   typo is expensive.

   WHY IT IS A FULL SNAPSHOT AND NOT A DELTA. Every payload describes the
   learner's ENTIRE progress, not what changed. That one decision removes a
   whole class of bugs:

     - A lost request needs no repair. The next one carries everything.
     - There is no queue to drain, no ordering to respect, no sequence
       number to keep, no "apply delta 7 of 9" state machine.
     - The server does not need to merge. It overwrites one row.

   The cost is that the payload is bigger than a delta would be. It is about
   4 KB, which is nothing, so the trade is not close.

   WHAT IS NOT IN HERE, AND WHY.

     - The learner's NICKNAME. It is the in-game alias, chosen by a child,
       often a joke, and not a legal name. It is display-only in the game and
       it stays that way all the way to the server. A test asserts the
       nickname never appears in the payload.
     - The learner's GENDER. It is stored, it is used to pick the player
       avatar, and it is nobody's business on a dashboard that exists to
       measure reading.
     - The answer HISTORY. 200 entries of question ids is noise on a
       dashboard. What the teacher acts on is WHICH items were missed, so
       that is what travels, deduped and capped. See buildSyncPayload.
     - Preferences and debug flags. Nobody grades a learner on their sound
       setting.

   AND THE ONE NAME THAT DOES TRAVEL.

     THE FULL NAME does, and it is the only exception to the rule this file
     used to state outright. Before 2026-10-22 the app held one name, sent
     none of it, and identified a learner only by the anonymous learner code
     - which is right for privacy and useless for teaching, because a teacher
     looking at "BAL-47" cannot put a face to it.

     So the app now holds TWO names, and this contract carries exactly one of
     them:

       fullName        the official record. Travels. The teacher dashboard
                       shows it as the roster's headline.
       (nickname)      the in-game alias. Does NOT travel. See above.

   That is a deliberate, narrow reversal of a deliberate, narrow rule. If you
   are reading this to add a THIRD name, read the section above first: the
   question to ask is not "is it useful on the dashboard" but "is this a legal
   name of a real child", and only one of the two names in the app passes
   that.
   =========================================================================== */

export const SYNC_APP = 'QuizOn!'

/**
 * Bump when the payload shape changes in a way the server must know about.
 * The server stores it and can refuse a version it does not understand,
 * instead of silently mis-reading a field.
 *
 * VERSION 2, 2026-10-22: added `fullName`. The official name travels.
 */
export const SYNC_SCHEMA_VERSION = 2

export interface SyncSkill {
  id: string
  lessonComplete: boolean
  pupEarned: boolean
  /** How many times the learner called this pup for a hint. */
  pupUses: number
  /** Best pre-test score as a percentage. 0 means never taken. */
  bestPreTestScore: number
}

export interface SyncTierFlag {
  /** Three attempts spent below the pass mark. This is the teacher flag. */
  needsAttention: boolean
  /** Whether the one hint for the best attempt was spent. */
  hintUsed: boolean
  /** The passage this learner is sitting in for this level. */
  storyId: string | null
}

export interface SyncPayload {
  app: string
  schemaVersion: number
  /** The class the teacher gave out. The capability token for this upload. */
  classCode: string
  /** The anonymous learner code. The machine identifier. */
  learnerCode: string
  /**
   * THE OFFICIAL NAME, and the only human identifier in this document.
   *
   * This is the name on the attendance sheet, and it is here because a
   * teacher has to be able to say "Maria Santos Reyes sat on the Maunahan"
   * without guessing from a code. The in-game NICKNAME is not here and must
   * never be added: a nickname is a child's joke, not a legal name.
   *
   * It is empty on a record built by a build from before the full name
   * existed, and the dashboard falls back to the learner code in that case.
   */
  fullName: string
  /**
   * A stable id for THIS browser install. Two devices with the same learner
   * code are two rows, not one, because they are two different devices with
   * two different histories.
   */
  deviceId: string
  /** When this snapshot was built, on the device. */
  sentAt: number

  /** One row per reading skill. Eight rows, always. */
  skills: SyncSkill[]
  /** One entry per level. The per-level scores live in the report. */
  tierFlags: Record<string, SyncTierFlag>
  totals: { correct: number; incorrect: number }
  /** Miss count per skill name. The "areas to review" signal. */
  skillMissedCount: Record<string, number>
  /**
   * The ids of the items this learner got wrong, deduped and capped.
   *
   * The question TEXT does not travel. The teacher app would need the whole
   * 400-item bank to render it, and that bank is the largest asset in the
   * project. Ids are enough for the MVP; a question index can be added
   * later without changing this contract.
   */
  missedQuestionIds: string[]
  /** The full student report, built by the same code that prints the record. */
  report: StudentReport
}

/** The server's answer. Anything that is not ok means "not synced". */
export interface SyncResponse {
  ok: boolean
  /** Set when ok is false. Safe to show a grown-up. */
  error?: string
  /** The row the server wrote, for logging. */
  rowId?: string
}

/**
 * WHERE THE LEARNER'S RECORD CURRENTLY IS.
 *
 * A learner-facing state machine, so the words are chosen for a child:
 * "offline" means waiting for a connection, not broken.
 */
export type SyncStatus =
  /** Nothing to do. No class, or nothing has changed. */
  | 'idle'
  /** This build has no teacher dashboard attached. The feature is off. */
  | 'disabled'
  /** There is a record to send and no connection to send it on. */
  | 'offline'
  /** There is a record to send, and it is about to go. */
  | 'pending'
  /** A request is in flight. */
  | 'syncing'
  /** The teacher has it. */
  | 'synced'
  /** The last attempt failed. The record is still safe on the device. */
  | 'error'
