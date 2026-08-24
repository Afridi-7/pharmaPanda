/**
 * PharmaPanda domain types.
 *
 * These mirror the payloads the future FastAPI + PostgreSQL backend is expected
 * to return. The mock services in `src/services` are the only place that
 * fabricates them, so swapping in real HTTP calls should not touch the UI.
 */

export type YearOfStudy = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year' | 'Graduate'

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type LearningGoal =
  | 'Clinical reasoning'
  | 'Patient counseling'
  | 'Medication safety'
  | 'History taking'
  | 'Pharmacy calculations'
  /** Retired option. No longer offered at onboarding; retained so accounts
   *  that selected it before the OSCE section was removed still deserialise. */
  | 'OSCE preparation'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  university: string
  year: YearOfStudy
  avatarSeed: string
  experience: ExperienceLevel
  learningGoals: LearningGoal[]
  onboarded: boolean
  joinedAt: string
  streakDays: number
}

export type CompetencyKey =
  | 'historyTaking'
  | 'clinicalReasoning'
  | 'medicationSafety'
  | 'counseling'
  | 'communication'
  | 'referralDecisions'

export interface Competency {
  key: CompetencyKey
  label: string
  description: string
  score: number
  previousScore: number
  attempts: number
  /** Short human-readable trend, e.g. "+7% this month". */
  trendLabel: string
  history: { label: string; score: number }[]
  focusAreas: string[]
}

export type ScenarioCategory =
  | 'Pain'
  | 'Cough & Cold'
  | 'Allergy'
  | 'Gastrointestinal'
  | 'Dermatology'
  | 'Minor Injuries'
  | 'Medication Counseling'
  | 'Drug Interactions'
  | 'Calculations'

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type ScenarioSetting = 'Community Pharmacy' | 'Hospital Ward' | 'Clinic' | 'Telepharmacy'

export type CompletionStatus = 'not-started' | 'in-progress' | 'completed'

export interface Scenario {
  id: string
  title: string
  tagline: string
  description: string
  mission: string
  category: ScenarioCategory
  setting: ScenarioSetting
  difficulty: Difficulty
  durationMinutes: [number, number]
  skills: string[]
  objectives: string[]
  status: CompletionStatus
  previousScore?: number
  lastAttemptId?: string
  patientId: string
}

/** A single fact about the patient that the student can uncover by asking. */
export interface PatientFact {
  id: string
  /** Which panel section the fact belongs to. */
  section: 'basic' | 'symptoms' | 'history' | 'allergies' | 'medications' | 'other'
  label: string
  value: string
  /** Visible from the start (e.g. age, chief complaint). */
  revealedAtStart: boolean
  /** Keywords/intents that unlock the fact. */
  triggers: string[]
  /** What the patient says when this fact is revealed. */
  patientLine: string
  /** Competency credited when the student uncovers this. */
  credits: CompetencyKey
  /** Facts that materially change safe practice. */
  safetyCritical?: boolean
}

export interface Patient {
  id: string
  name: string
  age: number
  pronouns: string
  role: string
  mood: 'calm' | 'worried' | 'impatient' | 'tired' | 'cheerful'
  avatar: 'sarah' | 'thomas' | 'amina' | 'george' | 'lena' | 'mateo' | 'ruth' | 'nadia'
  openingLine: string
  chiefComplaint: string
  /** Facts, both visible and hidden. */
  facts: PatientFact[]
  /** Fallback lines when the student's question is not understood. */
  deflections: string[]
  /** Lines the patient volunteers when asked something unrelated too often. */
  impatientLines: string[]
  /** Questions the patient asks back, keyed by trigger keyword. */
  followUps: { triggers: string[]; line: string }[]
  /** Jargon the patient does not understand. */
  jargon: string[]
}

export type MessageAuthor = 'student' | 'patient' | 'system'

export interface ConversationMessage {
  id: string
  author: MessageAuthor
  text: string
  at: string
  /** Fact ids uncovered by this exchange. */
  revealed?: string[]
  /** System notes, e.g. "Patient looks confused". */
  tone?: 'neutral' | 'concerned' | 'confused' | 'reassured' | 'impatient'
}

