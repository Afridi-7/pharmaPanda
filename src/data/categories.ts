import type { ScenarioCategory } from '@/types'

/**
 * Category filter options for the simulation library.
 *
 * A UI constant, not scenario content — the scenarios themselves are served by
 * the API. Kept in sync with `ScenarioCategory` in `@/types`.
 */
export const scenarioCategories: readonly ScenarioCategory[] = [
  'Pain',
  'Cough & Cold',
  'Allergy',
  'Gastrointestinal',
  'Dermatology',
  'Minor Injuries',
  'Medication Counseling',
  'Drug Interactions',
  'Calculations',
] as const
