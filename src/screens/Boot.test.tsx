import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Boot } from '@/screens/Boot'
import { useGameStore } from '@/store/gameStore'
import { __setInstallPromptForTests } from '@/lib/install'

/* ===========================================================================
   THE BOOT GATE.

   Three things are being checked, because they are the three things that can
   break:

   1. THE SPLASH IS REAL. The mark, the subtitle, the bar and the percentage
      are all on screen BEFORE anything is fetched.

   2. A FIRST LAUNCH IS OFFERED THE DOWNLOAD, and nothing downloads until the
      child chooses it. Every launch after that warms up immediately.

   3. THE START BUTTON IS A GATE, NOT A REDIRECT. The warm-up finishing must
      stop at a visible "Start playing" or "Continue playing" button. A setup
      screen bouncing back to "/" must still pass straight through, or the
      spine would grow a second loading screen.

   The warm-up is stubbed, because a routing test that also downloads twelve
   route chunks, twenty pictures and a 4 MB track is a test that fails on a
   slow machine and tells you nothing. The real warm-up is lib/preload.ts's
   business, and preload.test.ts covers the part of it that can be wrong.
   =========================================================================== */

const warm = vi.hoisted(() => {
  let finish: (() => void) | null = null
  return {
    /** True once the app is warm, which is what a second visit to "/" sees. */
    done: false,
    /** How many times the warm-up was started. */
    started: 0,
    listeners: [] as Array<(p: { done: number; total: number }) => void>,
    reset() {
      this.done = false
      this.started = 0
      this.listeners = []
      finish = null
    },
    start(): Promise<void> {
      this.started += 1
      return new Promise<void>((resolve) => {
        finish = resolve
      })
    },
    /** The app finished warming up. */
    finish() {
      finish?.()
      finish = null
    },
    /** A progress tick from the warm-up. */
    report(done: number, total: number) {
      for (const listener of this.listeners) listener({ done, total })
    },
  }
})

vi.mock('@/lib/preload', () => ({
  isWarmupDone: () => warm.done,
  subscribeWarmup: (listener: (p: { done: number; total: number }) => void) => {
    warm.listeners.push(listener)
    return () => {
      warm.listeners = warm.listeners.filter((l) => l !== listener)
    }
  },
  startWarmup: () => warm.start(),
}))

let container: HTMLDivElement
let root: Root
let currentPath = ''

function PathProbe() {
  currentPath = useLocation().pathname
  return null
}

function setFlags(flags: { hasStarted: boolean; profileCreated: boolean; introCompleted: boolean }) {
  useGameStore.setState(flags)
}

function renderAt(initial: string) {
  root.render(
    <MemoryRouter initialEntries={[initial]}>
      <PathProbe />
      <Routes>
        <Route path="/" element={<Boot />} />
        <Route path="/welcome" element={<p>welcome</p>} />
        <Route path="/profile" element={<p>profile</p>} />
        <Route path="/intro" element={<p>intro</p>} />
        <Route path="/hub" element={<p>hub</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function settle(rounds = 5) {
  for (let i = 0; i < rounds; i++) await act(async () => {})
}

function tap(label: string) {
  const button = Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(label),
  )
  expect(button, `a button labelled "${label}" should be rendered`).toBeTruthy()
  return act(async () => {
    ;(button as HTMLButtonElement).click()
  })
}

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers()
  warm.reset()
  window.localStorage.clear()
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
  window.localStorage.clear()
  __setInstallPromptForTests(null)
  vi.useRealTimers()
})

describe('the boot splash', () => {
  beforeEach(() => {
    window.localStorage.setItem('quizon.bootSeen', '1')
  })

  it('shows the mark, the subtitle and the bar before anything is fetched', async () => {
    renderAt('/')
    await settle()

    expect(container.querySelector('img[src="/assets/brand/quizon-logo.png"]')).toBeTruthy()
    expect(container.textContent).toContain('The Reading Quest')
    expect(container.textContent).toContain('0%')
    expect(container.textContent).toContain('Tip:')
    expect(currentPath).toBe('/')
  })

  it('reports the warm-up progress as it arrives', async () => {
    renderAt('/')
    await settle()

    await act(async () => {
      warm.report(5, 10)
    })
    expect(container.textContent).toContain('50%')
  })

  it('announces progress in quarters rather than on every tick', async () => {
    renderAt('/')
    await settle()

    await act(async () => {
      warm.report(5, 10)
    })
    expect(container.textContent).toContain('Loading, 50 percent.')
  })
})

describe('a first launch', () => {
  it('offers the download before it downloads anything', async () => {
    renderAt('/')
    await settle()

    expect(container.textContent).toContain('Download and play offline')
    expect(container.textContent).toContain('Continue playing in browser')
    expect(warm.started, 'nothing should download before the child chooses').toBe(0)
    expect(currentPath).toBe('/')
  })

  it('downloads on the tap, then stops at a Start button', async () => {
    renderAt('/')
    await settle()

    await tap('Download and play offline')
    await settle()
    expect(warm.started).toBe(1)
    expect(container.textContent).toContain('Getting the game ready')
    expect(window.localStorage.getItem('quizon.bootSeen')).toBe('1')

    await act(async () => {
      warm.finish()
    })
    await settle()
    expect(container.textContent).toContain('All set!')

    await tap('Start playing')
    await settle()
    expect(currentPath).toBe('/welcome')
  })

  it('the browser option also remembers the gate and warms up', async () => {
    renderAt('/')
    await settle()

    await tap('Continue playing in browser')
    await settle()
    expect(warm.started).toBe(1)
    expect(window.localStorage.getItem('quizon.bootSeen')).toBe('1')

    await act(async () => {
      warm.finish()
    })
    await settle()
    await tap('Start playing')
    await settle()
    expect(currentPath).toBe('/welcome')
  })

  it('calls the browser install prompt from the download tap', async () => {
    const prompt = vi.fn(async () => {})
    __setInstallPromptForTests({
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    } as never)

    renderAt('/')
    await settle()
    await tap('Download and play offline')
    await settle()

    expect(prompt).toHaveBeenCalledTimes(1)
  })
})

describe('a returning launch', () => {
  beforeEach(() => {
    window.localStorage.setItem('quizon.bootSeen', '1')
  })

  it('warms up immediately, then waits at Continue playing', async () => {
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: true })
    renderAt('/')
    await settle()

    expect(warm.started, 'a returning launch downloads at once').toBe(1)
    expect(currentPath).toBe('/')

    await act(async () => {
      warm.finish()
    })
    await settle()
    expect(container.textContent).toContain('Continue playing')
    expect(currentPath).toBe('/')

    await tap('Continue playing')
    await settle()
    expect(currentPath).toBe('/hub')
  })

  it('resumes a mid-setup learner at their own stop', async () => {
    setFlags({ hasStarted: true, profileCreated: false, introCompleted: false })
    renderAt('/')
    await settle()

    await act(async () => {
      warm.finish()
    })
    await settle()
    await tap('Continue playing')
    await settle()
    expect(currentPath).toBe('/profile')
  })
})

describe('internal bounces', () => {
  it('does not show the gate again once this page load is warm', async () => {
    warm.done = true
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: true })
    renderAt('/')
    await settle()

    expect(currentPath).toBe('/hub')
    expect(container.querySelector('img[src="/assets/brand/quizon-logo.png"]')).toBeNull()
  })
})
