import type { Achievement } from '@/types'

/**
 * Achievement definitions. All start locked with zero progress — they are
 * unlocked by `evaluationService.evaluate()` from real consultations, never
 * pre-awarded.
 */

export const achievements: Achievement[] = [
  {
    id: 'ach_first_patient',
    title: 'First Patient',
    description: 'Completed your first full consultation from greeting to counselling.',
    icon: 'stethoscope',
    unlocked: false,
  },
  {
    id: 'ach_safe_hands',
    title: 'Safe Hands',
    description: 'Finished five consultations in a row without a critical safety issue.',
    icon: 'shield',
    unlocked: false,
  },
  {
    id: 'ach_clinical_thinker',
    title: 'Clinical Thinker',
    description: 'Scored 85 or above in Clinical Reasoning across three different cases.',
    icon: 'brain',
    unlocked: false,
  },
  {
    id: 'ach_communicator',
    title: 'Patient Communicator',
    description: 'Counselled a patient without using a single term they did not understand.',
    icon: 'messages',
    unlocked: false,
    progress: { current: 0, target: 3 },
  },
  {
    id: 'ach_consistent',
    title: 'Consistent Learner',
    description: 'Practised on seven consecutive days.',
    icon: 'flame',
    unlocked: false,
    progress: { current: 0, target: 7 },
  },
  {
    id: 'ach_perfect',
    title: 'Perfect Consultation',
    description: 'Uncovered every safety-critical detail and scored 95 or above.',
    icon: 'sparkles',
    unlocked: false,
    progress: { current: 0, target: 95 },
  },
]
