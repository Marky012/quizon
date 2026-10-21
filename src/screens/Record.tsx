import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { SkillSymbol } from '@/components/SkillSymbol'
import { SyncBadge } from '@/components/SyncBadge'
import { SKILLS } from '@/content/manifest'
import { TIER_ORDER } from '@/content/world'
import { attemptsLeft, bestScore, isPassing } from '@/logic/scoring'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE RECORD - the thing the education group actually reads.

   This screen is designed to be PRINTED. `print:` overrides in index.css pull
   the chrome off, force black on white, and stop the navy from eating toner.
   That is why the rows are a real table and not a grid of cards: a table
   survives being photocopied in greyscale, which a card layout does not.

   EIGHT ROWS, ONE PER SKILL, because the whole point of the product is that a
   teacher can see which of the eight things a learner needs help with. A single
   overall percentage tells them nothing they can act on.

   NO NAMES ANYWHERE ON THIS PAGE, and as of 2026-10-06 no learner code either:
   the code is still generated and still rides along in the export filename, but
   it is no longer printed in the header or anywhere else on screen. The header
   now carries the title alone.
   =========================================================================== */

export function Record() {
  const navigate = useNavigate()
  const back = useBack()

  const skills = useGameStore((s) => s.skills)
  const tiers = useGameStore((s) => s.tiers)
  const missed = useGameStore((s) => s.skillMissedCount)

  const rows = useMemo(
    () =>
      SKILLS.map((skill) => {
        const state = skills.find((k) => k.id === skill.id)
        const review = missed[skill.name] ?? 0
        return {
          skill,
          earned: state?.pupEarned ?? false,
          uses: state?.pupUses ?? 0,
          preTest: state?.bestPreTestScore ?? null,
          review,
        }
      }),
    [skills, missed],
  )

  const totalReview = Object.values(missed).reduce((a, b) => a + b, 0)

  return (
    <ScreenFrame
      title="My reading record"
      onBack={back}
      wide
      footer={
        <div className="mx-auto flex w-full max-w-2xl gap-3 px-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-chunky flex-1 bg-turquoise py-4 text-on-turquoise"
          >
            Print
          </button>
        </div>
      }
    >
      {/* Only on screen. Hidden before printing. */}
      <div className="mb-4 flex flex-col gap-2 no-print">
        <p className="flex-1 text-[15px] leading-6 text-navy/80">
          Print this page for your teacher.
        </p>
        <SyncBadge />
      </div>

      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Reading record: one row per reading skill, showing whether the helper is earned, how
          often it was called, and how many items need review.
        </caption>
        <thead>
          <tr className="border-b-2 border-navy/20">
            <th scope="col" className="py-2 text-sm uppercase tracking-wide text-navy">
              Skill
            </th>
            <th scope="col" className="py-2 text-sm uppercase tracking-wide text-navy">
              Helper
            </th>
            <th scope="col" className="py-2 text-right text-sm uppercase tracking-wide text-navy">
              Skill check
            </th>
            <th scope="col" className="py-2 text-right text-sm uppercase tracking-wide text-navy">
              Called
            </th>
            <th scope="col" className="py-2 text-right text-sm uppercase tracking-wide text-navy">
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ skill, uses, preTest, review }) => (
            <tr key={skill.id} className="border-b-2 border-navy/15 align-middle">
              <th scope="row" className="py-2 pr-2 font-bold text-indigo">
                <span className="flex items-center gap-2">
                  <SkillSymbol id={skill.symbol} size={18} />
                  {skill.name}
                </span>
              </th>
              <td className="py-2 pr-2">
                {/* The row's helper IS the pup, so it shows the pure artwork -
                    `plain`, no cream plate, no ring. Earned/not-earned already
                    reads in the Skill check column, not as chrome on the dog. */}
                <PupAvatar pup={skill.pup} size={40} plain />
              </td>
              <td className="py-2 text-right tabular-nums text-indigo">
                {preTest === null ? '—' : `${Math.round(preTest)}%`}
              </td>
              <td className="py-2 text-right tabular-nums text-indigo">{uses}</td>
              <td
                className={`py-2 text-right font-bold tabular-nums ${
                  review > 0 ? 'text-coral' : 'text-indigo'
                }`}
              >
                {review > 0 ? review : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 mb-2 text-[20px] text-indigo">Levels</h2>
      <ul className="flex flex-col gap-1">
        {TIER_ORDER.map((id) => {
          const state = tiers[id]
          if (!state) return null
          const best = bestScore(state.attempts)
          const passed = isPassing(best)
          const left = attemptsLeft(state.attempts)
          return (
            <li
              key={id}
              className="flex items-baseline justify-between gap-2 border-b-2 border-navy/15 py-2"
            >
              <span className="font-bold text-indigo">{state.id}</span>
              <span className="text-right tabular-nums text-indigo">
                {state.attempts.length === 0
                  ? 'Not attempted'
                  : `${best}% &middot; ${state.attempts.length} of 3 used${passed ? '' : `, ${left} left`}`}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-[15px] leading-6 text-navy/80">
        {totalReview === 0
          ? 'Nothing needs reviewing yet.'
          : `${totalReview} item${totalReview === 1 ? '' : 's'} across all levels would benefit from another look.`}
      </p>

      <button
        type="button"
        onClick={() => navigate('/hub')}
        className="btn-chunky mt-4 w-full bg-turquoise py-4 text-on-turquoise no-print"
      >
        See my pups
      </button>
    </ScreenFrame>
  )
}
