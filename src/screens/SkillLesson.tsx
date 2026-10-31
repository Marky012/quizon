import { useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenFrame, useBack } from '@/components/ScreenFrame'
import { SkillSymbol } from '@/components/SkillSymbol'
import { PupAvatar } from '@/components/PupAvatar'
import { TeacherNote, BookGlyph, CheckGlyph } from '@/components/LessonParts'
import { SKILL_BY_ID } from '@/content/manifest'
import { PASSAGE_BY_ID } from '@/content/texts'
import { accentGlowVar, accentInk, accentVar } from '@/lib/accents'
import { play } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE INTERACTIVE LESSON (2026-10-24 Woof School Modernization)

   THE PEDAGOGY:
     1. THE RULE: Plain, high-contrast, supported by the helper pup's mnemonic & hint.
     2. WORKED EXAMPLE: Demonstrated directly on real passages from the bank.
     3. THE CHECK: The 5-item pre-test where perfection earns the helper pup.

   VISUAL LANGUAGE:
     Matches the Woof School Indigo Depth card (.school-card) with the lit corner
     accent glow, hairline border, floating cut-out pup sticker with halo,
     and clear step navigation.
   =========================================================================== */

export function SkillLesson() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack()
  const [step, setStep] = useState<0 | 1>(0)

  const skill = SKILL_BY_ID[id]
  const completeLesson = useGameStore((s) => s.completeLesson)
  const isEarned = useGameStore((s) => s.skills.find((k) => k.id === id)?.pupEarned ?? false)

  if (!skill) {
    return (
      <ScreenFrame title="Lesson" onBack={back}>
        <p className="card-cream p-4 text-indigo">That lesson does not exist.</p>
      </ScreenFrame>
    )
  }

  const example = PASSAGE_BY_ID.T1
  const glow = accentGlowVar(skill.pup.accent)
  const accent = accentVar(skill.pup.accent)
  const ink = accentInk(skill.pup.accent)

  const finish = () => {
    play('unlock')
    completeLesson(skill.id)
    navigate(`/pretest/${skill.id}`)
  }

  return (
    <ScreenFrame
      title={skill.name}
      subtitle={skill.purpose}
      onBack={back}
      bar={
        <button
          type="button"
          onClick={() => {
            play('tap')
            if (step >= 1) finish()
            else setStep(1)
          }}
          className="btn-chunky flex w-full items-center justify-center gap-2 bg-turquoise py-4 text-[19px] text-on-turquoise shadow-[0_12px_24px_-10px_rgb(0_210_196/0.5)] transition-transform active:scale-[0.98]"
        >
          <span>{step >= 1 ? 'Take the check (5 items)' : 'Show me an example'}</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      }
    >
      <div className="flex flex-col gap-5 pb-4">
        {/* STEP TRAIL: 3 sequential steps cleanly aligned on the left */}
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          <span
            className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              step === 0
                ? 'bg-indigo text-cream shadow-sm'
                : 'bg-lime text-on-lime font-extrabold'
            }`}
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20 text-[9px]">
              {step > 0 ? <CheckGlyph className="h-2.5 w-2.5" /> : '1'}
            </span>
            The Rule
          </span>

          <span className="h-0.5 w-3 rounded-full bg-navy/20" />

          <span
            className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              step === 1
                ? 'bg-indigo text-cream shadow-sm'
                : 'bg-navy/10 text-navy/60'
            }`}
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20 text-[9px]">
              2
            </span>
            Example
          </span>

          <span className="h-0.5 w-3 rounded-full bg-navy/20" />

          <span className="flex h-6 items-center gap-1.5 rounded-full bg-navy/10 px-2.5 text-[11px] font-bold uppercase tracking-wider text-navy/60">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-navy/10 text-[9px]">
              3
            </span>
            Pre-Test
          </span>
        </div>

        {/* HERO RULE CARD: mt-6 headroom ensures the floating pup (-top-11) never collides with or covers the step trail */}
        <section
          className="school-card halo-right group relative mt-6 overflow-visible rounded-[24px] p-5 pt-6 text-cream"
          style={{ '--skill-accent': glow } as CSSProperties}
        >
          {/* FLOATING PUP CUT-OUT STICKER */}
          <div className="pointer-events-none absolute -top-11 right-2 z-20 block animate-float">
            <div className="school-pup block">
              <PupAvatar
                pup={skill.pup}
                size={144}
                plain
                className="drop-shadow-[0_4px_0_rgba(26,43,76,0.55)] drop-shadow-[0_14px_18px_rgba(8,12,52,0.45)]"
              />
            </div>
          </div>

          {/* HELPER HEADER BAND */}
          <div className="relative z-10 flex max-w-[calc(100%-110px)] flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] shadow-sm"
                style={{ backgroundColor: accent, color: ink }}
              >
                <SkillSymbol id={skill.symbol} size={18} color="currentColor" />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-cream/70">
                Your Skill Helper
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-white">
                {skill.pup.name}
              </h1>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-cream/80 backdrop-blur-sm">
                {skill.pup.breed}
              </span>
            </div>
          </div>

          {/* RULE BODY */}
          <div className="relative z-10 mt-5 border-t border-white/15 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-yellow ring-1 ring-yellow/40">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="h-3 w-3">
                  <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
                </svg>
                The Core Rule
              </span>
              {isEarned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime ring-1 ring-lime/40">
                  Pup Earned <CheckGlyph className="h-3 w-3" />
                </span>
              )}
            </div>

            <p className="text-[17px] font-medium leading-[25px] text-cream">
              {skill.rule}
            </p>

            {/* PUP'S READING TIP */}
            {skill.hint && (
              <div className="mt-4 rounded-[16px] bg-white/[0.07] p-3 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-yellow">
                  {skill.pup.name}&apos;s Quick Tip
                </p>
                <p className="mt-1 text-[13px] leading-5 text-cream/90">
                  {skill.hint}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* WORKED EXAMPLE (Shown when step >= 1) */}
        {step >= 1 && example && (
          <section className="card-cream animate-slide-up rounded-[22px] border-2 border-indigo/10 p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-indigo text-cream">
                  <BookGlyph className="h-4 w-4" />
                </span>
                <h2 className="font-display text-[19px] font-bold text-indigo">
                  Worked Example
                </h2>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                <span className="rounded-pill bg-indigo/10 px-2 py-0.5 text-indigo">
                  {example.title}
                </span>
                <span className="rounded-pill bg-turquoise-soft px-2 py-0.5 text-indigo">
                  {example.textType}
                </span>
                <span className="rounded-pill bg-yellow-soft px-2 py-0.5 text-indigo">
                  to {example.purpose}
                </span>
              </div>
            </div>

            <div className="passage rounded-[16px] bg-cream/70 p-4 text-[16px] leading-[26px] text-indigo ring-1 ring-navy/10">
              {example.sentences.slice(0, 3).join(' ')}
            </div>

            <p className="mt-3 text-[13px] leading-5 text-navy/80">
              Notice how the text matches the rule for <span className="font-bold text-indigo">{skill.name}</span>.
              Use this same strategy when you answer the 5 check questions!
            </p>
          </section>
        )}

        {/* TEACHER REYES GUIDANCE NOTE (Dynamic Emotion: idle for Rule, hint for Worked Example) */}
        <TeacherNote emotion={step >= 1 ? 'hint' : 'idle'}>
          <p className="text-[14px] leading-snug text-indigo font-medium">
            {step >= 1 ? (
              <>
                Notice how the rule guides your reading in the example above.
                When you&apos;re ready, let&apos;s start the check!
              </>
            ) : (
              <>
                Do well on the check (get all 5 right) and{' '}
                <strong className="font-bold text-indigo">{skill.pup.name}</strong> joins your roster for good.
                You can retry as many times as you like!
              </>
            )}
          </p>
        </TeacherNote>
      </div>
    </ScreenFrame>
  )
}