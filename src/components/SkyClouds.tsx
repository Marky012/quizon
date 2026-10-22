import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'

/* ===========================================================================
   SKY CLOUDS - a slow, quiet drift behind every screen.

   THE LAYERING IS DONE IN CSS. The app backdrop is body::before at z-index
   -1; .cloud-layer is also z-index -1 and, being later in the tree, paints
   after it - so clouds sit directly on the sky and below every card, header
   and sheet (see index.css). This component only decides WHO crosses, HOW
   FAST, and WHICH WAY: a few clouds, picked randomly from cloud01/cloud02,
   crossing the viewport forever.

   WHY rAF INSTEAD OF A KEYFRAME. The first version rode one CSS keyframe
   (translateX -100vw -> 100vw) with a negative delay. It did not move. The
   global reduced-motion rule in index.css (animation-duration: 0.01ms
   !important on *) overrides animations even on a plain desktop, because the
   OS is always allowed to say "no motion" and this file's blanket kill-switch
   honours that everywhere. Who wins there is fine in general - but the brief
   for this sky is LITERAL CLOUD MOTION, so the drift is now driven by a
   requestAnimationFrame loop that writes a transform directly onto each
   element. CSS cannot cancel what CSS never declared, and 4 images at
   10-26px/s is a rounding error for a browser. The reduced-motion rule still
   governs every CSS animation in the app; this layer is deliberately the one
   thing that always drifts. Keep it slow - the sky should feel alive, not
   busy.

   DIRECTION AND RHYTHM. Half the clouds ride forward (left to right), half
   ride in reverse (right to left), so the sky is never a one-way traffic.
   Each cloud starts at a random point along its crossing (progress 0..1) so
   the field is already mid-travel at first paint instead of all four
   entering together. A cloud that finishes a crossing wraps back to its
   start edge while fully off screen, so the bench turns over invisibly and
   the drift never pauses.

   RANDOM IS COMPUTED ONCE. The layout rides in useMemo, so a route change or
   a hot reload never reshuffles the sky mid-session; it stays the sky the
   mount chose until the app reloads.
   =========================================================================== */

const CLOUD_IMAGES = ['/assets/world/cloud01.png', '/assets/world/cloud02.png']

const rand = (min: number, max: number) => min + Math.random() * (max - min)

interface CloudSpec {
  src: string
  top: string
  width: string
  opacity: number
  speed: number
  reverse: boolean
  progress: number
}

export function SkyClouds({ count = 4 }: { count?: number }) {
  const clouds = useMemo<CloudSpec[]>(
    () =>
      Array.from({ length: count }, () => {
        const reverse = Math.random() > 0.5
        return {
          src: CLOUD_IMAGES[Math.random() > 0.5 ? 1 : 0]!,
          top: `${Math.round(rand(2, 26))}%`,
          /* vw alone made the desktop sky wrong: 60vw of a 1920px monitor is a
             1150px cloud, so one cloud covered half the sky and read as weather
             rather than scenery. The pixel cap leaves the phone exactly as it
             was (60vw of 360 is 216px) and only bites where a percentage stops
             describing a cloud. */
          width: `min(${Math.round(rand(30, 60))}vw, 340px)`,
          opacity: Math.round(rand(40, 70)) / 100,
          speed: Math.round(rand(10, 26)),
          reverse,
          progress: Math.random(),
        }
      }),
    [count],
  )

  /* progress[i] is the cloud's position along its one-way crossing (0 = off
     its entry edge, 1 = off its exit edge). It wraps to 0 at 1, always while
     the cloud is invisible, and is only ever advanced by the rAF loop. */
  const progress = useRef<number[]>(clouds.map((c) => c.progress))
  const elements = useRef<Array<HTMLDivElement | null>>([])

  /* Place every cloud at its starting point before the first paint, so there
     is never a frame where four clouds sit stacked at the origin. */
  useLayoutEffect(() => {
    const viewport = window.innerWidth
    clouds.forEach((spec, i) => {
      const el = elements.current[i]
      if (!el) return
      const width = el.offsetWidth
      const leg = viewport + width
      const p = spec.progress
      const x = spec.reverse ? viewport - p * leg : p * leg - width
      el.style.transform = `translate3d(${x}px, 0, 0)`
    })
  }, [clouds])

  useEffect(() => {
    let raf = 0
    let last: number | undefined

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const viewport = window.innerWidth
      /* dt stays 0 on the first frame (no elapsed time) and is clamped so a
         background tab that was paused for minutes does not tear everything
         to one side on return. */
      const dt = last === undefined ? 0 : Math.min((now - last) / 1000, 0.75)
      last = now
      if (dt === 0) return

      for (const [i, spec] of clouds.entries()) {
        const el = elements.current[i]
        if (!el) continue
        const width = el.offsetWidth
        const leg = viewport + width
        let p = progress.current[i]! + (dt * spec.speed) / leg
        if (p >= 1) p -= 1
        progress.current[i] = p
        const x = spec.reverse ? viewport - p * leg : p * leg - width
        el.style.transform = `translate3d(${x}px, 0, 0)`
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clouds])

  return (
    <div aria-hidden="true" className="cloud-layer">
      {clouds.map((cloud, i) => (
        <div
          key={i}
          ref={(el) => {
            elements.current[i] = el
          }}
          className="cloud-drift"
          style={{ top: cloud.top, opacity: cloud.opacity }}
        >
          <img
            src={cloud.src}
            alt=""
            decoding="async"
            style={{ width: cloud.width }}
          />
        </div>
      ))}
    </div>
  )
}