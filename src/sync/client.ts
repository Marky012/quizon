import type { SyncPayload, SyncResponse } from './types'

/* ===========================================================================
   THE SYNC REQUEST.

   ONE FUNCTION. It posts a payload and it either succeeds or throws. It does
   not retry, it does not queue, it does not decide whether it should run.
   Those decisions belong to the manager, which can see the device's state;
   this function only knows about one request.
   =========================================================================== */

/** How long one attempt is allowed to take. */
export const REQUEST_TIMEOUT_MS = 12_000

/**
 * The endpoint. Empty means the feature is OFF.
 *
 * This is deliberately an environment variable and not a constant in the
 * code. The same built app has to work on a school device with no backend
 * configured at all, and the same built app has to work on a device that
 * CAN reach the teacher's server. The build decides which, not the source.
 *
 * With no endpoint, sync is disabled: the game plays exactly as it always
 * did, and nothing tries to reach the network.
 *
 * THE THREE STATES, because a build-time variable has three, not two:
 *
 *   UNSET   -> the built-in default below, this project's own server.
 *   SET     -> that URL, whatever it is.
 *   EMPTY   -> the feature is off. Set VITE_SYNC_ENDPOINT= (nothing after
 *              the equals sign) to build a version that never touches the
 *              network.
 */
const DEFAULT_SYNC_ENDPOINT =
  'https://qovrlursadsjkdyowqwc.supabase.co/functions/v1/sync-student'

export function syncEndpoint(): string {
  const raw = import.meta.env.VITE_SYNC_ENDPOINT
  if (typeof raw === 'string') return raw.trim()
  return DEFAULT_SYNC_ENDPOINT
}

export function syncConfigured(): boolean {
  return syncEndpoint().length > 0
}

export class SyncError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

/**
 * Posts one snapshot.
 *
 * The timeout is not optional. A school hotspot that has just been switched
 * on will happily accept a TCP connection and then never deliver a response.
 * Without an abort, that request hangs until the browser gives up, which on
 * some Android builds is minutes, and the pending slot stays blocked behind
 * it.
 */
export async function postPayload(
  endpoint: string,
  payload: SyncPayload,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<SyncResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    let body: SyncResponse = { ok: res.ok }
    try {
      const text = await res.text()
      if (text) {
        const parsed: unknown = JSON.parse(text)
        if (parsed && typeof parsed === 'object') body = { ...body, ...(parsed as SyncResponse) }
      }
    } catch {
      // The body was not JSON. The status code is still the answer.
    }

    if (!res.ok) {
      // 4xx means the server will never accept THIS payload as it is. 5xx
      // and 429 mean it might, later. The difference decides whether the
      // manager keeps the slot for another attempt or drops it.
      const retryable = res.status >= 500 || res.status === 429 || res.status === 408
      throw new SyncError(body.error ?? `The server said ${res.status}.`, retryable)
    }
    return body
  } catch (err) {
    if (err instanceof SyncError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new SyncError('The connection timed out.', true)
    }
    // Network down, DNS failure, CORS refusal. All retryable: the same
    // payload will work the moment the hotspot appears.
    throw new SyncError(err instanceof Error ? err.message : 'Could not reach the server.', true)
  } finally {
    clearTimeout(timer)
  }
}
