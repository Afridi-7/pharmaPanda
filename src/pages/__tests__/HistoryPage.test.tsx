import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HistoryPage } from '@/pages/HistoryPage'
import { makeAttemptSummary } from '@/test/fixtures'
import { mockApi, renderPage, user } from '@/test/harness'

describe('HistoryPage', () => {
  it('invites a new account to start', async () => {
    mockApi({ 'GET /attempts': [] })
    renderPage(<HistoryPage />)

    expect(await screen.findByText(/no consultations yet/i)).toBeInTheDocument()
    // Summary tiles would be three meaningless zeros.
    expect(screen.queryByText('Average Score')).not.toBeInTheDocument()
  })

  it('lists consultations with a link to each report', async () => {
    mockApi({ 'GET /attempts': [makeAttemptSummary()] })
    renderPage(<HistoryPage />)

    const table = await screen.findByRole('table')
    expect(within(table).getByText(/The Headache/)).toBeInTheDocument()
    expect(within(table).getAllByRole('link', { name: /view results/i })[0]).toHaveAttribute(
      'href',
      '/results/22222222-2222-4222-8222-222222222222',
    )
  })

  it('formats dates rather than printing a raw timestamp', async () => {
    mockApi({ 'GET /attempts': [makeAttemptSummary({ date: new Date().toISOString() })] })
    const { container } = renderPage(<HistoryPage />)

    const table = await screen.findByRole('table')
    expect(container.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
    expect(within(table).getByText('Today')).toBeInTheDocument()
  })

  it('filters the list without refetching', async () => {
    const api = mockApi({
      'GET /attempts': [
        makeAttemptSummary({ attemptId: 'a1', scenarioTitle: 'Completed case', status: 'Completed', score: 90 }),
        makeAttemptSummary({ attemptId: 'a2', scenarioTitle: 'Weak case', status: 'Needs review', score: 60 }),
      ],
    })
    renderPage(<HistoryPage />)

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Completed case')).toBeInTheDocument()
    const before = api.countOf('GET /attempts')

    await user.click(screen.getByRole('tab', { name: /needs review/i }))

    const filtered = await screen.findByRole('table')
    expect(within(filtered).getByText('Weak case')).toBeInTheDocument()
    expect(within(filtered).queryByText('Completed case')).not.toBeInTheDocument()
    expect(api.countOf('GET /attempts')).toBe(before)
  })

  it('explains an empty filter result', async () => {
    mockApi({ 'GET /attempts': [makeAttemptSummary({ status: 'Completed', score: 60 })] })
    renderPage(<HistoryPage />)

    await screen.findByRole('table')
    await user.click(screen.getByRole('tab', { name: /high scores/i }))

    expect(await screen.findByText(/nothing matches that filter/i)).toBeInTheDocument()
  })
})
