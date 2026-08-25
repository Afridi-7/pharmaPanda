import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/api'
import { clearToken, getToken, http, setToken } from '@/services/http'
import { mockApi, reply } from '@/test/harness'

describe('http', () => {
  beforeEach(() => clearToken())

  it('sends the bearer token when one is stored', async () => {
    setToken('abc123')
    mockApi({ 'GET /thing': { ok: true } })

    await http('/thing')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer abc123')
  })

  it('omits the header when auth is disabled', async () => {
    setToken('abc123')
    mockApi({ 'POST /auth/login': { ok: true } })

    await http('/auth/login', { method: 'POST', auth: false, body: {} })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('returns undefined for 204 rather than failing to parse', async () => {
    mockApi({ 'POST /auth/logout': reply({ status: 204, body: undefined }) })
    await expect(http('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('surfaces the backend detail as user-facing copy', async () => {
    mockApi({
      'POST /auth/register': reply({ status: 409, body: { detail: 'An account with that email already exists.' } }),
    })

    await expect(http('/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 409,
      userMessage: 'An account with that email already exists.',
    })
  })

  it('reads the first message out of a pydantic validation error', async () => {
    mockApi({
      'POST /thing': reply({
        status: 422,
        body: { detail: [{ msg: 'Value error, Enter a valid email address.', loc: ['body', 'email'] }] },
      }),
    })

    await expect(http('/thing', { method: 'POST', body: {} })).rejects.toMatchObject({
      userMessage: 'Enter a valid email address.',
    })
  })

  it('clears a rejected token so the app falls back to signed-out', async () => {
    setToken('stale')
    mockApi({ 'GET /auth/me': reply({ status: 401, body: { detail: 'Not authenticated.' } }) })

    await expect(http('/auth/me')).rejects.toBeInstanceOf(ApiError)
    expect(getToken()).toBeNull()
  })

  it('reports an unreachable API without blaming the connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(http('/scenarios')).rejects.toMatchObject({ status: 0 })
  })

  it('never throws a raw error at the UI', async () => {
    mockApi({ 'GET /thing': reply({ status: 500, body: { detail: null } }) })

    const error = (await http('/thing').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.userMessage).not.toContain('500')
  })
})
