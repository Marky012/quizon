import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Boot } from '@/screens/Boot'
import { Intro } from '@/screens/Intro'
import { Profile } from '@/screens/Profile'
import { Welcome } from '@/screens/Welcome'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE ONBOARDING SPINE, DRIVEN END TO END.

   There are two ways this routing goes wrong and neither shows up in a static
   read of App.tsx:

   1. The ORDER breaks - a typed URL skips Welcome or Profile and the child
      lands three screens deep in a flow they never walked. Only a real router
      mounted over the real screens catches that.
   2. The ONE-WAY DOORS fail - a finished learner types /welcome and gets
      walked through setup again, which is exactly the bug reported from the
      field. A guard that is present but keyed on the wrong flag looks
      identical to one that works until you drive it.

   So this file drives the real Boot, the real three setup screens and a real
   router, and asserts where a learner actually ends up. No @testing-library,
   same as appBack.test.tsx: React 19 ships act(), and createRoot is all that
   is needed to mount a router and press real buttons.
   =========================================================================== */

let container: HTMLDivElement
let root: Root
/** Current pathname, readable from outside React. */
let currentPath = ''

function PathProbe() {
  currentPath = useLocation().pathname
  return null
}

type Flags = {
  hasStarted: boolean
  profileCreated: boolean
  introCompleted: boolean
}

/** The three spine flags, set explicitly so no test depends on another's state. */
function setFlags(flags: Flags) {
  useGameStore.setState(flags)
}

function renderAt(initial: string) {
  root.render(
    <MemoryRouter initialEntries={[initial]}>
      <PathProbe />
      <Routes>
        <Route path="/" element={<Boot />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/hub" element={<p>hub</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Let every pending Navigate and state flush settle. */
async function settle(rounds = 5) {
  for (let i = 0; i < rounds; i++) await act(async () => {})
}

/** Run the 220ms feedback timers the setup screens use before moving on. */
async function tick(ms = 300) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

function tap(label: string, by: 'text' | 'aria' = 'text') {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    by === 'aria'
      ? b.getAttribute('aria-label') === label
      : (b.textContent ?? '').trim() === label,
  )
  expect(btn, `a control labelled "${label}" should be rendered`).toBeTruthy()
  return act(async () => {
    ;(btn as HTMLButtonElement).click()
  })
}

async function type(input: HTMLInputElement, value: string) {
  // React owns the value attribute on a controlled field, so a bare assignment
  // is ignored. The native prototype setter is how React's own tests write in.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
  await act(async () => {
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers()
  sessionStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  setFlags({ hasStarted: false, profileCreated: false, introCompleted: false })
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
})

describe('the first-run spine, end to end', () => {
  it('walks welcome -> profile -> intro -> hub in that order, setting each flag', async () => {
    // The reported journey: a learner types /welcome as a fresh player and is
    // expected to be walked through the three setup screens, then the hub.
    renderAt('/welcome')
    await settle()
    expect(currentPath).toBe('/welcome')

    await tap("Let's start!")
    await tick()
    await settle()
    expect(currentPath).toBe('/profile')
    expect(useGameStore.getState().hasStarted).toBe(true)

    await tap('Play as Girl', 'aria')
    await tap('Next')
    await tick()
    await settle()
    expect(currentPath).toBe('/profile')

    const nickname = container.querySelector<HTMLInputElement>('#nickname')
    expect(nickname, 'panel 2 should be showing the nickname field').toBeTruthy()
    await type(nickname!, 'Mia')
    await tap("Let's go!")
    await settle()
    expect(currentPath).toBe('/intro')
    expect(useGameStore.getState().profileCreated).toBe(true)
    expect(useGameStore.getState().playerGender).toBe('girl')
    expect(useGameStore.getState().playerName).toBe('Mia')

    await tap('Skip')
    await settle()
    expect(currentPath).toBe('/hub')
    expect(useGameStore.getState().introCompleted).toBe(true)
  })
})

describe('one-way doors on the setup screens', () => {
  it('welcome still renders for a fresh learner', async () => {
    setFlags({ hasStarted: false, profileCreated: false, introCompleted: false })
    renderAt('/welcome')
    await settle()
    expect(currentPath).toBe('/welcome')
    expect(container.textContent).toContain('Choose your helper')
  })

  it('welcome still renders mid-setup, so Profile can back into it', async () => {
    // hasStarted is already true while Profile is on screen; a hasStarted guard
    // here would bounce the learner mid-back and trap them in a loop.
    setFlags({ hasStarted: true, profileCreated: false, introCompleted: false })
    renderAt('/welcome')
    await settle()
    expect(currentPath).toBe('/welcome')
  })

  it('welcome hands a finished learner to Boot instead of replaying setup', async () => {
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: true })
    renderAt('/welcome')
    await settle()
    expect(currentPath).toBe('/hub')
    expect(container.textContent).not.toContain('Who are you?')
    expect(container.textContent).not.toContain('Before you start')
  })

  it('profile bounces a learner who never started back to Welcome', async () => {
    setFlags({ hasStarted: false, profileCreated: false, introCompleted: false })
    renderAt('/profile')
    await settle()
    expect(currentPath).toBe('/welcome')
  })

  it('profile renders as the active step for the learner Welcome just started', async () => {
    setFlags({ hasStarted: true, profileCreated: false, introCompleted: false })
    renderAt('/profile')
    await settle()
    expect(currentPath).toBe('/profile')
    expect(container.textContent).toContain('Who are you?')
  })

  it('profile hands a finished learner to Boot, which names their real next stop', async () => {
    // profileCreated means the door is shut; Boot is the one that decides this
    // learner belongs at /intro (profile done, intro not), which is the point
    // of bouncing to "/" instead of to a screen hardcoded here.
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: false })
    renderAt('/profile')
    await settle()
    expect(currentPath).toBe('/intro')
    expect(container.textContent).not.toContain('What is your nickname?')
  })

  it('intro cannot be skipped ahead of Welcome', async () => {
    setFlags({ hasStarted: false, profileCreated: false, introCompleted: false })
    renderAt('/intro')
    await settle()
    expect(currentPath).toBe('/welcome')
  })

  it('intro cannot be skipped ahead of Profile', async () => {
    setFlags({ hasStarted: true, profileCreated: false, introCompleted: false })
    renderAt('/intro')
    await settle()
    expect(currentPath).toBe('/profile')
  })

  it('intro renders exactly in the state Boot sends it for', async () => {
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: false })
    renderAt('/intro')
    await settle()
    expect(currentPath).toBe('/intro')
    expect(container.textContent).toContain('Before you start')
  })

  it('intro does not replay once the cutscene has finished', async () => {
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: true })
    renderAt('/intro')
    await settle()
    expect(currentPath).toBe('/hub')
  })

  it('Boot still owns "/" and resumes a returning learner at their own step', async () => {
    setFlags({ hasStarted: true, profileCreated: false, introCompleted: false })
    renderAt('/')
    await settle()
    expect(currentPath).toBe('/profile')
  })
})
