import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultsPage } from '@/pages/ResultsPage'
import { CRITICAL_SAFETY_ISSUE, makeEvaluation, makeScenario } from '@/test/fixtures'
import { mockApi, renderPage, reply } from '@/test/harness'

const ID = '22222222-2222-4222-8222-222222222222'

const renderResults = () =>
  renderPage(<ResultsPage />, { route: `/results/${ID}`, path: '/results/:id' })

describe('ResultsPage', () => {
  it('shows the score, headline and every competency', async () => {
    mockApi({
      [`GET /attempts/${ID}/evaluation`]: makeEvaluation(),
      'GET /scenarios/sc_inhaler': makeScenario({ id: 'sc_inhaler', title: 'The Inhaler Case' }),
    })
    renderResults()

    expect(await screen.findByText('Strong consultation')).toBeInTheDocument()
    for (const label of [
      'History Taking',
      'Clinical Reasoning',
      'Medication Safety',
      'Counseling',
      'Communication',
      'Referral Decisions',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('states scores as text, not colour alone', async () => {
    mockApi({ [`GET /attempts/${ID}/evaluation`]: makeEvaluation() })
    renderResults()

    await screen.findByText('Strong consultation')
    expect(screen.getByText('91%')).toBeInTheDocument()
    expect(screen.getAllByText(/Strong|Solid|Developing|Needs work/).length).toBeGreaterThan(0)
  })

  it('puts a critical safety issue above the competency breakdown', async () => {
    mockApi({
      [`GET /attempts/${ID}/evaluation`]: makeEvaluation({
        totalScore: 45,
        headline: 'Safety issue identified',
        safetyIssues: [CRITICAL_SAFETY_ISSUE],
      }),
    })
    const { container } = renderResults()

    expect(await screen.findByText(CRITICAL_SAFETY_ISSUE.title)).toBeInTheDocument()
    // Severity is stated in words.
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText(CRITICAL_SAFETY_ISSUE.why)).toBeInTheDocument()

    const markup = container.innerHTML
    expect(markup.indexOf('safety-heading')).toBeLessThan(markup.indexOf('competency-heading'))
  })

  it('renders the reasoning timeline and model approach', async () => {
    mockApi({ [`GET /attempts/${ID}/evaluation`]: makeEvaluation() })
    renderResults()

    expect(await screen.findByText('Student asked')).toBeInTheDocument()
    expect(screen.getByText('Gather relevant history.')).toBeInTheDocument()
  })

  it('links onward to the next case and to a repeat', async () => {
    mockApi({ [`GET /attempts/${ID}/evaluation`]: makeEvaluation() })
    renderResults()

    await screen.findByText('Strong consultation')
    expect(screen.getByRole('link', { name: /open next case/i })).toHaveAttribute(
      'href',
      '/simulations/sc_inhaler',
    )
    expect(screen.getByRole('link', { name: /repeat this case/i })).toHaveAttribute(
      'href',
      '/simulations/sc_headache',
    )
  })

  it('still renders the report when the next-case lookup fails', async () => {
    mockApi({
      [`GET /attempts/${ID}/evaluation`]: makeEvaluation(),
      'GET /scenarios/sc_inhaler': reply({ status: 404, body: { detail: 'Not found.' } }),
    })
    renderResults()

    expect(await screen.findByText('Strong consultation')).toBeInTheDocument()
  })

  it('shows an error with a way back when the report is missing', async () => {
    mockApi({
      [`GET /attempts/${ID}/evaluation`]: reply({ status: 404, body: { detail: 'No report.' } }),
    })
    renderResults()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to simulations/i })).toBeInTheDocument()
  })
})
