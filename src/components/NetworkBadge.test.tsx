import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NetworkBadge } from '@/components/NetworkBadge'

/* ===========================================================================
   THE NETWORK BADGE - the two events and the initial read.

   The whole component is one boolean with one listener per browser event, so
   the contract is exactly that: it believes navigator.onLine at mount, and it
   follows the online/offline events afterwards. If this ever grows a fetch or a
   timer, this test is the place that says so.
   =========================================================================== */

let container: HTMLDivElement
let root: Root

function mount(el: ReactElement) {
  act(() => root.render(el))
}

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

function text() {
  return container.textContent?.trim()
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('NetworkBadge', () => {
  it('reports online when the browser says so', () => {
    setOnline(true)
    mount(<NetworkBadge />)
    expect(text()).toBe('Online')
  })

  it('reports offline at mount when the browser is offline', () => {
    setOnline(false)
    mount(<NetworkBadge />)
    expect(text()).toBe('Offline')
  })

  it('follows the offline and online events while mounted', () => {
    setOnline(true)
    mount(<NetworkBadge />)

    setOnline(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(text()).toBe('Offline')

    setOnline(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(text()).toBe('Online')
  })
})
