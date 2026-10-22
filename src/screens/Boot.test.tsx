import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Boot } from '@/screens/Boot'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE BOOT SCREEN.

   Two things are being checked here, and they are the two things that can
   break:

   1. THE SPLASH IS REAL. The mark, the subtitle, the bar and the percentage
      are all on screen BEFORE anything is fetched. A loading screen that
      renders empty and then fills in is worse than no loading screen.

   2. THE WARM-UP GATES THE NAVIGATION. Boot used to redirect instantly, and
      the redirect is now deliberately held until the app is warm. If that
      ordering is ever flipped back, the bar will never appear - which is
      exactly what happened the first time this screen was written.

   The warm-up is stubbed, because a routing test that also downloads twelve
   route chunks and eighteen pictures is a test that fails on a slow machine
   and tells you nothing. The real warm-up is lib/preload.ts's business, and
   preload.test.ts covers the part of it that can be wrong.
   =========================================================================== */

const warm = vi.hoisted(() => {
  let finish: (() => void) | null = null
  return {
    /** True once the app is warm, which is what a second visit to "/" sees. */
    done: false,
    listeners: [] as Array<(p: { done: number; total: number }) => void>,
    reset() {
      this.done = false
      this.listeners = []
      finish = null
    },
    start(): Promise<void> {
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

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers()
  warm.reset()
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

describe('the boot splash', () => {
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

describe('the boot navigation', () => {
  it('sends a fresh learner to Welcome, but only once the app is warm', async () => {
    renderAt('/')
    await settle()
    expect(currentPath).toBe('/')

    await act(async () => {
      warm.finish()
    })
    await settle()
    expect(currentPath).toBe('/welcome')
  })

  it('sends a returning learner to the hub', async () => {
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: true })
    renderAt('/')
    await settle()

    await act(async () => {
      warm.finish()
    })
    await settle()
    expect(currentPath).toBe('/hub')
  })

  it('does not show the splash again once the app is already warm', async () => {
    warm.done = true
    setFlags({ hasStarted: true, profileCreated: true, introCompleted: true })
    renderAt('/')
    await settle()

    expect(currentPath).toBe('/hub')
    expect(container.querySelector('img[src="/assets/brand/quizon-logo.png"]')).toBeNull()
  })
})
