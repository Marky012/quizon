import { Navigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'

/**
 * BOOT - decides where a returning learner lands.
 *
 * Deliberately instant and tap-free. The only thing that must happen before
 * paint is reading persisted state, and zustand's persist rehydration is
 * synchronous for localStorage, so this is a single render rather than a
 * loading spinner a child has to wait through.
 */
export function Boot() {
  const hasStarted = useGameStore((s) => s.hasStarted)
  const profileCreated = useGameStore((s) => s.profileCreated)
  const introCompleted = useGameStore((s) => s.introCompleted)

  if (!hasStarted) return <Navigate to="/welcome" replace />
  if (!profileCreated) return <Navigate to="/profile" replace />
  if (!introCompleted) return <Navigate to="/intro" replace />
  return <Navigate to="/hub" replace />
}