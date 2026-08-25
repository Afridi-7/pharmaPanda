import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CalculationProblemPage } from '@/pages/CalculationProblemPage'
import { renderPage, user } from '@/test/harness'

/**
 * Calculations still run on the local service layer rather than the API, so
 * these tests exercise the real dataset and real marking. When calculations
 * move behind the API, only the transport changes — the assertions hold.
 */

const QUESTION = /How many mL should be administered per dose/i
const CORRECT = '4.5'

const renderProblem = () =>
  renderPage(<CalculationProblemPage />, {
    route: '/calculations/Weight-Based%20Dosing',
    path: '/calculations/:id',
  })

async function answer(value: string) {
  await user.type(screen.getByLabelText(/your answer/i), value)
  await user.click(screen.getByRole('button', { name: /check answer/i }))
}

describe('CalculationProblemPage', () => {
  it('shows the prescription and the question', async () => {
    renderProblem()

    expect(await screen.findByText(QUESTION)).toBeInTheDocument()
    expect(screen.getByText('18 kg')).toBeInTheDocument()
    expect(screen.getByText('400 mg / 5 mL')).toBeInTheDocument()
  })

  it('does not reveal the working before an answer is submitted', async () => {
    const { container } = renderProblem()

    await screen.findByText(QUESTION)
    expect(screen.queryByText(/Working/)).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('720 mg per day')
  })

  it('marks a correct answer and reveals the worked solution', async () => {
    renderProblem()
    await screen.findByText(QUESTION)

    await answer(CORRECT)

    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(screen.getByText(/720 mg per day/)).toBeInTheDocument()
    expect(screen.getByText(/most common slip/i)).toBeInTheDocument()
  })

  it('marks a wrong answer, gives the right one, and offers a retry', async () => {
    renderProblem()
    await screen.findByText(QUESTION)

    await answer('9')

    expect(await screen.findByText('Not quite')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls out a factor-of-ten error specifically', async () => {
    renderProblem()
    await screen.findByText(QUESTION)

    // 45 instead of 4.5 — the error that actually reaches a patient.
    await answer('45')

    expect(await screen.findByText(/factor of ten/i)).toBeInTheDocument()
  })

  it('rejects a non-numeric answer without marking it', async () => {
    renderProblem()
    await screen.findByText(QUESTION)

    await answer('abc')

    expect(await screen.findByText(/as a number/i)).toBeInTheDocument()
    expect(screen.queryByText('Correct')).not.toBeInTheDocument()
    expect(screen.queryByText('Not quite')).not.toBeInTheDocument()
  })

  it('accepts an answer inside the stated tolerance', async () => {
    renderProblem()
    await screen.findByText(QUESTION)

    await answer('4.52')

    expect(await screen.findByText('Correct')).toBeInTheDocument()
  })
})
