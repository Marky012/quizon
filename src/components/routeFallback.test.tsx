import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ArenaFallback,
  DevFallback,
  HubFallback,
  IntroFallback,
  PreTestFallback,
  ProfileFallback,
  QuizFallback,
  RecordFallback,
  ResultFallback,
  SettingsFallback,
  SkillLessonFallback,
  SkillsFallback,
  WelcomeFallback,
} from '@/components/RouteFallback'
import { SKILLS } from '@/content/manifest'
import { SPECIES_NAME } from '@/content/schemas'
import { TIER_ORDER, WORLD } from '@/content/world'
import {
  ArenaRoute,
  HubRoute,
  IntroRoute,
  PreTestRoute,
  ProfileRoute,
  QuizRoute,
  RecordRoute,
  ResultRoute,
  SettingsRoute,
  SkillLessonRoute,
  SkillsRoute,
  WelcomeRoute,
} from '@/lazyRoutes'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE ROUTE FALLBACKS, MOUNTED UNDER A REAL ROUTER.

   Every navigation after the first one renders one of these before the screen
   itself exists, so two properties matter more than any other and neither
   survives a static read of RouteFallback.tsx:

   1. THE HEADER IS ALREADY THE DESTINATION'S HEADER. A fallback that says
      "QuizOn!" over a Skill Lesson changes every word in the top 100px of the
      screen when the chunk lands. The titles below are read from the same
      content tables the real screens read, so asserting them here also
      asserts that the fallback resolves params the way the screen does.
   2. THE SKELETON IS INERT AND THE LOADING LINE ISN'T. aria-hidden regions
      must hold nothing a keyboard can reach, and exactly one role="status"
      must announce the wait.

   Same harness as appBack.test.tsx and onboardingGates.test.tsx: React 19
   ships act(), and no @testing-library is used anywhere in this repo.
   =========================================================================== */

let container: HTMLDivElement
let root: Root

const FIRST_SKILL = SKILLS[0]!
const FIRST_TIER = TIER_ORDER[0]

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

function mount(pattern: string, initial: string, element: ReactElement) {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path={pattern} element={element} />
        </Routes>
      </MemoryRouter>,
    )
  })
}

const heading = () => container.querySelector('h1')?.textContent?.trim() ?? null
const subtitle = () => container.querySelector('header p')?.textContent?.trim() ?? null
const statuses = () => container.querySelectorAll('[role="status"]')

