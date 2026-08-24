import type { Competency } from '@/types'

/**
 * Competency definitions.
 *
 * Labels, descriptions and focus areas are course content. Scores start at zero
 * and are only ever moved by `evaluationService.evaluate()` from a real
 * consultation — a new account must not be shown progress it has not earned.
 */
export const competencySeed: Competency[] = [
  {
    key: 'historyTaking',
    label: 'History Taking',
    description:
      'Gathering a structured, complete picture of the complaint before reaching for a product.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: [
      'Ask about symptom duration and severity in the first two questions.',
      'Screen medication and allergy history before recommending anything.',
    ],
  },
  {
    key: 'clinicalReasoning',
    label: 'Clinical Reasoning',
    description: 'Connecting findings into a working assessment and justifying the next step.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: [
      'Keep articulating why you ruled a red flag out, not only that you did.',
      'Try naming your working assessment before you choose a product.',
    ],
  },
  {
    key: 'medicationSafety',
    label: 'Medication Safety',
    description:
      'Spotting interactions, contraindications and cautions before they reach the patient.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: [
      'Anticoagulants: always check before offering any NSAID.',
      'Confirm allergy details — an aspirin allergy changes the whole analgesic ladder.',
    ],
  },
  {
    key: 'counseling',
    label: 'Counseling',
    description: 'Explaining the plan so the patient can actually follow it at home.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: [
      'Include dose, frequency, maximum daily dose and when to come back.',
      'Finish with a teach-back question so you know the plan was understood.',
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Plain language, empathy, and checking that you were understood.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: [
      'Swap clinical terms such as contraindicated or gastric for everyday words.',
      'Acknowledge worry explicitly before moving to your questions.',
    ],
  },
  {
    key: 'referralDecisions',
    label: 'Referral Decisions',
    description: 'Knowing when self-care stops and someone else needs to see the patient.',
    score: 0,
    previousScore: 0,
    attempts: 0,
    trendLabel: 'No attempts yet',
    history: [],
    focusAreas: [
      'Say the urgency out loud: today, this week, or right now.',
      'Tell the patient what to say when they get there.',
    ],
  },
]

export const competencyLabels: Record<Competency['key'], string> = {
  historyTaking: 'History Taking',
  clinicalReasoning: 'Clinical Reasoning',
  medicationSafety: 'Medication Safety',
  counseling: 'Counseling',
  communication: 'Communication',
  referralDecisions: 'Referral Decisions',
}
