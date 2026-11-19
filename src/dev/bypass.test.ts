import { beforeEach, describe, expect, it } from 'vitest'
import { TIER_ORDER } from '@/content/world'
import { SKILLS } from '@/content/manifest'
import { bootSeen } from '@/lib/install'
import {
  selectAvailableTiers,
  selectHintUnlocked,
  useGameStore,
} from '@/store/gameStore'
import { applyDevPreset, DEV_SEED_KEY, seedDevMode } from './bypass'

describe('devmode bypass presets', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetGame()
  })

  it('applyDevPreset("everything") unlocks all skills, pups, and tiers with an active hard attempt', async () => {
    await applyDevPreset('everything')

    const s = useGameStore.getState()
    expect(s.hasStarted).toBe(true)
    expect(s.profileCreated).toBe(true)
    expect(s.introCompleted).toBe(true)
    expect(s.playerFullName).toBe('Grade 5 Reader')
    expect(s.playerNickname).toBe('Reader')

    expect(s.skills).toHaveLength(SKILLS.length)
    for (const skill of s.skills) {
      expect(skill.lessonComplete).toBe(true)
      expect(skill.pupEarned).toBe(true)
      expect(skill.bestPreTestScore).toBe(100)
    }

    const available = selectAvailableTiers(s)
    for (const tierId of TIER_ORDER) {
      expect(available.has(tierId)).toBe(true)
      expect(s.tiers[tierId]?.bestScore).toBeGreaterThanOrEqual(70)
    }

    const activeHard = s.activeAttempts.hard
    expect(activeHard).toBeDefined()
    expect(s.tiers.hard?.storyId).toBe(activeHard?.storyId)
    expect(s.tiers.hard?.answeredCorrectThisAttempt).toBe(true)
    expect(selectHintUnlocked(s, 'hard')).toBe(true)
    expect(window.localStorage.getItem(DEV_SEED_KEY)).toBe('everything')
  })

  it('seedDevMode() automatically seeds "everything" and marks bootSeen on first launch', async () => {
    expect(bootSeen()).toBe(false)
    expect(useGameStore.getState().hasStarted).toBe(false)

    await seedDevMode()

    const s = useGameStore.getState()
    expect(bootSeen()).toBe(true)
    expect(s.hasStarted).toBe(true)
    expect(s.profileCreated).toBe(true)
    expect(s.introCompleted).toBe(true)
    expect(selectAvailableTiers(s).size).toBe(TIER_ORDER.length)
    expect(window.localStorage.getItem(DEV_SEED_KEY)).toBe('everything')
  })

  it('seedDevMode() preserves in-session learner edits on subsequent launches', async () => {
    await seedDevMode()
    useGameStore.getState().setAvatar('pipoy')
    useGameStore.getState().clearAttempt('hard')

    await seedDevMode()

    const s = useGameStore.getState()
    expect(s.avatarId).toBe('pipoy')
    expect(s.activeAttempts.hard).toBeUndefined()
  })

  it('seedDevMode() respects an explicit switch to the "fresh" preset on /dev', async () => {
    await seedDevMode()
    await applyDevPreset('fresh')
    expect(useGameStore.getState().hasStarted).toBe(false)
    expect(window.localStorage.getItem(DEV_SEED_KEY)).toBe('fresh')

    await seedDevMode()

    expect(useGameStore.getState().hasStarted).toBe(false)
    expect(window.localStorage.getItem(DEV_SEED_KEY)).toBe('fresh')
  })

  it('seedDevMode() re-seeds "everything" if saved game progress was cleared without "fresh"', async () => {
    await seedDevMode()
    useGameStore.getState().resetGame()
    expect(useGameStore.getState().hasStarted).toBe(false)

    await seedDevMode()

    expect(useGameStore.getState().hasStarted).toBe(true)
    expect(useGameStore.getState().tiers.hard?.bestScore).toBeGreaterThanOrEqual(70)
  })
})
