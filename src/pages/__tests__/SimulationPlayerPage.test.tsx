import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SimulationPlayerPage } from '@/pages/SimulationPlayerPage'
import {
  ASPIRIN_FACT,
  makeAttempt,
  makePatient,
  makeScenario,
} from '@/test/fixtures'
import type { Patient } from '@/types'
import { expectNotLeaked, mockApi, renderPage, reply, user } from '@/test/harness'

const ATTEMPT_ID = '22222222-2222-4222-8222-222222222222'

/** Facts the patient has not disclosed. None may appear in the DOM. */
const UNDISCLOSED = ['Warfarin', 'Aspirin', 'Gastric ulcer', 'Not pregnant']

function routes(overrides: Record<string, unknown> = {}) {
  return {
    [`GET /attempts/${ATTEMPT_ID}`]: makeAttempt(),
    'GET /scenarios/sc_headache': makeScenario(),
    [`GET /attempts/${ATTEMPT_ID}/patient`]: makePatient(),
    ...overrides,
  }
}

function renderPlayer() {
  return renderPage(<SimulationPlayerPage />, {
    route: `/attempt/${ATTEMPT_ID}`,
    path: '/attempt/:id',
  })
}

describe('SimulationPlayerPage', () => {
  it('opens the consultation with the patient and their opening line', async () => {
    mockApi(routes())
    renderPlayer()

    expect(await screen.findByText(/Iqra Muhammad, 20/)).toBeInTheDocument()
    expect(screen.getByText(/really bad headache/)).toBeInTheDocument()
  })

  it('does not render facts the patient has not disclosed', async () => {
    // The API normally filters hidden facts out, but the panel must filter too:
    // this hands it an undisclosed fact and asserts it never reaches the DOM.
    const withHidden: Patient = makePatient({
      facts: [...makePatient().facts, ASPIRIN_FACT],
    })
    mockApi(
      routes({
        [`GET /attempts/${ATTEMPT_ID}/patient`]: withHidden,
        // The attempt has NOT revealed the allergy.
        [`GET /attempts/${ATTEMPT_ID}`]: makeAttempt({ revealedFactIds: ['sarah_age'] }),
      }),
    )
    const { container } = renderPlayer()

    await screen.findByText(/Iqra Muhammad, 20/)
    expectNotLeaked(container, UNDISCLOSED)
  })

  it('reveals a fact only after the question that unlocks it', async () => {
    const api = mockApi(
      routes({
        [`POST /attempts/${ATTEMPT_ID}/messages`]: {
          attempt: makeAttempt({
            revealedFactIds: ['sarah_age', 'sarah_allergy'],
            messages: [
              ...makeAttempt().messages,
              { id: 'msg_3', author: 'student', text: 'Any allergies?', at: '2026-08-24T10:01:00Z' },
              { id: 'msg_4', author: 'patient', text: 'Yes — aspirin.', at: '2026-08-24T10:01:00Z' },
            ],
          }),
          messages: [
            { id: 'msg_3', author: 'student', text: 'Any allergies?', at: '2026-08-24T10:01:00Z' },
            { id: 'msg_4', author: 'patient', text: 'Yes — aspirin.', at: '2026-08-24T10:01:00Z' },
          ],
          revealed: [ASPIRIN_FACT],
        },
      }),
    )

    const { container } = renderPlayer()
    await screen.findByText(/Iqra Muhammad, 20/)

    // Before asking, the allergy is absent.
    expectNotLeaked(container, ['Aspirin'])

    await user.type(screen.getByLabelText(/ask the patient/i), 'Any allergies?')
    await user.click(screen.getByRole('button', { name: /send question/i }))

    // After asking, it appears — and the request actually went to the API.
    expect(await screen.findByText(/facial swelling/)).toBeInTheDocument()
    expect(api.calls).toContain(`POST /attempts/${ATTEMPT_ID}/messages`)
  })

  it('shows the objectives checklist', async () => {
    mockApi(routes())
    renderPlayer()

    expect(await screen.findByText('Gather relevant history')).toBeInTheDocument()
    expect(screen.getByText('Assess medication safety')).toBeInTheDocument()
  })

  it('records a recommendation through the API', async () => {
    const api = mockApi(
      routes({
        [`POST /attempts/${ATTEMPT_ID}/recommendation`]: {
          attempt: makeAttempt({
            recommendation: { choice: 'Paracetamol', reasoning: 'Safe with warfarin.' },
          }),
          messages: [],
          revealed: [],
        },
      }),
    )

    renderPlayer()
    await screen.findByText(/Iqra Muhammad, 20/)

    await user.click(screen.getByRole('button', { name: /recommend/i }))
    await user.click(screen.getByRole('button', { name: 'Paracetamol' }))
    await user.type(screen.getByLabelText(/why/i), 'Safe with warfarin and avoids NSAID risk.')
    await user.click(screen.getByRole('button', { name: /submit recommendation/i }))

    await waitFor(() => {
      expect(api.calls).toContain(`POST /attempts/${ATTEMPT_ID}/recommendation`)
    })
    expect(api.bodies[`POST /attempts/${ATTEMPT_ID}/recommendation`]).toMatchObject({
      choice: 'Paracetamol',
    })
  })

  it('locks a submitted consultation instead of accepting more input', async () => {
    mockApi(routes({ [`GET /attempts/${ATTEMPT_ID}`]: makeAttempt({ status: 'submitted' }) }))
    renderPlayer()

    expect(await screen.findByText(/no longer be changed/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/ask the patient/i)).not.toBeInTheDocument()
  })

  it('offers a route back when the consultation cannot be loaded', async () => {
    mockApi({ [`GET /attempts/${ATTEMPT_ID}`]: reply({ status: 404, body: { detail: 'Not found.' } }) })
    renderPlayer()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to simulations/i })).toBeInTheDocument()
  })

  it('confirms before finishing, and lists what is still open', async () => {
    mockApi(routes())
    renderPlayer()
    await screen.findByText(/Iqra Muhammad, 20/)

    await user.click(screen.getByRole('button', { name: /finish consultation/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/still open/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /continue consultation/i })).toBeInTheDocument()
  })
})
