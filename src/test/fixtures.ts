import type {
  AttemptSummary,
  Competency,
  Drug,
  Evaluation,
  Patient,
  Scenario,
  ScenarioAttempt,
  User,
} from '@/types'

/**
 * Canonical API payloads.
 *
 * Shapes mirror what FastAPI actually returns, so a backend contract change
 * shows up as a failing test rather than as a silently broken page. Each
 * builder takes overrides so a test can state only what it cares about.
 */

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Iqra',
    lastName: 'Muhammad',
    email: 'iqra@university.edu',
    university: 'University of Debrecen',
    year: '3rd Year',
    avatarSeed: 'panda-iqra',
    experience: 'Intermediate',
    learningGoals: ['Clinical reasoning', 'Medication safety'],
    onboarded: true,
    joinedAt: '2026-02-11T09:00:00.000Z',
    streakDays: 3,
    ...overrides,
  }
}

export function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'sc_headache',
    title: 'The Headache That Isn’t Simple',
    tagline: 'A routine request that deserves a careful conversation.',
    description: 'A 20-year-old asks for something for a headache.',
    mission: 'Determine whether self-care is appropriate.',
    category: 'Pain',
    setting: 'Community Pharmacy',
    difficulty: 'Intermediate',
    durationMinutes: [8, 10],
    skills: ['History Taking', 'Medication Safety'],
    objectives: ['Take a structured headache history.', 'Screen for red flags.'],
    status: 'not-started',
    patientId: 'pat_sarah',
    ...overrides,
  }
}

/** Only ever contains facts the attempt has revealed — as the API enforces. */
export function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'pat_sarah',
    name: 'Iqra Muhammad',
    age: 20,
    pronouns: 'she/her',
    role: 'Patient',
    mood: 'worried',
    avatar: 'sarah',
    openingLine: 'Hi. I’ve had a really bad headache since yesterday.',
    chiefComplaint: 'Headache',
    facts: [
      {
        id: 'sarah_age',
        section: 'basic',
        label: 'Age',
        value: '20',
        revealedAtStart: true,
        triggers: [],
        patientLine: 'I’m 20.',
        credits: 'historyTaking',
      },
    ],
    deflections: [],
    impatientLines: [],
    followUps: [],
    jargon: [],
    ...overrides,
  }
}

export const ASPIRIN_FACT = {
  id: 'sarah_allergy',
  section: 'allergies' as const,
  label: 'Allergy',
  value: 'Aspirin — facial swelling and wheeze',
  revealedAtStart: false,
  triggers: [],
  patientLine: 'Yes — aspirin.',
  credits: 'medicationSafety' as const,
  safetyCritical: true,
}

export function makeAttempt(overrides: Partial<ScenarioAttempt> = {}): ScenarioAttempt {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    scenarioId: 'sc_headache',
    userId: '11111111-1111-4111-8111-111111111111',
    status: 'in-progress',
    startedAt: '2026-08-24T10:00:00.000Z',
    durationSeconds: 0,
    messages: [
      {
        id: 'msg_1',
        author: 'system',
        text: 'Iqra Muhammad approaches the counter.',
        at: '2026-08-24T10:00:00.000Z',
      },
      {
        id: 'msg_2',
        author: 'patient',
        text: 'Hi. I’ve had a really bad headache since yesterday.',
        at: '2026-08-24T10:00:00.000Z',
      },
    ],
    actions: [],
    revealedFactIds: ['sarah_age'],
    notes: '',
    objectivesMet: [],
    ...overrides,
  }
}

export function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    attemptId: '22222222-2222-4222-8222-222222222222',
    scenarioId: 'sc_headache',
    scenarioTitle: 'The Headache That Isn’t Simple',
    totalScore: 86,
    headline: 'Strong consultation',
    pandaMessage: 'Structured questioning and a well-justified decision.',
    scores: [
      { key: 'historyTaking', label: 'History Taking', score: 91 },
      { key: 'clinicalReasoning', label: 'Clinical Reasoning', score: 89 },
      { key: 'medicationSafety', label: 'Medication Safety', score: 100 },
      { key: 'counseling', label: 'Counseling', score: 72 },
      { key: 'communication', label: 'Communication', score: 54 },
      { key: 'referralDecisions', label: 'Referral Decisions', score: 68 },
    ],
    strengths: [{ id: 'hl_1', title: 'Checked for allergies', detail: 'You asked directly.' }],
    missed: [{ id: 'hl_2', title: 'Little explicit empathy', detail: 'One sentence would help.' }],
    safetyIssues: [],
    timeline: [
      { id: 'tl_1', kind: 'student-ask', label: 'Student asked', detail: '“Any allergies?”' },
    ],
    betterApproach: ['Gather relevant history.', 'Screen for red flags.'],
    nextScenarioId: 'sc_inhaler',
    nextScenarioReason: 'Counselling is where you can gain most next.',
    createdAt: '2026-08-24T10:06:00.000Z',
    ...overrides,
  }
}