export type StudentActionType =
  | 'question'
  | 'recommendation'
  | 'counseling'
  | 'referral'
  | 'note'
  | 'finish'

export type RecommendationOption =
  | 'Paracetamol'
  | 'NSAID'
  | 'Non-drug management'
  | 'No OTC treatment'
  | 'Routine physician referral'
  | 'Urgent referral'
  | 'Other'

export type ReferralOption =
  | 'No referral'
  | 'Routine physician referral'
  | 'Urgent referral'
  | 'Emergency referral'

export interface StudentAction {
  id: string
  type: StudentActionType
  at: string
  /** Free text: the question asked, the reasoning given, the counseling script. */
  content: string
  /** Structured choice for recommendation/referral actions. */
  choice?: RecommendationOption | ReferralOption | string
  revealed?: string[]
}

export type AttemptStatus = 'in-progress' | 'submitted' | 'evaluated' | 'abandoned'

export interface ScenarioAttempt {
  id: string
  scenarioId: string
  userId: string
  status: AttemptStatus
  startedAt: string
  finishedAt?: string
  durationSeconds: number
  messages: ConversationMessage[]
  actions: StudentAction[]
  revealedFactIds: string[]
  notes: string
  objectivesMet: string[]
  recommendation?: { choice: RecommendationOption; reasoning: string }
  counseling?: string
  referral?: { choice: ReferralOption; reasoning: string }
  evaluationId?: string
  score?: number
}

export interface EvaluationHighlight {
  id: string
  title: string
  detail: string
}

export interface SafetyIssue {
  id: string
  severity: 'critical' | 'warning'
  title: string
  what: string
  why: string
}

export interface TimelineStep {
  id: string
  kind: 'student-ask' | 'patient-reveal' | 'student-decision' | 'system-detect' | 'student-counsel'
  label: string
  detail: string
}

export interface Evaluation {
  id: string
  attemptId: string
  scenarioId: string
  scenarioTitle: string
  totalScore: number
  headline: string
  pandaMessage: string
  scores: { key: CompetencyKey; label: string; score: number }[]
  strengths: EvaluationHighlight[]
  missed: EvaluationHighlight[]
  safetyIssues: SafetyIssue[]
  timeline: TimelineStep[]
  betterApproach: string[]
  nextScenarioId: string
  nextScenarioReason: string
  createdAt: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: 'stethoscope' | 'shield' | 'brain' | 'messages' | 'flame' | 'sparkles'
  unlocked: boolean
  unlockedAt?: string
  progress?: { current: number; target: number }
}

export type CalculationTopic =
  | 'Dose Calculation'
  | 'Concentration'
  | 'Dilution'
  | 'Infusion Rate'
  | 'Weight-Based Dosing'
  | 'Quantity to Dispense'

export interface CalculationProblem {
  id: string
  title: string
  prompt: string
  question: string
  unit: string
  explanationIntro: string
  topic: CalculationTopic
  difficulty: Difficulty
  /** Context lines shown as a mini patient/prescription card. */
  givens: { label: string; value: string }[]
  answer: number
  tolerance: number
  steps: { title: string; detail: string }[]
  pitfall: string
}

export interface Drug {
  id: string
  name: string
  genericFor?: string
  drugClass: string
  summary: string
  commonUses: string[]
  adverseEffects: string[]
  counselingPoints: string[]
  safetyConsiderations: string[]
  interactionsToWatch: string[]
  /** Where a future curated-RAG backend sourced the entry. */
  sourceNote: string
}

export interface DashboardSnapshot {
  greeting: string
  overallScore: number
  metrics: { label: string; value: number }[]
  competencies: Competency[]
  continueScenario: Scenario
  recommendedScenario: Scenario
  recommendationReason: string
  recentAttempts: AttemptSummary[]
  weeklyActivity: { label: string; consultations: number }[]
}

export interface AttemptSummary {
  attemptId: string
  scenarioId: string
  scenarioTitle: string
  category: ScenarioCategory
  score: number
  date: string
  durationLabel: string
  status: 'Completed' | 'Needs review' | 'Abandoned'
}

