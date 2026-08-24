/**
 * Mock transport layer.
 *
 * Every service call goes through `request()` so that latency, failure handling
 * and cancellation behave like a real network call. Swapping to FastAPI means
 * replacing the body of `request()` with `fetch(`${BASE_URL}${path}`)` — the
 * service signatures above it do not change.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    /** Safe, user-facing copy. Raw errors are never surfaced in the UI. */
    readonly userMessage = 'Something went wrong on our side. Please try again.',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

interface RequestOptions {
  /** Simulated latency in ms. */
  latency?: number
  /** Human-readable operation name, used in error copy. */
  label?: string
}

export async function request<T>(resolver: () => T | Promise<T>, options: RequestOptions = {}): Promise<T> {
  const { latency = 260 + Math.random() * 260, label = 'request' } = options
  await delay(latency)
  try {
    return await resolver()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(`${label} failed: ${String(error)}`, 500)
  }
}

export function notFound(what: string): never {
  throw new ApiError(`${what} not found`, 404, `We couldn’t find that ${what}.`)
}
