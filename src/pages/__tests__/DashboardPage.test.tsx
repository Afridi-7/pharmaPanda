import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from '@/pages/DashboardPage'
import {
  makeAttemptSummary,
  makeCompetencies,
  makeProgress,
  makeScenario,
  makeUser,
} from '@/test/fixtures'
import { mockApi, renderPage } from '@/test/harness'

function routes(overrides: Record<string, unknown> = {}) {
  return {
    'GET /auth/me': makeUser(),
    'GET /progress': makeProgress(),
    'GET /scenarios': [makeScenario(), makeScenario({ id: 'sc_inhaler', title: 'The Inhaler Case' })],
    'GET /attempts': [],
    ...overrides,
  }
}

describe('DashboardPage', () => {
  it('greets the signed-in user by name', async () => {
    mockApi(routes())
    renderPage(<DashboardPage />, { authenticated: true })

    expect(await screen.findByText(/Iqra/)).toBeInTheDocument()
  })

  it('shows zeros for a new account rather than invented progress', async () => {
    mockApi(routes())
    const { container } = renderPage(<DashboardPage />, { authenticated: true })

    await screen.findByText('Overall Score')
    expect(container.textContent).not.toContain('NaN')
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
  })

  it('loads the dashboard in three requests, not one per report', async () => {
    // Regression: competency aggregation used to fetch each report separately.
    const api = mockApi(
      routes({
        'GET /attempts': Array.from({ length: 5 }, (_, i) =>
          makeAttemptSummary({ attemptId: `a${i}` }),
        ),
        'GET /progress': makeProgress({ overallScore: 79, competencies: makeCompetencies(84) }),
      }),
    )
    renderPage(<DashboardPage />, { authenticated: true })

    await screen.findByText('Overall Score')

    expect(api.countOf('/evaluation')).toBe(0)
    expect(api.countOf('GET /progress')).toBe(1)
    expect(api.countOf('GET /scenarios')).toBe(1)
    expect(api.countOf('GET /attempts')).toBe(1)
  })

  it('surfaces recent consultations with links to their reports', async () => {
    mockApi(routes({ 'GET /attempts': [makeAttemptSummary()] }))
    renderPage(<DashboardPage />, { authenticated: true })

    // The title appears in the continue card and again in the recent table.
    expect((await screen.findAllByText(/The Headache/)).length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: /view results/i })[0],
    ).toHaveAttribute('href', expect.stringContaining('/results/'))
  })
})
