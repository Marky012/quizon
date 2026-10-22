import { describe, expect, it, vi } from 'vitest'
import {
  __setInstallPromptForTests,
  installAvailable,
  promptInstall,
  subscribeInstall,
} from './install'

/* ===========================================================================
   THE INSTALL OFFER.

   The whole feature rests on three things being true, and each one has a way
   of quietly going wrong:

   1. A subscriber hears about the offer the moment the browser makes it. If
      it does not, the button never appears and the feature silently does
      nothing.
   2. The browser's prompt is actually called when the button is tapped. If it
      is not, the button is a decoration.
   3. The offer is SPENT after one use, because the browser's event cannot be
      reused. A button that stays on screen after a tap invites a second tap
      that does nothing.
   =========================================================================== */

/** The event type, minus the null that the setter also accepts. */
type InstallEvent = NonNullable<Parameters<typeof __setInstallPromptForTests>[0]>

function fakePrompt(outcome: 'accepted' | 'dismissed' = 'accepted'): InstallEvent {
  return {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
  } as unknown as InstallEvent
}

describe('the install offer', () => {
  it('is not available until the browser makes one', () => {
    __setInstallPromptForTests(null)
    expect(installAvailable()).toBe(false)
  })

  it('tells a subscriber the moment it becomes available', () => {
    __setInstallPromptForTests(null)
    const seen: boolean[] = []
    const unsubscribe = subscribeInstall((a) => seen.push(a))

    __setInstallPromptForTests(fakePrompt())
    expect(seen).toEqual([true])
    expect(installAvailable()).toBe(true)

    unsubscribe()
    __setInstallPromptForTests(null)
    expect(seen).toEqual([true])
  })

  it('tells a late subscriber what it missed', () => {
    __setInstallPromptForTests(fakePrompt())
    const seen: boolean[] = []
    subscribeInstall((a) => seen.push(a))
    expect(seen).toEqual([true])
  })

  it('calls the browser prompt when the button is tapped', async () => {
    const event = fakePrompt('accepted')
    __setInstallPromptForTests(event)

    const outcome = await promptInstall()
    expect(outcome).toBe('accepted')
    expect(event.prompt).toHaveBeenCalledTimes(1)
  })

  it('is spent after one use, because the browser event cannot be reused', async () => {
    __setInstallPromptForTests(fakePrompt())
    await promptInstall()

    expect(installAvailable()).toBe(false)
    expect(await promptInstall()).toBe('unavailable')
  })

  it('reports unavailable rather than throwing when there is no offer', async () => {
    __setInstallPromptForTests(null)
    expect(await promptInstall()).toBe('unavailable')
  })
})
