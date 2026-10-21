import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'

/* ===========================================================================
   IN-APP BACK NAVIGATION.

   WHY THIS REPLACED window.history.length > 1.

   Every screen used to decide "is there somewhere to go back to?" by asking
   `window.history.length > 1`. That count is the whole browser tab's history,
   including everything that happened BEFORE the app was opened. Three ways it
   lies, all of them real on a phone:

     1. A child opened the installed PWA from a link in another app, or from a
        WhatsApp chat. history.length is already 4 or 5, but the entry behind
        /quiz/easy is a web page, not a screen of ours. navigate(-1) fires a POP
        that unloads the SPA and drops them out of the app entirely. From the
        child's side the back button did nothing - or worse, it worked and threw
        them off the game.
     2. A cold open straight onto /quiz/easy (a bookmark, a printed handout, a
        teacher pasting a link). history.length is 1, so back jumped to /hub -
        not backwards, but sideways to somewhere they never were.
     3. QUIZ SPECIFICALLY. Quiz was the one screen that did not use the shared
        hook; it hardcoded navigate('/arena'). That PUSHES. So the stack became
        hub -> quiz -> arena, and the Android back gesture from the Arena
        returned them INTO THE QUIZ. Pressing back repeatedly walked in a loop
        and there was no way out of the level.

   So: the app keeps its own stack of visited screens, in sessionStorage, and
   back means "the previous screen of THIS app" - never a document, never a
   sibling of the one you just left.

   TWO PROPERTIES WORTH KEEPING.

   REPLACE, NOT PUSH. Popping with navigate(-1) leaves the forward entry in
   place, which is how the loop in bug 3 was possible. Replacing means the
   history shrinks as you back out, so Android back and the header button can
   never disagree about where "back" is.

   sessionStorage, NOT MODULE STATE. A module-level array is lost on reload, and
   this app reloads more than you would think: a crash mid-quiz, or the browser
   evicting a PWA tab under memory pressure on a cheap phone. After a reload the
   back button would have silently become a no-op. sessionStorage survives the
   reload and dies with the tab, which is exactly the lifetime we want.
   =========================================================================== */

const KEY = 'quizon:back-stack'

/** Old enough screens cannot be the previous screen, so the stack cannot grow forever. */
const MAX = 25

function read(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : []
  } catch {
    // Private browsing, storage disabled, or corrupt JSON. Back degrades to the
    // fallback route rather than breaking the screen.
    return []
  }
}

function write(stack: string[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX)))
  } catch {
    /* Same reasoning as read: a missing stack is not worth failing a tap over. */
  }
}

/**
 * Records every visit so there is something to go back to. Mount once, inside
 * the Router.
 */
export function AppHistoryRecorder(): null {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    const stack = read()

    if (navType === 'POP') {
      // The back GESTURE or the browser's own back button. The entry we just
      // left is the top of the stack, so drop it - but only if it really is the
      // one we left. A forward navigation also arrives as POP, and popping then
      // would delete a screen the user still expects to be able to return to.
      if (stack[stack.length - 1] === pathname) return
      stack.pop()
      write(stack)
      return
    }

    // PUSH and REPLACE both land here. Two rules:
    //
    // 1. Never add a duplicate of the screen we are already on, or the
    //    hub->quiz->back-to-hub cycle would fill the stack with repeats.
    //
    // 2. If the destination is ALREADY somewhere on the stack, everything
    //    above it belongs to a flow the learner just finished - the pre-test
    //    done screen going "Back to Woof School", or Result going "back to
    //    Arena". Drop those entries so the header back button returns to the
    //    screen that screen was reached from, instead of unwinding back
    //    through the finished pre-test/lesson one tap at a time.
    const existing = stack.lastIndexOf(pathname)
    if (existing >= 0) stack.length = existing + 1
    else stack.push(pathname)
    write(stack)
  }, [pathname, navType])

  return null
}

/**
 * The back action for a header button.
 *
 * `fallback` is where to go when there is genuinely nothing behind this screen -
 * a cold deep link, or a cleared tab. It is always reached with replace, so even
 * the fallback cannot become a dead end.
 */
export function useAppBack(fallback: string): () => void {
  const navigate = useNavigate()

  return useCallback(() => {
    const stack = read()
    stack.pop() // the screen we are on
    const target = stack.pop() ?? fallback
    write(stack)
    navigate(target, { replace: true })
  }, [navigate, fallback])
}