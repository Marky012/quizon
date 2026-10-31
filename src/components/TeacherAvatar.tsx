import { useState } from 'react'
import { TEACHER } from '@/content/manifest'

export type TeacherEmotion = 'idle' | 'happy' | 'support' | 'hint'

/* ===========================================================================
   TEACHER AVATAR - Teacher Reyes with dynamic emotions.

   ASSETS (2026-10-24):
     - idle:     /assets/teacher/teacher-idle.png    (teaching, classroom guidance)
     - happy:    /assets/teacher/teacher-happy.png   (celebrating, applauding, pass)
     - support:  /assets/teacher/teacher-support.png (comforting, retry encouragement)
     - hint:     /assets/teacher/teacher-hint.png    (strategy pointer, worked example)

   FALLBACK:
     If an image fails to load, renders her stylized initials ("TR") on a
     cream plate so a broken-image glyph never appears.
   =========================================================================== */

const EMOTION_SRC: Record<TeacherEmotion, string> = {
  idle: '/assets/teacher/teacher-idle.png',
  happy: '/assets/teacher/teacher-happy.png',
  support: '/assets/teacher/teacher-support.png',
  hint: '/assets/teacher/teacher-hint.png',
}

export function TeacherAvatar({
  emotion = 'idle',
  size = 88,
  plain = false,
  className = '',
}: {
  emotion?: TeacherEmotion
  size?: number
  plain?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const src = EMOTION_SRC[emotion] || EMOTION_SRC.idle

  const initials = TEACHER.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)

  const frameClass = plain
    ? ''
    : 'rounded-[22px] border-2 border-indigo/20 bg-cream shadow-sm overflow-hidden'

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center font-display text-indigo ${frameClass} ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(16, Math.round(size * 0.35)) }}
      >
        {initials}
      </div>
    )
  }

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${frameClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {!loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-indigo-soft/40"
        />
      )}
      <img
        src={src}
        alt={TEACHER.name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-contain transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </span>
  )
}
