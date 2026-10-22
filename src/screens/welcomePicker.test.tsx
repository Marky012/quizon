import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SKILLS } from '@/content/manifest'
import { Welcome } from '@/screens/Welcome'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
    THE HELPER PICKER ON THE WELCOME SCREEN.

    Two things are under test, and they are the two things the redesign was
    for:

    1. THE NAME IS INSIDE THE CARD. The picker used to draw each helper in a
       cream tile with the name on the page underneath it. Now the card IS
       the tile - it carries the pup's accent and the pup's name - so a name
       that has drifted back OUTSIDE the card would mean the layout is half
       reverted, and a test is the only thing that notices.

    2. THE ANSWER TO THE TAP IS A TOAST. The purpose of the picked helper used
       to live in a permanent card under the grid. It is now a toast that
       says what was chosen, says it out loud to a screen reader, goes away
       on its own after five seconds, and can be dismissed with a tap.

    No @testing-library: React 19 ships act(), and createRoot is all that is
    needed to mount a screen and press real buttons.
    =========================================================================== */

let container: HTMLDivElement
let root: Root

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

function render() {
  root.render(
    <MemoryRouter initialEntries={['/welcome']}>
      <Welcome />
    </MemoryRouter>,
  )
}

async function settle(rounds = 3) {
  for (let i = 0; i < rounds; i++) await act(async () => {})
}

/** The button that picks one helper. */
function helperButton(pupName: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    (b.getAttribute('aria-label') ?? '').startsWith(`Choose ${pupName},`),
  )
  expect(btn, `a control that picks ${pupName} should be rendered`).toBeTruthy()
  return btn!
}

/** The toast, or null when nothing is showing. */
function toast(): HTMLElement | null {
  return container.querySelector<HTMLElement>('[role="status"]')
}

async function tapPup(pupName: string) {
  await act(async () => {
    helperButton(pupName).click()
  })
  await settle()
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers()
  sessionStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  useGameStore.setState({
    hasStarted: false,
    profileCreated: false,
    introCompleted: false,
    avatarId: SKILLS[0]!.pup.id,
  })
  render()
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
})

describe('the helper cards', () => {
  it('puts every pup name inside its own card', async () => {
    await settle()
    for (const skill of SKILLS) {
      const card = helperButton(skill.pup.name).querySelector('.skill-surface')
      expect(card, `${skill.pup.name} should sit on a card`).toBeTruthy()
      expect(
        card!.textContent,
        `${skill.pup.name}'s name belongs inside the card`,
      ).toContain(skill.pup.name)
    }
  })

  it('draws one card per helper, all eight of them', async () => {
    await settle()
    expect(container.querySelectorAll('.skill-surface')).toHaveLength(SKILLS.length)
  })

  it('marks the picked helper with aria-pressed', async () => {
    await settle()
    await tapPup('Franky')
    expect(helperButton('Franky').getAttribute('aria-pressed')).toBe('true')
    expect(helperButton('Tala').getAttribute('aria-pressed')).toBe('false')
  })
})

describe('the toast', () => {
  it('answers the tap with the pup, the skill and what it is for', async () => {
    await settle()
    await tapPup('Franky')

    const skill = SKILLS.find((s) => s.pup.name === 'Franky')!
    const live = toast()
    expect(live, 'the toast should be a live region').toBeTruthy()
    expect(live!.getAttribute('aria-live')).toBe('polite')
    expect(live!.textContent).toContain('Franky')
    expect(live!.textContent).toContain(skill.name)
    expect(live!.textContent).toContain(skill.purpose)
  })

  it('says nothing before a helper is picked', async () => {
    await settle()
    expect(toast()!.textContent?.trim()).toBe('')
  })

  it('goes away on its own after five seconds', async () => {
    await settle()
    await tapPup('Franky')
    expect(toast()!.textContent).toContain('Franky')

    await act(async () => {
      vi.advanceTimersByTime(4999)
    })
    expect(toast()!.textContent, 'still up just before five seconds').toContain('Franky')

    await act(async () => {
      vi.advanceTimersByTime(2)
    })
    expect(toast()!.textContent?.trim(), 'gone after five seconds').toBe('')
  })

  it('can be dismissed with a tap', async () => {
    await settle()
    await tapPup('Franky')
    const live = toast()!
    const panel = live.querySelector('button')
    expect(panel, 'the toast itself is the tap target').toBeTruthy()

    await act(async () => {
      ;(panel as HTMLButtonElement).click()
    })
    await settle()
    expect(toast()!.textContent?.trim()).toBe('')
  })

  it('restarts the five seconds when the same helper is picked again', async () => {
    await settle()
    await tapPup('Franky')
    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    await tapPup('Franky')

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    expect(
      toast()!.textContent,
      'the second tap should have restarted the timer',
    ).toContain('Franky')

    await act(async () => {
      vi.advanceTimersByTime(1100)
    })
    expect(toast()!.textContent?.trim()).toBe('')
  })
})
