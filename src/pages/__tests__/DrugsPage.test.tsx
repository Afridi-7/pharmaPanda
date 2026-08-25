import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DrugsPage } from '@/pages/DrugsPage'
import { DrugDetailPage } from '@/pages/DrugDetailPage'
import { renderPage, user } from '@/test/harness'

/** Drugs still run on the local service layer, so these use the real dataset. */

describe('DrugsPage', () => {
  it('lists the drug reference', async () => {
    renderPage(<DrugsPage />)

    expect(await screen.findByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText(/Showing \d+ of \d+/)).toBeInTheDocument()
  })

  it('filters as you search', async () => {
    renderPage(<DrugsPage />)

    await screen.findByText('Paracetamol')
    await user.type(screen.getByLabelText(/search drugs/i), 'paracetamol')

    expect(await screen.findByText('Showing 1 of 7')).toBeInTheDocument()
  })

  it('explains an empty search result', async () => {
    renderPage(<DrugsPage />)

    await screen.findByText('Paracetamol')
    await user.type(screen.getByLabelText(/search drugs/i), 'zzzznotadrug')

    expect(await screen.findByText(/no drugs match/i)).toBeInTheDocument()
  })
})

describe('DrugDetailPage', () => {
  it('shows counselling, safety and interaction detail', async () => {
    renderPage(<DrugDetailPage />, { route: '/drugs/drug_paracetamol', path: '/drugs/:id' })

    expect(await screen.findByText('Counselling points')).toBeInTheDocument()
    expect(screen.getByText('Safety considerations')).toBeInTheDocument()
    expect(screen.getByText('Interactions to watch')).toBeInTheDocument()
  })

  it('carries the educational-use disclaimer', async () => {
    renderPage(<DrugDetailPage />, { route: '/drugs/drug_paracetamol', path: '/drugs/:id' })

    expect(await screen.findByText(/not a substitute/i)).toBeInTheDocument()
  })

  it('offers a way back when the drug does not exist', async () => {
    renderPage(<DrugDetailPage />, { route: '/drugs/nope', path: '/drugs/:id' })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to drug knowledge/i })).toBeInTheDocument()
  })
})