export const CRITICAL_SAFETY_ISSUE = {
  id: 'si_1',
  severity: 'critical' as const,
  title: 'NSAID recommended despite significant contraindications',
  what: 'You recommended an NSAID for a patient taking warfarin.',
  why: 'NSAIDs increase bleeding risk substantially on warfarin.',
}

export function makeCompetency(overrides: Partial<Competency> = {}): Competency {
  return {
    key: 'historyTaking',
    label: 'History Taking',
    description: 'Gathering a structured picture of the complaint.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: ['Ask about duration and severity early.'],
    ...overrides,
  }
}

const COMPETENCY_KEYS: Competency['key'][] = [
  'historyTaking',
  'clinicalReasoning',
  'medicationSafety',
  'counseling',
  'communication',
  'referralDecisions',
]

const COMPETENCY_LABELS: Record<Competency['key'], string> = {
  historyTaking: 'History Taking',
  clinicalReasoning: 'Clinical Reasoning',
  medicationSafety: 'Medication Safety',
  counseling: 'Counseling',
  communication: 'Communication',
  referralDecisions: 'Referral Decisions',
}

/** All six competencies, at `score` each. `score: 0` models a new account. */
export function makeCompetencies(score = 0): Competency[] {
  return COMPETENCY_KEYS.map((key) =>
    makeCompetency({
      key,
      label: COMPETENCY_LABELS[key],
      score,
      previousScore: score,
      attempts: score > 0 ? 1 : 0,
      trendLabel: score > 0 ? 'First attempt' : 'No attempts yet',
      history: score > 0 ? [{ label: '#1', score }] : [],
    }),
  )
}

export function makeProgress(overrides: Record<string, unknown> = {}) {
  return {
    overallScore: 0,
    competencies: makeCompetencies(0),
    achievements: [
      {
        id: 'ach_first_patient',
        title: 'First Patient',
        description: 'Completed your first full consultation.',
        icon: 'stethoscope',
        unlocked: false,
      },
      {
        id: 'ach_safe_hands',
        title: 'Safe Hands',
        description: 'Five consultations without a critical safety issue.',
        icon: 'shield',
        unlocked: false,
        progress: { current: 0, target: 5 },
      },
    ],
    weeklyActivity: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({
      label,
      consultations: 0,
    })),
    streakDays: 0,
    consultationsCompleted: 0,
    recommendedScenarioSlug: 'sc_inhaler',
    recommendationReason: 'Start with a case that exercises history taking.',
    ...overrides,
  }
}

export function makeAttemptSummary(overrides: Partial<AttemptSummary> = {}): AttemptSummary {
  return {
    attemptId: '22222222-2222-4222-8222-222222222222',
    scenarioId: 'sc_headache',
    scenarioTitle: 'The Headache That Isn’t Simple',
    category: 'Pain',
    score: 86,
    date: new Date().toISOString(),
    durationLabel: '6 min',
    status: 'Completed',
    ...overrides,
  }
}

export function makeDrug(overrides: Partial<Drug> = {}): Drug {
  return {
    id: 'drug_paracetamol',
    name: 'Paracetamol',
    drugClass: 'Analgesic / antipyretic',
    summary: 'First-line analgesic for mild to moderate pain.',
    commonUses: ['Headache', 'Fever'],
    adverseEffects: ['Hepatotoxicity in overdose'],
    counselingPoints: ['No more than 4g in 24 hours.'],
    safetyConsiderations: ['Reduce the maximum in low body weight.'],
    interactionsToWatch: ['Warfarin: sustained high doses may raise INR.'],
    sourceNote: 'Reference entry.',
    ...overrides,
  }
}
