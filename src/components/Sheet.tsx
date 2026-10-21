import { useCallback, useEffect, useRef, type ReactNode } from 'react'

/* ===========================================================================
   SHEET - the modal that rises from the bottom.

   Used for the helper picker and the hint card. Deliberately NOT a centred
   dialog: on a 320x568 phone held in two small hands, the bottom of the screen
   is easier to reach and the thumb does not cover the content.

   THE FOCUS TRAP IS REAL, AND IT IS LOAD-BEARING. The previous version
   documented a trap and did not implement one: Escape closed the sheet and Tab
   walked straight out into the inert page behind, so a keyboard learner could
   end up tapping answer options of a quiz they could not see, behind a modal.
   Three pieces, all required:

     1. MOVE FOCUS IN on open, to the panel itself rather than to the close
        button. Landing on the close button invites a keyboard learner to
        dismiss the thing they just opened, and it means the title is not read
        before the first action is offered.
     2. WRAP on Tab and Shift+Tab, computed from the focusable elements
        actually present, so it keeps working as children change.
     3. RESTORE FOCUS on close, to whatever was focused before. Without this,
        dismissing the hint sheet drops the learner at the top of the document
        and they lose their place in a 20-question quiz.
   =========================================================================== */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Sheet({
  open,
  onClose,
  title,
  children,
  labelClose = 'Close',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  labelClose?: string
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  const focusables = useCallback((): HTMLElement[] => {
    const panel = panelRef.current
    if (!panel) return []
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }, [])

  useEffect(() => {
    if (!open) return

    // Remember where focus came from BEFORE anything moves it.
    restoreTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // Focus the panel, not a child. The panel is not focusable by default.
    const panel = panelRef.current
    if (panel && !panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1')
    panel?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusables()
      // Nothing focusable in here (an empty sheet): hold focus on the panel
      // rather than letting it escape to the page behind.
      if (items.length === 0) {
        e.preventDefault()
        panelRef.current?.focus({ preventScroll: true })
        return
      }

      const first = items[0] as HTMLElement
      const last = items[items.length - 1] as HTMLElement
      const active = document.activeElement

      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)

    // Stop the page behind from scrolling under the sheet.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      // Put focus back where it came from. Deferred a tick so it does not race
      // the element that is being restored into view.
      const target = restoreTo.current
      restoreTo.current = null
      if (target && document.contains(target)) {
        window.setTimeout(() => target.focus({ preventScroll: true }), 0)
      }
    }
  }, [open, onClose, focusables])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label={labelClose}
        onClick={onClose}
        className="absolute inset-0 bg-indigo/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[80dvh] w-full max-w-2xl animate-slide-up overflow-y-auto rounded-t-[24px] bg-cream p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-14px_32px_-14px_rgba(26,35,126,0.55)]"
      >
        <div className="mx-auto mb-3 h-2 w-14 rounded-pill bg-navy/25" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-[22px] leading-7 text-indigo">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={labelClose}
            className="btn-chunky flex h-11 w-11 shrink-0 items-center justify-center bg-turquoise text-on-turquoise"
          >
            <span aria-hidden="true" className="text-[20px] leading-none">
              ✕
            </span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}