/** Nothing a keyboard can reach may sit inside an aria-hidden region. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
function expectNoFocusableInHidden() {
  for (const hidden of container.querySelectorAll('[aria-hidden="true"]')) {
    const hit = hidden.matches(FOCUSABLE) ? hidden : hidden.querySelector(FOCUSABLE)
    expect(hit, 'an aria-hidden region must contain nothing focusable').toBeNull()
  }
}

type Spec = {
  name: string
  pattern: string
  initial: string
  element: ReactElement
  title: string | null
}

const SPECS: Spec[] = [
  {
    name: 'welcome',
    pattern: '/welcome',
    initial: '/welcome',
    element: <WelcomeFallback />,
    // The logo IS the header on the real screen, so there is no h1 to match.
    title: null,
  },
  {
    name: 'profile',
    pattern: '/profile',
    initial: '/profile',
    element: <ProfileFallback />,
    title: 'Who are you?',
  },
  {
    name: 'intro',
    pattern: '/intro',
    initial: '/intro',
    element: <IntroFallback />,
    title: 'Before you start',
  },
  {
    name: 'skills',
    pattern: '/skills',
    initial: '/skills',
    element: <SkillsFallback />,
    title: `${SPECIES_NAME} School`,
  },
  {
    name: 'skill lesson',
    pattern: '/skill/:id',
    initial: `/skill/${FIRST_SKILL.id}`,
    element: <SkillLessonFallback />,
    title: FIRST_SKILL.name,
  },
  {
    name: 'pre-test',
    pattern: '/pretest/:id',
    initial: `/pretest/${FIRST_SKILL.id}`,
    element: <PreTestFallback />,
    title: `Check: ${FIRST_SKILL.name}`,
  },
  {
    name: 'arena',
    pattern: '/arena',
    initial: '/arena',
    element: <ArenaFallback />,
    title: WORLD.stages.arena.name,
  },
  {
    name: 'quiz',
    pattern: '/quiz/:level',
    initial: `/quiz/${FIRST_TIER}`,
    element: <QuizFallback />,
    title: WORLD.tiers[FIRST_TIER].name,
  },
  {
    name: 'result',
    pattern: '/result/:level',
    initial: `/result/${FIRST_TIER}`,
    element: <ResultFallback />,
    title: `${WORLD.tiers[FIRST_TIER].name} results`,
  },
  {
    name: 'record',
    pattern: '/record',
    initial: '/record',
    element: <RecordFallback />,
    title: 'My reading record',
  },
  {
    name: 'settings',
    pattern: '/settings',
    initial: '/settings',
    element: <SettingsFallback />,
    title: 'Settings',
  },
  {
    name: 'dev bypass',
    pattern: '/dev',
    initial: '/dev',
    element: <DevFallback />,
    title: 'Dev bypass',
  },
]

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useGameStore.getState().resetGame()
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

describe('header parity', () => {
  it.each(SPECS)('$name announces its own destination title', ({ pattern, initial, element, title }) => {
    mount(pattern, initial, element)
    expect(heading()).toBe(title)
  })

  it('intro carries the real panel counter', () => {
    mount('/intro', '/intro', <IntroFallback />)
    expect(subtitle()).toBe(`Panel 1 of ${WORLD.intro.length}`)
  })

  it('skills carries the real lesson count from the store', () => {
    mount('/skills', '/skills', <SkillsFallback />)
    expect(subtitle()).toBe(`0 of ${SKILLS.length} lessons done`)
  })

  it('quiz carries the real "correct so far" line', () => {
    mount('/quiz/:level', `/quiz/${FIRST_TIER}`, <QuizFallback />)
    expect(subtitle()).toBe('0 correct so far')
  })

  it('dev bypass is the one fallback that shows a generic loading line', () => {
    mount('/dev', '/dev', <DevFallback />)
    expect(subtitle()).toBe('Just a moment')
  })
})

describe('invalid params mirror the screens\' own guards', () => {
  it('a bad skill id draws the lesson guard, with back and no subtitle', () => {
    mount('/skill/:id', '/skill/nope', <SkillLessonFallback />)
    expect(heading()).toBe('Lesson')
    expect(subtitle()).toBeNull()
    expect(container.querySelector('button[aria-label="Go back"]')).toBeTruthy()
    expect(container.querySelector('main p.card-cream')).toBeTruthy()
  })

  it('a bad pre-test id draws the check guard', () => {
    mount('/pretest/:id', '/pretest/nope', <PreTestFallback />)
    expect(heading()).toBe('Check')
    expect(container.querySelector('button[aria-label="Go back"]')).toBeTruthy()
  })

  it('a bad level draws the quiz guard, with no back and no progress bar', () => {
    mount('/quiz/:level', '/quiz/nope', <QuizFallback />)
    expect(heading()).toBe('Level')
    expect(subtitle()).toBeNull()
    expect(container.querySelector('button[aria-label="Go back"]')).toBeNull()
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
  })

  it('a bad result level draws the results guard', () => {
    mount('/result/:level', '/result/nope', <ResultFallback />)
    expect(heading()).toBe('Results')
    expect(subtitle()).toBeNull()
    expect(container.querySelector('button[aria-label="Go back"]')).toBeNull()
  })
})

describe('the loading announcement', () => {
  it.each(SPECS)('$name speaks exactly one status', ({ pattern, initial, element }) => {
    mount(pattern, initial, element)
    expect(statuses()).toHaveLength(1)
  })

  it('quiz passes its own transient message through to the status', () => {
    mount('/quiz/:level', `/quiz/${FIRST_TIER}`, <QuizFallback note="Choosing your story…" />)
    expect(statuses()[0]?.textContent).toBe('Choosing your story…')
  })
})

describe('inertness', () => {
  it.each(SPECS)('$name keeps every skeleton out of the tab order', ({ pattern, initial, element }) => {
    mount(pattern, initial, element)
    expectNoFocusableInHidden()
  })
})

describe('shape', () => {
  it('welcome draws the full helper grid, with the store pick marked', () => {
    mount('/welcome', '/welcome', <WelcomeFallback />)
    expect(container.querySelectorAll('.grid-cols-4 > div')).toHaveLength(SKILLS.length)
    // avatarId starts at the first pup, so its cell is the turquoise one.
    expect(container.querySelectorAll('.grid-cols-4 > .bg-turquoise')).toHaveLength(1)
  })

  it('profile draws both picture cards', () => {
    mount('/profile', '/profile', <ProfileFallback />)
    expect(container.querySelectorAll('.grid-cols-2 > div')).toHaveLength(2)
  })

  it('record mirrors the real table and the three always-present level rows', () => {
    mount('/record', '/record', <RecordFallback />)
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(SKILLS.length)
    expect(container.querySelectorAll('main ul > li')).toHaveLength(TIER_ORDER.length)
  })

  it('settings draws its two cards and nothing else', () => {
    mount('/settings', '/settings', <SettingsFallback />)
    expect(container.querySelectorAll('main li.card-cream')).toHaveLength(2)
  })

  it('hub draws three stage cards over the real grass bench', () => {
    mount('/hub', '/hub', <HubFallback />)
    expect(container.querySelectorAll('.stage-card')).toHaveLength(3)
    expect(container.querySelector('img[src$="grass.png"]')).toBeTruthy()
  })
})

describe('store-driven conditionals', () => {
  it('hub withholds the third card\'s progress row until something is answered', () => {
    mount('/hub', '/hub', <HubFallback />)
    // Lessons and levels always have a row; the chronicle does not at 0 answers.
    expect(container.querySelectorAll('.stage-progress')).toHaveLength(2)

    act(() => {
      useGameStore.setState({ totals: { correct: 4, incorrect: 2 } })
    })
    expect(container.querySelectorAll('.stage-progress')).toHaveLength(3)
  })

  it('skills reports the real lesson count once a lesson is complete', () => {
    mount('/skills', '/skills', <SkillsFallback />)
    act(() => {
      const skills = useGameStore.getState().skills.map((k, i) =>
        i === 0 ? { ...k, lessonComplete: true } : k,
      )
      useGameStore.setState({ skills })
    })
    expect(subtitle()).toBe(`1 of ${SKILLS.length} lessons done`)
  })

  it('arena draws no resume banner for a learner with nothing in progress', () => {
    mount('/arena', '/arena', <ArenaFallback />)
    expect(container.querySelector('.bg-turquoise-soft')).toBeNull()
  })

  it('arena draws the resume banner when the store holds an interrupted attempt', () => {
    mount('/arena', '/arena', <ArenaFallback />)
    act(() => {
      useGameStore.setState({
        activeAttempts: {
          [FIRST_TIER]: {
            tierId: FIRST_TIER,
            storyId: 'T1',
            seed: 1,
            questionIds: Array.from({ length: 20 }, (_, i) => `q${i}`),
            index: 6,
            correct: 4,
            missedSkills: [],
            startedAt: Date.now(),
          },
        },
      })
    })
    expect(container.querySelector('.bg-turquoise-soft')).toBeTruthy()
  })

  it('arena with every pup earned opens exactly the first level', () => {
    mount('/arena', '/arena', <ArenaFallback />)
    // Fresh: nothing earned, so all three places are locked.
    expect(container.querySelectorAll('.stage-card')).toHaveLength(0)
    expect(container.querySelectorAll('.stage-card-locked')).toHaveLength(TIER_ORDER.length)

    act(() => {
      const skills = useGameStore.getState().skills.map((k) => ({ ...k, pupEarned: true }))
      useGameStore.setState({ skills })
    })
    expect(container.querySelectorAll('.stage-card')).toHaveLength(1)
    expect(container.querySelectorAll('.stage-card-locked')).toHaveLength(TIER_ORDER.length - 1)
  })
})

describe('route table wiring', () => {
  it('every lazy route carries its own screen-specific fallback', () => {
    expect(WelcomeRoute.fallback).toBe(WelcomeFallback)
    expect(ProfileRoute.fallback).toBe(ProfileFallback)
    expect(IntroRoute.fallback).toBe(IntroFallback)
    expect(HubRoute.fallback).toBe(HubFallback)
    expect(SkillsRoute.fallback).toBe(SkillsFallback)
    expect(SkillLessonRoute.fallback).toBe(SkillLessonFallback)
    expect(PreTestRoute.fallback).toBe(PreTestFallback)
    expect(ArenaRoute.fallback).toBe(ArenaFallback)
    expect(QuizRoute.fallback).toBe(QuizFallback)
    expect(ResultRoute.fallback).toBe(ResultFallback)
    expect(RecordRoute.fallback).toBe(RecordFallback)
    expect(SettingsRoute.fallback).toBe(SettingsFallback)
  })
})
