import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProfilePage } from '@/pages/ProfilePage'
import { makeUser } from '@/test/fixtures'
import { mockApi, renderPage, user } from '@/test/harness'

describe('ProfilePage', () => {
  it('populates the form once the session resolves', async () => {
    // Regression: the form used to capture null on first render and stay empty.
    mockApi({ 'GET /auth/me': makeUser() })
    renderPage(<ProfilePage />, { authenticated: true })

    await waitFor(() => {
      expect(screen.getByLabelText(/university/i)).toHaveValue('University of Debrecen')
    })
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Iqra')
  })

  it('saves an allow-listed patch and never sends the email', async () => {
    const api = mockApi({
      'GET /auth/me': makeUser(),
      'PATCH /auth/profile': makeUser({ firstName: 'Renamed' }),
    })
    renderPage(<ProfilePage />, { authenticated: true })

    const firstName = await screen.findByLabelText(/first name/i)
    await user.clear(firstName)
    await user.type(firstName, 'Renamed')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(api.calls).toContain('PATCH /auth/profile'))
    const body = api.bodies['PATCH /auth/profile'] as Record<string, unknown>
    expect(body).toMatchObject({ firstName: 'Renamed' })
    expect(body).not.toHaveProperty('email')
    expect(body).not.toHaveProperty('id')
  })

  it('states that the email cannot be changed here', async () => {
    mockApi({ 'GET /auth/me': makeUser() })
    renderPage(<ProfilePage />, { authenticated: true })

    expect(await screen.findByText(/cannot be changed/i)).toBeInTheDocument()
  })

  it('does not offer the retired OSCE learning goal', async () => {
    mockApi({ 'GET /auth/me': makeUser() })
    renderPage(<ProfilePage />, { authenticated: true })

    await screen.findByLabelText(/first name/i)
    expect(screen.queryByRole('button', { name: /OSCE/i })).not.toBeInTheDocument()
  })

  it('blocks a save with an empty required field', async () => {
    const api = mockApi({ 'GET /auth/me': makeUser() })
    renderPage(<ProfilePage />, { authenticated: true })

    await user.clear(await screen.findByLabelText(/first name/i))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
    expect(api.countOf('PATCH /auth/profile')).toBe(0)
  })
})
