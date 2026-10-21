import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScreenFrame } from './ScreenFrame'

/* ===========================================================================
   ERROR BOUNDARY

   WHY A CLASS COMPONENT IN AN ALL-FUNCTION APP. There is no hook equivalent of
   componentDidCatch. A render error in a lazy chunk or in a screen would
   otherwise blank the whole app, and for this audience that means a child is
   stuck on a white page with no way back.

   WHAT IT CATCHES. Two cases matter here and they need different words:

   1. A FAILED CHUNK LOAD. With code splitting, a screen is fetched on demand.
      On a flaky connection, or after a deploy replaced the old hashed chunk
      name, that fetch fails. This is recoverable and the fix is a reload.
      The learner is told nothing technical; they get a button.

   2. A RENDER ERROR. A bug in a screen. Same treatment: reload works, because
      the bug is in code that a fresh load may route around, and there is no
      useful thing to show a nine-year-old.

   WHAT IT MUST NOT DO. Swallow the error. `getDerivedStateFromError` only sets
   state; the error is still rethrown to the console by componentDidCatch, and
   in development the real message is shown so a bug is diagnosable rather than
   hidden behind friendly copy.
   =========================================================================== */

interface Props {
  children: ReactNode
  /** Shown in place of the children. Receives a reset so a retry is possible. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the stack. A child-facing message with no log is unreportable.
    console.error('QuizOn: a screen failed to render.', error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return (
      <ScreenFrame
        title="Something went wrong"
        bar={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-chunky w-full bg-turquoise py-4 text-[19px] text-on-turquoise"
          >
            Start again
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Warm, and never the word FAILED (art bible 13.3). A child did not
              break anything and should not be told they did. */}
          <p className="card-cream bg-yellow-soft p-4 text-[19px] leading-7 text-indigo">
            This part did not open. Let&apos;s try it one more time.
          </p>
          <p className="text-[15px] leading-6 text-navy/80">
            Your work is saved. Anything you finished is still here.
          </p>
          {/* The technical detail is present but not shouted: available for a
              teacher reading the screen, not displayed to a learner. */}
          <details className="text-sm text-navy/70">
            <summary className="cursor-pointer">Details</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{error.message}</pre>
          </details>
        </div>
      </ScreenFrame>
    )
  }
}