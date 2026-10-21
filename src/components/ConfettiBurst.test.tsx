import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfettiBurst } from '@/components/ConfettiBurst'

/* ===========================================================================
   CONFETTI BURST - rendering rules only.

   The burst is pure decoration, so its contract is cheap to pin: it renders
   one span per piece (the shared `--animate-confetti` keyframe and the inline
   per-piece custom properties do the actual falling), the overlay never
   intercepts clicks, and under reduced motion it renders NOTHING at all -
   the celebration is carried by the bench/colour, not by this component.
   =========================================================================== */

let container: HTMLDivElement
let root: Root

function mount(el: ReactElement) {
  act(() => root.render(el))
}

/** The lib hook reads window.matchMedia once at mount, then subscribes. */
function stubMatchMedia(matches: boolean) {
  window.matchMedia = (() => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('ConfettiBurst', () => {
  it('renders one piece span per fall, nothing clickable, whole viewport', () => {
    stubMatchMedia(false)
    mount(<ConfettiBurst />)

    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).not.toBeNull()
    expect(overlay!.className).toContain('pointer-events-none')
    expect(overlay!.className).toContain('fixed')
    expect(overlay!.className).toContain('overflow-hidden')

    const pieces = overlay!.querySelectorAll<HTMLElement>(':scope > span')
    expect(pieces.length).toBe(26)
    pieces.forEach((p) => {
      // Per-piece motion is inline longhands over the shared token.
      expect(Number.parseFloat(p.style.animationDuration)).toBeGreaterThan(0)
      expect(p.style.getPropertyValue('--cf-drift')).not.toBe('')
      expect(p.style.getPropertyValue('--cf-rot')).not.toBe('')
    })
  })

  it('renders nothing when the OS asks for reduced motion', () => {
    stubMatchMedia(true)
    mount(<ConfettiBurst />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})