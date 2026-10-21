import { useEffect, useState } from 'react'

/**
 * Tracks the OS "reduce motion" setting.
 *
 * Art bible 10.2: when motion is reduced, fades only. No scaling, no particles,
 * no bounce. The app must be FULLY usable and fully legible with motion off,
 * so callers use this to swap an animation class for a plain render rather than
 * to hide information.
 *
 * index.css already neutralises the keyframes globally. This hook exists for
 * the cases CSS cannot express: whether to render a burst at all, whether to
 * mount a celebratory animation.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}