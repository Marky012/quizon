import type { QuestionOption } from '@/content/schemas'

/* ===========================================================================
   OPTION BUTTON - the most-tapped control in the product.

   THREE-CHANNEL FEEDBACK (art bible 2.4, and a quality gate). Colour is NEVER
   the only signal, because ~8% of boys and 0.5% of girls in our age band have
   colour vision deficiency. Every state carries THREE channels:

     correct    LIME FILL   + CHECK BADGE   + 4px border and a slight scale up
     incorrect  CORAL FILL  + CROSS BADGE   + 2-degree tilt
     idle       CREAM FILL  + (nothing)     + flat

   The visible word matters as much as the icon. Art bible 13.3 bans "Wrong!"
   and "Incorrect", so the states read TAMA and HINDI PA. All-caps is reserved
   for exactly these two short state words and nothing else.

   SUPPORTS MULTI-SELECT, because the key-details skill asks "tap the sentences
   that carry the key information". In multi mode the button toggles and the
   verdict arrives only on submit, not on each tap.
   =========================================================================== */

export type OptionState = 'idle' | 'correct' | 'incorrect'

export function OptionButton({
  option,
  index,
  state,
  selected,
  multi = false,
  disabled = false,
  letter,
  tabIndex = 0,
  onSelect,
}: {
  option: QuestionOption
  index: number
  state: OptionState
  selected: boolean
  multi?: boolean
  disabled?: boolean
  /** A, B, C, D. Always shown: children read letters faster than they scan. */
  letter: string
  /**
   * Roving tabindex. 0 on the option that should receive Tab, -1 on the rest, so
   * the answer set is ONE tab stop rather than four. Arrow keys move within it -
   * the standard radio-group interaction, and the reason a keyboard learner can
   * reach an answer without tabbing past every option first.
   */
  tabIndex?: number
  onSelect: () => void
}) {
  const stateClass =
    state === 'correct' ? 'option-correct' : state === 'incorrect' ? 'option-incorrect' : 'option-idle'

  return (
    <button
      type="button"
      onClick={onSelect}
      /* Lets the parent find this option by position for arrow-key focus moves,
         without reaching into React internals or relying on child order. */
      data-option={index}
      disabled={disabled}
      tabIndex={tabIndex}
      /* Single-select is a radio group and multi-select is a set of checkboxes.
         The role and the checked state are what let a screen reader say "2 of
         4, selected" instead of just announcing four separate buttons. */
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={multi ? selected : state !== 'idle' && (selected || state === 'correct')}
      /* Only meaningful in multi mode, where aria-checked already carries it. */
      aria-pressed={multi ? undefined : selected}
      /* The letter badge is aria-hidden, so without this a screen reader
         announces four identical buttons with no position at all. */
      aria-label={`${letter}, option ${index + 1}. ${option.text}`}
      className={`option-btn ${stateClass} flex w-full items-center gap-3 px-4 py-3 text-indigo ${
        !disabled ? 'cursor-pointer' : ''
      } ${multi && state === 'idle' && selected ? 'bg-turquoise-soft' : ''} ${
        state === 'incorrect' ? 'animate-shake' : ''
      } ${state === 'idle' && disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* The letter circle. Borderless since the reset: idle reads on the
          indigo-soft fill, and the marked states invert to structural indigo
          or navy so the badge still carries the mark without a painted edge. */}
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${state === 'correct'
            ? 'bg-indigo text-cream'
            : state === 'incorrect'
              ? 'bg-navy text-cream'
              : 'bg-indigo-soft text-indigo'
          }`}
      >
        {state === 'correct' ? '✓' : state === 'incorrect' ? '✕' : letter}
      </span>

      <span className="flex-1 text-left leading-6">{option.text}</span>

      {/* The third channel in words, so the verdict is readable without
          colour OR without recognising the glyphs. */}
      {state !== 'idle' && (
        <span
          className={`shrink-0 text-[13px] font-extrabold tracking-wide ${state === 'correct' ? 'text-indigo' : 'text-navy'
            }`}
        >
          {state === 'correct' ? 'TAMA' : 'MALI'}
        </span>
      )}

      {/* Multi-select needs a visible tick, because the tap does not resolve
          anything until submit and silence otherwise looks broken. */}
      {multi && state === 'idle' && (
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${selected ? 'bg-turquoise shadow-[inset_0_-4px_0_0_rgb(26_43_76/0.15)] text-on-turquoise' : 'bg-indigo-soft'
            }`}
        >
          {selected ? '✓' : ''}
        </span>
      )}
    </button>
  )
}