import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressPage } from '@/pages/ProgressPage'
import { makeCompetencies, makeProgress } from '@/test/fixtures'
import { mockApi, renderPage, reply, user } from '@/test/harness'

describe('ProgressPage', () => {
  it('invites a new account to start rather than showing empty charts', async () => {
    mockApi({ 'GET /progress': makeProgress() })
    renderPage(<ProgressPage />)

    expect(await screen.findByText(/no consultations assessed yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse simulations/i })).toBeInTheDocument()
  })

  it('never shows NaN when there is no data', async () => {
    mockApi({ 'GET /progress': makeProgress() })
    const { container } = renderPage(<ProgressPage />)

    await screen.findByText(/no consultations assessed yet/i)
    expect(container.textContent).not.toContain('NaN')
  })

  it('shows real scores once consultations exist', async () => {
    mockApi({
      'GET /progress': makeProgress({
        overallScore: 79,
        consultationsCompleted: 3,
        streakDays: 2,
        competencies: makeCompetencies(84),
      }),
    })
    renderPage(<ProgressPage />)

    expect(await screen.findByText('Overall Score')).toBeInTheDocument()
    expect(screen.getAllByText('84%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('History Taking').length).toBeGreaterThan(0)
  })

  it('marks unassessed competencies rather than implying a zero score', async () => {
    mockApi({ 'GET /progress': makeProgress({ overallScore: 0 }) })
    renderPage(<ProgressPage />)

    expect((await screen.findAllByText(/not yet assessed/i)).length).toBeGreaterThan(0)
  })

  it('shows achievements behind their tab', async () => {
    mockApi({ 'GET /progress': makeProgress({ competencies: makeCompetencies(70) }) })
    renderPage(<ProgressPage />)

    await screen.findByText('Overall Score')
    await user.click(screen.getByRole('button', { name: /achievements/i }))

    expect(await screen.findByText('First Patient')).toBeInTheDocument()
    expect(screen.getByText('Safe Hands')).toBeInTheDocument()
    expect(screen.getByText('0 of 5')).toBeInTheDocument()
  })

  it('shows an error state when progress cannot be loaded', async () => {
    mockApi({ 'GET /progress': reply({ status: 500, body: { detail: null } }) })
    renderPage(<ProgressPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
