import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { PupAvatar } from '@/components/PupAvatar'
import { Sheet } from '@/components/Sheet'
import { SkillSymbol } from '@/components/SkillSymbol'
import { SyncBadge } from '@/components/SyncBadge'
import { FEATURES } from '@/constants/features'
import { SKILLS } from '@/content/manifest'
import { TIER_ORDER } from '@/content/world'
import { attemptsLeft, bestScore, isPassing } from '@/logic/scoring'
import { syncNow } from '@/sync/manager'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE RECORD - what the learner sees, and what the teacher dashboard reads.

   A real <table> rather than a grid of cards: the columns are the point, and a
   table keeps them aligned at every width.

   EIGHT ROWS, ONE PER SKILL, because the whole point of the product is that a
   teacher can see which of the eight things a learner needs help with. A single
   overall percentage tells them nothing they can act on.

   NO NAMES ANYWHERE ON THIS PAGE, and no learner code either. The code is
   still generated for the sync record, but it is not shown here.
   =========================================================================== */

export function Record() {
  const navigate = useNavigate()
  const back = useBack()
  const [syncInfoOpen, setSyncInfoOpen] = useState(false)

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
  const earnedTotal = rows.filter((r) => r.earned).length
  const scored = rows.filter((r) => r.preTest !== null)
  const avgCheck = scored.length
    ? Math.round(scored.reduce((a, r) => a + (r.preTest ?? 0), 0) / scored.length)
    : null
  const tiles = [
    { label: 'Pups earned', value: `${earnedTotal}/${rows.length}`, tone: 'bg-turquoise-soft' },
    { label: 'Avg. check', value: avgCheck === null ? '—' : `${avgCheck}%`, tone: 'bg-lime-soft' },
    { label: 'To review', value: String(totalReview), tone: totalReview > 0 ? 'bg-coral-soft' : 'bg-indigo-soft' },
  ]

  return (
    <ScreenFrame
      title="My reading record"
      onBack={back}
      wide
      footer={
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-1.5 px-4">
          {/* A real button, not a dead one: tapping it always answers. While
              teacherSync is closed it explains the roadmap; when it opens, it
              sends the record. */}
          <button
            type="button"
            onClick={() => {
              if (FEATURES.teacherSync) {
                void syncNow()
              } else {
                setSyncInfoOpen(true)
              }
            }}
            className="btn-chunky flex w-full items-center justify-center gap-2 bg-turquoise py-4 text-on-turquoise"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
            Sync record
          </button>
          <p className="text-center text-[13px] leading-4 text-navy/75">
            Coming soon: send your record to your teacher.
          </p>
        </div>
      }
    >
      <div className="mx-auto mb-4 flex w-full max-w-3xl flex-col gap-2 rounded-[18px] bg-cream/90 p-3">
        <p className="flex-1 text-[15px] leading-6 text-navy/80">
          This is your reading record. Your teacher will see it once it is synced.
        </p>
        <SyncBadge />
      </div>

      <ul className="mx-auto mb-5 grid w-full max-w-3xl grid-cols-3 gap-2.5 sm:gap-4">
        {tiles.map((t) => (
          <li key={t.label} className={`card-cream ${t.tone} px-2 py-3 text-center`}>
            <p className="font-display text-[26px] leading-7 text-indigo tabular-nums">{t.value}</p>
            <p className="mt-0.5 text-[12px] font-bold leading-4 text-navy/75">{t.label}</p>
          </li>
        ))}
      </ul>

      <section className="mx-auto w-full max-w-3xl rounded-[24px] bg-cream p-3 shadow-[0_14px_28px_-18px_rgb(8_12_52/0.7)] ring-1 ring-navy/10 sm:p-5">
<div className="overflow-x-auto">
<table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">
          Reading record: one row per reading skill, showing whether the helper is earned, how
          often it was called, and how many items need review.
        </caption>
        <thead>
          <tr className="border-b-2 border-navy/20">
            <th scope="col" className="px-1 py-2 text-[11px] font-extrabold uppercase tracking-wide text-navy/80 sm:text-xs">
              Skill
            </th>
            <th scope="col" className="px-1 py-2 text-[11px] font-extrabold uppercase tracking-wide text-navy/80 sm:text-xs">
              Helper
            </th>
            <th scope="col" className="px-1 py-2 text-right text-[11px] font-extrabold uppercase leading-3 tracking-wide text-navy/80 sm:px-2 sm:text-xs">
              Skill check
            </th>
            <th scope="col" className="px-1 py-2 text-right text-[11px] font-extrabold uppercase leading-3 tracking-wide text-navy/80 sm:px-2 sm:text-xs">
              Called
            </th>
            <th scope="col" className="px-1 py-2 text-right text-[11px] font-extrabold uppercase leading-3 tracking-wide text-navy/80 sm:px-2 sm:text-xs">
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ skill, uses, preTest, review }) => (
            <tr key={skill.id} className="border-b-2 border-navy/15 align-middle">
              <th scope="row" className="py-2 pr-2 text-[15px] font-bold text-indigo sm:text-base">
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
              <td className="px-1 py-2 text-right tabular-nums text-indigo sm:px-2 sm:text-base">
                {preTest === null ? '—' : `${Math.round(preTest)}%`}
              </td>
              <td className="px-1 py-2 text-right tabular-nums text-indigo sm:px-2 sm:text-base">{uses}</td>
              <td
                className={`px-1 py-2 text-right font-bold tabular-nums sm:px-2 ${
                  review > 0 ? 'text-coral' : 'text-indigo'
                }`}
              >
                {review > 0 ? review : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
</div>
</section>

      <section className="mx-auto mt-5 w-full max-w-3xl rounded-[24px] bg-cream p-4 shadow-[0_14px_28px_-18px_rgb(8_12_52/0.7)] ring-1 ring-navy/10 sm:p-5">
<h2 className="mb-2 text-[20px] text-indigo">Levels</h2>
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
                  : `${best}% · ${state.attempts.length} of 3 used${passed ? '' : `, ${left} left`}`}
              </span>
            </li>
          )
        })}
      </ul>
      </section>

      <p className="mx-auto mt-4 w-full max-w-3xl rounded-[18px] bg-cream/90 px-4 py-3 text-[15px] leading-6 text-navy/80">
        {totalReview === 0
          ? 'Nothing needs reviewing yet.'
          : `${totalReview} item${totalReview === 1 ? '' : 's'} across all levels would benefit from another look.`}
      </p>

      <button
        type="button"
        onClick={() => navigate('/hub')}
        className="btn-chunky mx-auto mt-4 block w-full max-w-3xl bg-turquoise py-4 text-on-turquoise"
      >
        See my pups
      </button>

      <Sheet
        open={syncInfoOpen}
        onClose={() => setSyncInfoOpen(false)}
        title="Sync is coming soon"
      >
        <p className="text-[15px] leading-6 text-navy/80">
          Your record is saved on this device. Soon, your teacher will be able to
          see your progress.
        </p>
        <button
          type="button"
          onClick={() => setSyncInfoOpen(false)}
          className="btn-chunky mt-4 w-full bg-turquoise py-3 text-on-turquoise"
        >
          Okay
        </button>
      </Sheet>
    </ScreenFrame>
  )
}
