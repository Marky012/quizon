import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppHistoryRecorder, useAppBack } from '@/lib/appBack'

/* ===========================================================================
   REGRESSION TESTS FOR IN-APP BACK NAVIGATION.

   These exist because the bug was invisible in the source. Every screen looked
   reasonable: a header button, an onClick, a navigate call. It only misbehaved
   on a real device, in a real sequence, where the browser's history contained
   entries the app had never seen. The only honest way to pin this down is to
   drive an actual router and assert where back lands.

   No @testing-library here on purpose - the project does not depend on it, and
   adding a test-only dependency to a build this size is a bigger change than the
   fix. React 19 ships its own act(), and createRoot is all that is needed to
   mount a real router and click real buttons.
   =========================================================================== */

let container: HTMLDivElement
let root: Root

/** Current pathname, readable from outside React. */
let currentPath = ''

function PathProbe() {
  currentPath = useLocation().pathname
  return null
}

function Screen({ name, fallback }: { name: string; fallback?: string }) {
  const back = useAppBack(fallback ?? '/hub')
  return (
    <div>
      <span data-testid={`screen-${name}`}>{name}</span>
      <button type="button" onClick={back}>
        back
      </button>
    </div>
  )
}

const SCREENS: Record<string, { fallback?: string }> = {
  '/hub': {},
  '/arena': {},
  '/skills': {},
  '/quiz/easy': { fallback: '/arena' },
  '/record': {},
}

/** A real anchor, so history grows the way it does when a child taps a card. */
function Link({ to, children }: { to: string; children: string }) {
  const navigate = useNavigate()
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

function render(initial: string, screens: Record<string, { fallback?: string }> = SCREENS) {
  root.render(
    <MemoryRouter initialEntries={[initial]}>
      <AppHistoryRecorder />
      <PathProbe />
      <nav>
        {Object.keys(screens).map((path) => (
          <Link key={path} to={path}>
            {path}
          </Link>
        ))}
      </nav>
      <Routes>
        {Object.entries(screens).map(([path, opts]) => (
          <Route key={path} path={path} element={<Screen name={path} fallback={opts.fallback} />} />
        ))}
        <Route path="*" element={<Screen name="other" fallback={screens[initial]?.fallback} />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Click every visible back button, the way a child's thumb does. */
async function clickBack() {
  const btn = Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent === 'back',
  )
  expect(btn, 'a back button should be rendered').toBeTruthy()
  await act(async () => {
    ;(btn as HTMLButtonElement).click()
  })
}

/** Navigate forward by clicking a link, so history grows the way it does in use. */
async function go(to: string) {
  const link = container.querySelector<HTMLAnchorElement>(`a[href="${to}"]`)
  expect(link, `a link to ${to} should exist`).toBeTruthy()
  await act(async () => {
    ;(link as HTMLAnchorElement).click()
  })
}

/**
 * React only trusts act() when it has been told this is a test environment.
 * Without this flag every act() call logs "the current testing environment is
 * not configured to support act(...)", which buries real failures in noise.
 */
declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  sessionStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
})

describe('in-app back navigation', () => {
  it('returns to the screen the learner actually came from', async () => {
    render('/hub', SCREENS)
    await act(async () => {})
    await go('/arena')
    expect(currentPath).toBe('/arena')
    await go('/quiz/easy')
    expect(currentPath).toBe('/quiz/easy')

    await clickBack()
    expect(currentPath).toBe('/arena')
  })

  it('unwinds several screens in order, not just one level', async () => {
    render('/hub', SCREENS)
    await act(async () => {})
    await go('/skills')
    await go('/arena')
    await go('/quiz/easy')

    await clickBack()
    expect(currentPath).toBe('/arena')
    await clickBack()
    expect(currentPath).toBe('/skills')
    await clickBack()
    expect(currentPath).toBe('/hub')
  })

  it('skips a finished pre-test flow when returning to Woof School', async () => {
    // hub -> Woof School -> lesson -> pre-test, then the done screen's
    // "Back to Woof School" button PUSHes /skills again. Back from Woof School
    // must land on the hub, not re-open the pre-test the learner just finished
    // and unwind through it one tap at a time.
    render('/hub', {
      '/hub': {},
      '/skills': {},
      '/skill/1': {},
      '/pretest/1': {},
    })
    await act(async () => {})
    await go('/skills')
    await go('/skill/1')
    await go('/pretest/1')
    await go('/skills') // the done screen's "Back to Woof School" button

    await clickBack()
    expect(currentPath).toBe('/hub')
  })

  it('returns to Woof School when the done screen re-opens the lesson', async () => {
    render('/hub', {
      '/hub': {},
      '/skills': {},
      '/skill/1': {},
      '/pretest/1': {},
    })
    await act(async () => {})
    await go('/skills')
    await go('/skill/1')
    await go('/pretest/1')
    await go('/skill/1') // the done screen's "Look at the lesson again" button

    await clickBack()
    expect(currentPath).toBe('/skills')
  })

  it('uses the fallback on a cold deep link, with nothing behind it', async () => {
    // A bookmark, or a link a teacher pasted. There is no previous screen, and
    // the learner must still land somewhere real rather than on a dead button.
    render('/quiz/easy', SCREENS)
    await act(async () => {})

    await clickBack()
    expect(currentPath).toBe('/arena')
  })

  it('falls back rather than throwing when storage is unavailable', async () => {
    // Private browsing can make sessionStorage throw on write. Back has to keep
    // working; worst case it loses precision.
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    try {
      render('/quiz/easy', SCREENS)
      await act(async () => {})
      await clickBack()
      expect(currentPath).toBe('/arena')
    } finally {
      Storage.prototype.setItem = setItem
    }
  })

  it('survives corrupt stored JSON', async () => {
    sessionStorage.setItem('quizon:back-stack', '{not json at all')
    render('/quiz/easy', SCREENS)
    await act(async () => {})
    await clickBack()
    expect(currentPath).toBe('/arena')
  })

  it('ignores a stored stack that is not an array of strings', async () => {
    sessionStorage.setItem('quizon:back-stack', JSON.stringify([1, null, { a: 1 }]))
    render('/quiz/easy', SCREENS)
    await act(async () => {})
    await clickBack()
    expect(currentPath).toBe('/arena')
  })
})

