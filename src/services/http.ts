import { API_BASE_URL, ApiError } from './api'

/**
 * Real HTTP transport for the FastAPI backend.
 *
 * This sits alongside the mock `request()` in `api.ts`: only the services that
 * have been migrated use it. Everything else still runs on the mock store while
 * it waits its turn.
 *
 * Backend errors are translated into `ApiError` so the UI keeps handling
 * failures exactly as it did against the mock layer. The backend's `detail`
 * strings are already written for end users, so they are surfaced as-is;
 * anything unexpected falls back to generic copy.
 */

/**
 * Token storage.
 *
 * TEMPORARY ARCHITECTURE DECISION: the access token lives in localStorage for
 * this development phase. That is readable by any script running on the page,
 * so it is an XSS-exposed store. The intended end state is an httpOnly,
 * SameSite refresh cookie with a short-lived in-memory access token; moving
 * there only changes this module.
 *
 * Only the token is stored — never a password, never a password hash.
 */
const TOKEN_KEY = 'pharmapanda.access_token'

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage unavailable (private mode, quota). The session still works until
    // the tab is closed; it simply will not survive a refresh.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to do — the token is already unreachable.
  }
}

interface HttpOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Attach the bearer token. Defaults to true. */
  auth?: boolean
  signal?: AbortSignal
}

const GENERIC_ERROR = 'Something went wrong on our side. Please try again.'

function messageForStatus(status: number): string {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have access to that.'
  if (status === 404) return 'We couldn’t find what you were looking for.'
  if (status === 409) return 'That conflicts with something that already exists.'
  if (status === 422) return 'Please check the details you entered.'
  if (status >= 500) return GENERIC_ERROR
  return GENERIC_ERROR
}

/** Pulls a user-safe message out of a FastAPI error body. */
function extractDetail(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail

    // FastAPI's own error shape: {"detail": "..."}.
    if (typeof detail === 'string' && detail.trim()) return detail

    // Pydantic validation errors: {"detail": [{msg, loc}, ...]}.
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: unknown }
      if (typeof first?.msg === 'string' && first.msg.trim()) {
        return first.msg.replace(/^Value error,\s*/i, '')
      }
    }
  }
  return messageForStatus(status)
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // Network-level failure: the API is unreachable, not returning an error.
    // In development that almost always means the backend simply isn't running,
    // so say so rather than blaming the user's connection.
    const hint = import.meta.env.DEV
      ? `We couldn’t reach the API at ${API_BASE_URL}. Is the backend running? Start it with: cd backend && uvicorn app.main:app --reload`
      : 'We couldn’t reach the server. Check your connection and try again.'

    throw new ApiError(`network request to ${path} failed: ${String(error)}`, 0, hint)
  }

  if (response.status === 204) return undefined as T

  const raw = await response.text()
  let payload: unknown = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    // An expired or rejected token is dead weight — drop it so the app falls
    // back to signed-out rather than retrying with a token that cannot work.
    if (response.status === 401) clearToken()

    throw new ApiError(
      `${method} ${path} failed with ${response.status}`,
      response.status,
      extractDetail(payload, response.status),
    )
  }

  return payload as T
}
