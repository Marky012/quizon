import { useState } from 'react'
import type { Pup } from '@/content/schemas'
import { accentVar, needsOutline } from '@/lib/accents'

type State = 'idle' | 'happy' | 'hint' | 'sleepy'

/* ===========================================================================
   PUP AVATAR - the one place character art is rendered.

   ALWAYS THE ART, NEVER A LETTER. Every pup in the manifest has a PNG, and
   the letter placeholder that used to stand in for unearned pups is gone.
   It failed twice in the two places the product shows its cast: the Woof
   School grid rendered eight initials in outlined tiles instead of the eight
   characters the school is about, and the Hub bench showed the same dogs
   crushed to 32% opacity behind a greyscale filter. Earned state belongs to
   the text and badges of the screens that care - the "Pup earned" pill in a
   skill's disclosure, the percentages in the record - not to hiding the
   character the child is collecting.

   WHAT REMAINS OF THE FALLBACK IS THE PLATE: a same-size, same-shape tile
   (frame, ring and all) that sits behind the image while it loads, and
   becomes the whole result only if the file is missing or fails to decode.
   Same footprint either way, so a grid of eight never reflows and a
   broken-image icon never appears. A ninth pup added to the manifest before
   its art is drawn lands here too.

   ONE FILE PER PUP, NOT ONE PER STATE. The manifest asked for idle / happy /
   hint / sleepy variants; what actually arrived is one full-body illustration
   per pup. Rather than keep four paths that three of them would 404 on, the
   state now only drives the RING colour and one file serves every state. The
   moment real per-state art exists, this is the single line to change back.

   THE IMAGE IS ALWAYS MOUNTED, AND THE PLATE GOES BEHIND IT. This used to
   read:

       if (!loaded) return tile()
       return <img onLoad={() => setLoaded(true)} ... />

   which is a deadlock, and it is the reason the pups rendered as letter tiles
   even after the real art landed. The img is what fires onLoad, and the img
   was never rendered, so onLoad never fired, so `loaded` never became true.
   So the img renders unconditionally and the plate is its backdrop: same
   size, same shape, same border, so nothing moves when the art lands. That
   matters because these avatars sit inside the hint picker grid, and a grid
   that reflows as eight images arrive is exactly what makes a tap land on the
   wrong pup.
   =========================================================================== */

const RING: Record<State, string> = {
  idle: 'border-navy',
  happy: 'border-lime',
  hint: 'border-turquoise',
  sleepy: 'border-navy',
}

export function PupAvatar({
  pup,
  size = 88,
  state = 'idle',
  plain = false,
  className = '',
}: {
  pup: Pup
  size?: number
  state?: State
  /** Drop every bit of chrome: no rounded frame, no border, no cream plate. */
  plain?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // A cream pup on a cream page has no silhouette at all, so its framed tile
  // always carries the navy outline. This is the Franky case from art bible 3.2.
  const outline = needsOutline(pup.accent) ? 'border-navy' : ''

  /* The frame is OPTIONAL, because the Hub bench must not have one.

     Everywhere else a pup is a UI object - a card, a picker cell - and the
     rounded frame plus cream plate is what makes it read as a tappable thing.
     On the bench the same frame turns eight full-body illustrations into eight
     app icons sitting on a shelf, which is precisely what they are not: they
     are animals standing on grass. So `plain` removes the rounded box, the
     border and the cream background, and the PNG's own alpha does the rest.

     The cream plate in particular is not merely decorative: the artwork is
     transparent PNG, so a cream backdrop is what gives each framed pup its
     silhouette. Remove the plate and the dogs have to be legible against
     grass, which is the real constraint this component is now solving. */
  const frame = plain
    ? ''
    : `rounded-[24px] border-2 ${RING[state]} ${outline} bg-cream`

  /** THE PLATE - load backdrop and failure fallback, never content. It keeps
   *  the frame's exact size, shape and ring so the avatar's footprint is
   *  identical before, during and after the art arrives. No letter on it:
   *  an empty tinted tile says "art on the way", an initial said "this is a
   *  different, lesser thing". */
  const plate = (extra = '') => (
    <div
      className={`flex shrink-0 items-center justify-center ${frame || 'rounded-[24px] bg-turquoise-soft'} ${extra} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="sr-only">{pup.name}</span>
    </div>
  )

  if (failed) return plate()

  const src = `/assets/pups/${pup.id}-avatar.png`

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Backdrop only. Once the art is up it is completely hidden, and for a
          failed load the plate above is the whole visible result. */}
      {!loaded && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          {plate(plain ? '' : 'bg-indigo-soft')}
        </span>
      )}

      <img
        src={src}
        alt={pup.name}
        width={size}
        height={size}
        /* Not eager: a roster shows eight of these and only the ones near the
           viewport are worth downloading now. decoding="async" keeps the main
           thread free for the screen the learner is actually trying to read. */
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        /* Transparent until it decodes, so the plate behind shows through rather
           than being covered by an empty cream box. opacity is transitioned
           rather than toggled so the swap is not a hard pop. FULL opacity
           always: the 32%-and-greyscale treatment unearned pups used to get
           here is what made the Hub bench look washed out. */
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          opacity: loaded ? 1 : 0,
          transition: 'opacity duration-200 ease-out',
        }}
        className={`relative shrink-0 object-contain ${frame}`}
      />
    </span>
  )
}

/** The accent colour a pup is drawn in, for chips and rules. */
export function pupilAccent(pup: Pup): string {
  return accentVar(pup.accent)
}
