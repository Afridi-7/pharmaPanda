import type { ReactElement } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, vi } from 'vitest'
import { AuthProvider } from '@/hooks/useAuth'
import { setToken } from '@/services/http'

/**
 * Shared test harness.
 *
 * Tests mock the HTTP boundary rather than the service modules, so the real
 * `http()` layer — auth headers, error mapping, 401 handling — is exercised
 * on every run instead of being stubbed out.
 */

const BASE = 'http://localhost:8000/api'

type Handler = (init: RequestInit | undefined, url: string) => unknown

interface RouteSpec {
  /** Marks this object as a spec rather than a response body. */
  __spec: true
  /** Status to answer with. Defaults to 200, or 204 for an undefined body. */
  status?: number
  body?: unknown
  handler?: Handler
}

/**
 * Describe a non-200 response, or one with no body.
 *
 * Required because a plain payload can legitimately contain a `status` field
 * of its own — an attempt has `status: 'in-progress'` — so the shape alone
 * cannot distinguish a body from a spec.
 */
export function reply(spec: Omit<RouteSpec, '__spec'>): RouteSpec {
  return { __spec: true, ...spec }
}

export interface ApiMock {
  /** Every request made, in order, as `METHOD /path`. */
  readonly calls: string[]
  /** Bodies sent, keyed by `METHOD /path`. */
  readonly bodies: Record<string, unknown>
  countOf(pathFragment: string): number
}

/**
 * Install a fetch mock for the given routes.
 *
 * Keys are `METHOD /path`, matched by exact path first then by prefix, so
 * `GET /attempts/:id` can be expressed as `GET /attempts/22222222-...`.
 */
export function mockApi(routes: Record<string, RouteSpec | unknown>): ApiMock {
  const calls: string[] = []
  const bodies: Record<string, unknown> = {}

  const normalised = new Map<string, RouteSpec>()
  for (const [key, value] of Object.entries(routes)) {
    const spec: RouteSpec =
      value && typeof value === 'object' && '__spec' in value
        ? (value as RouteSpec)
        : { __spec: true, body: value }
    normalised.set(key, spec)
  }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const path = url.startsWith(BASE) ? url.slice(BASE.length) : url
      const method = (init?.method ?? 'GET').toUpperCase()
      const key = `${method} ${path}`

      calls.push(key)
      if (init?.body) {
        try {
          bodies[key] = JSON.parse(String(init.body))
        } catch {
          bodies[key] = init.body
        }
      }

      const match =
        normalised.get(key) ??
        [...normalised.entries()].find(
          ([candidate]) => candidate.startsWith(`${method} `) && key.startsWith(candidate),
        )?.[1]

      if (!match) {
        return new Response(JSON.stringify({ detail: 'Not found.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const body = match.handler ? match.handler(init, url) : match.body
      const status = match.status ?? (body === undefined ? 204 : 200)

      return new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )

  return {
    calls,
    bodies,
    countOf: (fragment) => calls.filter((call) => call.includes(fragment)).length,
  }
}

interface RenderOptions {
  /** Initial URL. Use with `path` for pages that read route params. */
  route?: string
  /** Route pattern, e.g. `/results/:id`. */
  path?: string
  /**
   * Seed a token so the page starts signed in. Implies `withAuth`.
   * Sign-in pages want the provider without a token, so the two are separate.
   */
  authenticated?: boolean
  /** Wrap in AuthProvider without seeding a token. */
  withAuth?: boolean
}

export function renderPage(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const { route = '/', path, authenticated = false, withAuth = false } = options
  const needsProvider = authenticated || withAuth

  if (authenticated) setToken('test-token')

  const routed = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  )

  return render(
    <MemoryRouter initialEntries={[route]}>
      {needsProvider ? <AuthProvider>{routed}</AuthProvider> : routed}
    </MemoryRouter>,
  )
}

export const user = userEvent.setup()

/**
 * Assert that no undiscovered clinical detail reached the DOM.
 *
 * The discovery mechanic is the product's core rule, so it gets its own
 * assertion rather than being re-expressed in each test.
 */
export function expectNotLeaked(container: HTMLElement, secrets: string[]): void {
  const markup = container.innerHTML
  for (const secret of secrets) {
    expect(markup, `"${secret}" leaked into the DOM`).not.toContain(secret)
  }
}
