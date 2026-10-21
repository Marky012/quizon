import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionCard } from '@/components/QuestionCard'
import type { Question } from '@/content/schemas'
import { getPreTest } from '@/content/questions'
import { SKILL_NAMES } from '@/content/manifest'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  vi.useFakeTimers()
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
})

const testQuestion: Question = {
  id: 'test-q1',
  skillTested: 'Text Type',
  prompt: 'What kind of text is this?',
  options: [
    { text: 'News Report' },
    { text: 'How-To', errorTag: 'A how-to gives steps.' },
    { text: 'Description', errorTag: 'A description only shows what one thing is like.' },
    { text: 'Narrative', errorTag: 'A narrative tells a story.' },
  ],
  correctIndex: 0,
  explanation: 'It reports real events.',
}

describe('QuestionCard answer feedback states', () => {
  it('when answered correctly: correct option has correct state, other 3 options are disabled', () => {
    const onResolve = vi.fn()
    const onAdvance = vi.fn()

    act(() => {
      root.render(
        <QuestionCard
          question={testQuestion}
          index={0}
          total={5}
          onResolve={onResolve}
          onAdvance={onAdvance}
        />,
      )
    })

    const buttons = container.querySelectorAll<HTMLButtonElement>('button.option-btn')
    expect(buttons.length).toBe(4)

    // Click the correct answer: Option 0 (News Report)
    act(() => {
      buttons[0]?.click()
    })

    expect(onResolve).toHaveBeenCalledWith(true, [0])

    // Option 0 (correct answer) must have correct state
    expect(buttons[0]?.classList.contains('option-correct')).toBe(true)
    expect(buttons[0]?.textContent).toContain('TAMA')
    expect(buttons[0]?.textContent).toContain('✓')

    // The other 3 options must be in disabled state (option-idle, opacity-50, disabled: true)
    for (let i = 1; i < 4; i++) {
      expect(buttons[i]?.classList.contains('option-correct')).toBe(false)
      expect(buttons[i]?.classList.contains('option-incorrect')).toBe(false)
      expect(buttons[i]?.classList.contains('option-idle')).toBe(true)
      expect(buttons[i]?.classList.contains('opacity-50')).toBe(true)
      expect(buttons[i]?.disabled).toBe(true)
    }
  })

  it('when answered wrongly: clicked wrong option has incorrect state, correct option has correct state, other 2 decoys are disabled', () => {
    const onResolve = vi.fn()
    const onAdvance = vi.fn()

    act(() => {
      root.render(
        <QuestionCard
          question={testQuestion}
          index={0}
          total={5}
          onResolve={onResolve}
          onAdvance={onAdvance}
        />,
      )
    })

    const buttons = container.querySelectorAll<HTMLButtonElement>('button.option-btn')
    expect(buttons.length).toBe(4)

    // Click a wrong answer: Option 1 (How-To)
    act(() => {
      buttons[1]?.click()
    })

    expect(onResolve).toHaveBeenCalledWith(false, [1])

    // Option 1 (the clicked wrong answer) must have incorrect state
    expect(buttons[1]?.classList.contains('option-incorrect')).toBe(true)
    expect(buttons[1]?.textContent).toContain('MALI')
    expect(buttons[1]?.textContent).toContain('✕')
    expect(buttons[1]?.disabled).toBe(true)

    // Option 0 (the correct answer) must have correct state
    expect(buttons[0]?.classList.contains('option-correct')).toBe(true)
    expect(buttons[0]?.textContent).toContain('TAMA')
    expect(buttons[0]?.textContent).toContain('✓')
    expect(buttons[0]?.disabled).toBe(true)

    // The other 2 decoy choices (Options 2 and 3) must be in disabled state (option-idle, opacity-50, disabled: true)
    for (const i of [2, 3]) {
      expect(buttons[i]?.classList.contains('option-correct')).toBe(false)
      expect(buttons[i]?.classList.contains('option-incorrect')).toBe(false)
      expect(buttons[i]?.classList.contains('option-idle')).toBe(true)
      expect(buttons[i]?.classList.contains('opacity-50')).toBe(true)
      expect(buttons[i]?.disabled).toBe(true)
    }
  })

  it('verifies question option states across all 8 skills in Woof School Pre-test', () => {
    for (const skillName of SKILL_NAMES) {
      const questions = getPreTest(skillName)
      expect(questions.length).toBeGreaterThan(0)

      const q = questions[0]
      if (!q) continue

      act(() => {
        root.render(
          <QuestionCard
            key={q.id}
            question={q}
            index={0}
            total={questions.length}
            onResolve={vi.fn()}
            onAdvance={vi.fn()}
          />,
        )
      })

      const buttons = container.querySelectorAll<HTMLButtonElement>('button.option-btn')

      if (q.correctIndex !== undefined) {
        // Find a wrong index to click
        const wrongIndex = q.options.findIndex((_, idx) => idx !== q.correctIndex)
        expect(wrongIndex).toBeGreaterThanOrEqual(0)

        act(() => {
          buttons[wrongIndex]?.click()
        })

        // Wrong option clicked has incorrect state
        expect(buttons[wrongIndex]?.classList.contains('option-incorrect')).toBe(true)

        // Correct option has correct state
        expect(buttons[q.correctIndex]?.classList.contains('option-correct')).toBe(true)

        // Remaining options are idle and disabled
        q.options.forEach((_, idx) => {
          if (idx !== wrongIndex && idx !== q.correctIndex) {
            expect(buttons[idx]?.classList.contains('option-idle')).toBe(true)
            expect(buttons[idx]?.disabled).toBe(true)
            expect(buttons[idx]?.classList.contains('opacity-50')).toBe(true)
          }
        })
      }
    }
  })
})
