import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SimulationsPage } from '@/pages/SimulationsPage'
import { makeScenario } from '@/test/fixtures'
import { mockApi, renderPage, reply, user } from '@/test/harness'

describe('SimulationsPage', () => {
  it('lists scenarios from the API with their status', async () => {
    mockApi({
      'GET /scenarios': [
        makeScenario(),
        makeScenario({ id: 'sc_cough', title: 'The Cough', status: 'completed', previousScore: 74 }),
      ],
    })
    renderPage(<SimulationsPage />)

    expect(await screen.findByText(/The Headache/)).toBeInTheDocument()
    expect(screen.getByText('The Cough')).toBeInTheDocument()
    expect(screen.getByText(/Showing 2 of 2/)).toBeInTheDocument()
  })

  it('filters by search without refetching', async () => {
    const api = mockApi({
      'GET /scenarios': [makeScenario(), makeScenario({ id: 'sc_cough', title: 'The Cough' })],
    })
    renderPage(<SimulationsPage />)

    await screen.findByText(/The Headache/)
    const before = api.countOf('GET /scenarios')

    await user.type(screen.getByLabelText(/search simulations/i), 'cough')

    expect(await screen.findByText(/Showing 1 of 2/)).toBeInTheDocument()
    expect(api.countOf('GET /scenarios')).toBe(before)
  })

  it('explains when no case matches the filters', async () => {
    mockApi({ 'GET /scenarios': [makeScenario()] })
    renderPage(<SimulationsPage />)

    await screen.findByText(/The Headache/)
    await user.type(screen.getByLabelText(/search simulations/i), 'zzzznope')

    expect(await screen.findByText(/no matching cases/i)).toBeInTheDocument()
  })

  it('shows an error state when the catalogue cannot be loaded', async () => {
    mockApi({ 'GET /scenarios': reply({ status: 500, body: { detail: null } }) })
    renderPage(<SimulationsPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
