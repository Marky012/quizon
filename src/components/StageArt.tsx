import { useState } from 'react'
import type { ReactNode } from 'react'

/* ===========================================================================
   STAGE ART - the picture on a Hub card.

   TWO SOURCES, ONE SLOT. The real illustration is a square image in
   /public/assets/hub/ (woof-school.png, reading-trail.png, your-record.png -
   the extension on the path MUST match the file on disk). Any time that file
   is missing or fails to load, this falls back to a HAND-DRAWN inline SVG so
   the Hub never regresses to an emoji.

   WHY THE FALLBACK LIVES HERE AND NOT IN HUB. The Hub only names the stage and
   the file; the "what if the file is missing" decision is art plumbing and
   belongs next to the art. The carousel that frames this never has to know a
   fallback exists.

   The vectors follow the SkillSymbol convention: flat fills in the eight-colour
   palette, a 2px navy keyline, rounded joins, no gradients. They read on the
   turquoise stage plate, which is why the cream, yellow and coral fills are
   picked - each is high-contrast against turquoise.
   =========================================================================== */

export type StageArtId = 'training' | 'arena' | 'chronicle'

const VECTORS: Record<StageArtId, ReactNode> = {
  /* Woof School - an open book with a star rising off the page. */
  training: (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" className="h-full w-full">
      <path
        d="M48 1 L50.23 6.93 L56.56 7.22 L51.61 11.17 L53.29 17.28 L48 13.8 L42.71 17.28 L44.39 11.17 L39.44 7.22 L45.77 6.93 Z"
        fill="var(--color-yellow)"
        stroke="var(--color-navy)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 28 Q48 36 88 28 L88 74 Q48 82 8 74 Z" fill="var(--color-navy)" />
      <path
        d="M14 25 Q48 33 82 25 L82 68 Q48 76 14 68 Z"
        fill="var(--color-cream)"
        stroke="var(--color-navy)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 29 L48 72"
        stroke="var(--color-navy)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g stroke="var(--color-navy)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5">
        <path d="M21 37 Q31 39 41 38" />
        <path d="M21 45 Q31 47 41 46" />
        <path d="M21 53 Q31 55 41 54" />
        <path d="M55 38 Q65 39 75 37" />
        <path d="M55 46 Q65 47 75 45" />
        <path d="M55 54 Q65 55 75 53" />
      </g>
    </svg>
  ),

  /* Reading Trail - a dotted path winding up to a map pin, flag at the start. */
  arena: (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" className="h-full w-full">
      <path
        d="M16 82 C28 68 12 58 28 48 C44 38 38 28 56 22 C66 18 72 24 76 25"
        fill="none"
        stroke="var(--color-cream)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="0.1 13"
      />
      <path d="M16 60 L16 82" stroke="var(--color-navy)" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 60 L30 65 L16 70 Z" fill="var(--color-lime)" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M76 12 C65 12 58 21 58 30 C58 41 76 54 76 54 C76 54 94 41 94 30 C94 21 87 12 76 12 Z"
        fill="var(--color-coral)"
        stroke="var(--color-navy)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="76" cy="29" r="6" fill="var(--color-cream)" stroke="var(--color-navy)" strokeWidth="2" />
    </svg>
  ),

  /* Your Record - a trophy with a star on the cup. */
  chronicle: (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" className="h-full w-full">
      <path
        d="M32 22 h-9 a9 12 0 0 0 9 14 M64 22 h9 a9 12 0 0 1 -9 14"
        fill="none"
        stroke="var(--color-navy)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 14 H66 V40 C66 52 56 58 48 58 C40 58 30 52 30 40 Z"
        fill="var(--color-yellow)"
        stroke="var(--color-navy)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M30 20 H66" stroke="var(--color-cream)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path
        d="M48 25 L50 30.25 L55.6 30.53 L51.23 34.05 L52.7 39.47 L48 36.4 L43.3 39.47 L44.77 34.05 L40.4 30.53 L45.99 30.25 Z"
        fill="var(--color-cream)"
        stroke="var(--color-navy)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M45 58 h6 v10 h-6 z" fill="var(--color-yellow)" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M38 68 h20 l6 12 H32 Z" fill="var(--color-navy)" />
    </svg>
  ),
}

export function StageArt({
  stage,
  image,
  className = 'h-28 w-28',
}: {
  stage: StageArtId
  /** Square image under /public/assets/hub/. Falls back to the vector on 404. */
  image?: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (image && !failed) {
    return (
      <img
        src={image}
        alt=""
        aria-hidden="true"
        decoding="async"
        onError={() => setFailed(true)}
        className={`object-contain ${className}`}
      />
    )
  }

  return <span className={`inline-block ${className}`}>{VECTORS[stage]}</span>
}