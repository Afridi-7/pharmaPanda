import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/pages/LoginPage'
import { makeUser } from '@/test/fixtures'
import { mockApi, renderPage, reply, user } from '@/test/harness'
import { getToken } from '@/services/http'

describe('LoginPage', () => {
  it('starts with empty credentials', async () => {
    mockApi({})
    renderPage(<LoginPage />, { withAuth: true })

    expect(await screen.findByLabelText(/^email$/i)).toHaveValue('')
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('')
  })

  it('signs in and stores the token', async () => {
    const api = mockApi({
      'GET /auth/me': reply({ status: 401, body: { detail: 'Not authenticated.' } }),
      'POST /auth/login': { accessToken: 'jwt-123', tokenType: 'bearer', expiresIn: 3600, user: makeUser() },
    })
    renderPage(<LoginPage />, { withAuth: true })

    await user.type(await screen.findByLabelText(/^email$/i), 'iqra@university.edu')
    await user.type(screen.getByLabelText(/^password$/i), 'strongpassword123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => expect(api.calls).toContain('POST /auth/login'))
    expect(api.bodies['POST /auth/login']).toMatchObject({ email: 'iqra@university.edu' })
    expect(getToken()).toBe('jwt-123')
  })

  it('shows a safe message for bad credentials and stores nothing', async () => {
    mockApi({
      'POST /auth/login': reply({ status: 401, body: { detail: 'Incorrect email or password.' } }),
    })
    renderPage(<LoginPage />, { withAuth: true })

    await user.type(await screen.findByLabelText(/^email$/i), 'iqra@university.edu')
    await user.type(screen.getByLabelText(/^password$/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('never authenticates through the Google button', async () => {
    const api = mockApi({})
    renderPage(<LoginPage />, { withAuth: true })

    await user.click(await screen.findByRole('button', { name: /continue with google/i }))

    // The button explains itself statically; failing must add an error too.
    await waitFor(() => {
      expect(screen.getAllByText(/isn’t enabled yet/i).length).toBeGreaterThan(1)
    })
    expect(getToken()).toBeNull()
    expect(api.countOf('/auth/login')).toBe(0)
  })
})
