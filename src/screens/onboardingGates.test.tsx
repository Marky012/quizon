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

   THE WARM-UP IS STUBBED, and that stub is the point of the stub. Boot used to
   be a pure redirector, so a routing assertion could be made in a single
   settle(). It is now a loading screen that warms the app up before it
   redirects, which means a routing assertion needs the warm-up to finish
   first. This file is about WHERE a learner ends up, not about how long the
   warm-up takes - that is Boot.test.tsx's job - so the warm-up here resolves
   immediately and the routing is what is under test.
   =========================================================================== */

vi.mock('@/lib/preload', () => ({
  isWarmupDone: () => false,
  subscribeWarmup: () => () => {},
  startWarmup: () => Promise.resolve(),
}))

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

/**
 * Which stop of the seven the indicator is showing.
 *
 * The setup spine is one indicator spread over three screens, so "the child is
 * on step 5" is a property of the whole flow and not of any one screen. Reading
 * it out of the DOM is the only way a test can see the joins.
 */
function currentStep(): string | null | undefined {
  return container.querySelector<HTMLElement>('[data-current]')?.getAttribute('data-step')
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
    expect(container.querySelectorAll('[data-step]')).toHaveLength(7)
    expect(currentStep(), 'the helper picker is stop 1 of 7').toBe('0')

    await tap('Start the quest!')
    await tick()
    await settle()
    expect(currentPath).toBe('/profile')
    expect(useGameStore.getState().hasStarted).toBe(true)
    expect(currentStep(), 'the gender question is stop 2 of 7').toBe('1')

    await tap('Play as Girl', 'aria')
    await tap('Next')
    await tick()
    await settle()
    expect(currentPath).toBe('/profile')
    expect(currentStep(), 'the full name is stop 3 of 7').toBe('2')

    // PANEL 2 IS THE OFFICIAL NAME, and the button stays disabled until
    // there are two words - a single word does not identify a child in a
    // class of thirty, which is the whole reason the field is asked for.
    const fullName = container.querySelector<HTMLInputElement>('#full-name')
    expect(fullName, 'panel 2 should be showing the full name field').toBeTruthy()
    const nextButton = () =>
      [...container.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === 'Next',
      )!

    await type(fullName!, 'Maria')
    expect(nextButton().disabled, 'one word is not a full name').toBe(true)

    await type(fullName!, ' Maria Santos Reyes')
    expect(nextButton().disabled, 'two words is a full name').toBe(false)

    await tap('Next')
    await tick()
    await settle()
    expect(currentPath).toBe('/profile')

    const nickname = container.querySelector<HTMLInputElement>('#nickname')
    expect(nickname, 'panel 3 should be showing the nickname field').toBeTruthy()
    expect(currentStep(), 'the nickname is stop 4 of 7').toBe('3')
    // It is pre-filled with the first name, so the common case is one tap.
    expect(nickname!.value).toBe('Maria')
    await type(nickname!, 'Mia')
    await tap("Let's go!")
    await settle()
    expect(currentPath).toBe('/intro')
    expect(currentStep(), 'the first story panel is stop 5 of 7').toBe('4')
    expect(useGameStore.getState().profileCreated).toBe(true)
    expect(useGameStore.getState().playerGender).toBe('girl')
    expect(useGameStore.getState().playerFullName).toBe('Maria Santos Reyes')
    expect(useGameStore.getState().playerNickname).toBe('Mia')

    await tap('Next')
    await settle()
    expect(currentStep(), 'the second story panel is stop 6 of 7').toBe('5')

    await tap('Next')
    await settle()
    expect(currentStep(), 'the last story panel is stop 7 of 7').toBe('6')

    await tap('Skip')
    await settle()
    expect(currentPath).toBe('/hub')
    expect(useGameStore.getState().introCompleted).toBe(true)
  })

  it('walks back from the first story panel to the nickname, answers intact', async () => {
    /* THE HOLE THIS FILLS. Every stop from the gender question onward could be
       walked back except the first story panel, which used to hide its back
       button. That made the spine one-way at exactly the join between Profile
       and the Intro. */
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: false })
    useGameStore.setState({
      playerGender: 'girl',
      playerFullName: 'Maria Santos Reyes',
      playerNickname: 'Mia',
    })
    renderAt('/intro')
    await settle()
    expect(currentPath).toBe('/intro')
    expect(currentStep(), 'the first story panel is stop 5 of 7').toBe('4')

    await tap('Go back', 'aria')
    await settle()
    expect(currentPath).toBe('/profile')
    expect(currentStep(), 'back lands on the nickname, stop 4 of 7').toBe('3')
    const nickname = container.querySelector<HTMLInputElement>('#nickname')
    expect(nickname, 'the return opens the nickname panel').toBeTruthy()
    expect(nickname!.value, 'and keeps what the child typed').toBe('Mia')

    /* AND IT KEEPS WALKING BACK, to the top of the spine. The gender panel's
       back is the helper picker - not "the previous entry in the app history",
       which says /intro once the cutscene can walk back into this screen. */
    await tap('Go back', 'aria')
    await settle()
    expect(container.querySelector<HTMLInputElement>('#full-name')?.value).toBe(
      'Maria Santos Reyes',
    )
    await tap('Go back', 'aria')
    await settle()
    expect(currentStep(), 'the gender panel, stop 2 of 7').toBe('1')
    await tap('Go back', 'aria')
    await settle()
    expect(currentPath, 'stop 2 backs onto the helper picker, stop 1').toBe('/welcome')

    /* AND FORWARD AGAIN, THROUGH THE PROFILE. A learner who re-picks their
       helper must not jump from stop 1 to stop 5; the name screens are
       prefilled, so this is three taps and not a re-typing. */
    await tap('Start the quest!')
    await tick()
    await settle()
    expect(currentPath).toBe('/profile')
    expect(currentStep(), 'back at stop 2, not skipped to the story').toBe('1')
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
