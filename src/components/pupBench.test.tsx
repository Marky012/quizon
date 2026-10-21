import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PupBench } from '@/components/PupBench'
import { SKILLS } from '@/content/manifest'
import { useGameStore } from '@/store/gameStore'

/* ===========================================================================
   THE PUP BENCH - earned vs unearned teaching.

   The bench is the one place the whole cast is on screen at once, and the
   earned/unearned story is told with colour: an earned pup renders its art at
   full colour, an unearned one gets the grayscale filter. This test pins that
   rule to the store's pupEarned flags and to the manifest ORDER (the row
   renders the manifest's eight pups, one per column, in that order).
   =========================================================================== */

let container: HTMLDivElement
let root: Root

function mount(el: ReactElement) {
  act(() => root.render(el))
}

function earnedPupIds(got: ReadonlyArray<string>): Set<string> {
  return new Set(SKILLS.filter((s) => got.includes(s.id)).map((s) => s.pup.id))
}

/** Picks the avatar <img> and its wrapper per pup id, out of document order. */
function avatarFor(containerEl: Element, pupId: string) {
  const img = Array.from(containerEl.querySelectorAll<HTMLImageElement>('img[src*="-avatar"]')).find(
    (i) => i.getAttribute('src')?.includes(`/${pupId}-avatar.png`),
  )
  return img ? { img, wrapper: img.parentElement! } : null
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  useGameStore.getState().resetGame()
  vi.useFakeTimers()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('PupBench earned grayscale', () => {
  it('greyscales every pup the store has not marked earned', () => {
    mount(<PupBench />)

    expect(container.querySelectorAll('img[src*="-avatar"]')).toHaveLength(SKILLS.length)
    SKILLS.forEach((skill) => {
      const got = avatarFor(container, skill.pup.id)
      expect(got, skill.pup.id).not.toBeNull()
      expect(got!.wrapper.className, `${skill.pup.id} unearned`).toContain('grayscale')
    })
  })

  it('shows earned pups in full colour', () => {
    const got = ['text-type', 'wh-questions']
    const wantEarned = earnedPupIds(got)

    act(() => {
      useGameStore.setState({
        skills: useGameStore.getState().skills.map((k) => ({
          ...k,
          pupEarned: wantEarned.has(
            SKILLS.find((s) => s.id === k.id)?.pup.id ?? '',
          ),
        })),
      })
    })

    mount(<PupBench />)

    SKILLS.forEach((skill) => {
      const got2 = avatarFor(container, skill.pup.id)
      expect(got2, skill.pup.id).not.toBeNull()
      if (wantEarned.has(skill.pup.id)) {
        expect(got2!.wrapper.className, `${skill.pup.id} earned`).not.toContain('grayscale')
      } else {
        expect(got2!.wrapper.className, `${skill.pup.id} unearned`).toContain('grayscale')
      }
    })
  })

  it('clears the grayscale live when the store marks a pup earned while mounted', () => {
    mount(<PupBench />)
    const pup = SKILLS[0]!.pup
    const before = avatarFor(container, pup.id)
    expect(before!.wrapper.className).toContain('grayscale')

    act(() => {
      useGameStore.setState({
        skills: useGameStore.getState().skills.map((k, i) =>
          i === 0 ? { ...k, pupEarned: true } : k,
        ),
      })
    })

    const after = avatarFor(container, pup.id)
    expect(after!.wrapper.className).not.toContain('grayscale')
  })
})