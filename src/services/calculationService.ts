import type { CalculationProblem, CalculationTopic } from '@/types'
import { calculationProblems, calculationTopics, getProblem, problemsForTopic } from '@/data/calculations'
import { notFound, request } from './api'

export interface CalculationCheck {
  correct: boolean
  submitted: number
  answer: number
  unit: string
  steps: { title: string; detail: string }[]
  explanationIntro: string
  pitfall: string
  /** Set when the answer is out by a factor of ten — a distinct teaching moment. */
  factorOfTen: boolean
}

export const calculationService = {
  async topics() {
    return request(
      () =>
        calculationTopics.map((topic) => ({
          ...topic,
          problemCount: problemsForTopic(topic.topic).length,
        })),
      { latency: 240, label: 'calculationService.topics' },
    )
  },

  async byTopic(topic: CalculationTopic): Promise<CalculationProblem[]> {
    return request(() => problemsForTopic(topic), { latency: 240, label: 'calculationService.byTopic' })
  },

  async get(id: string): Promise<CalculationProblem> {
    return request(() => getProblem(id) ?? notFound('problem'), { latency: 220, label: 'calculationService.get' })
  },

  async next(currentId: string): Promise<CalculationProblem> {
    return request(
      () => {
        const index = calculationProblems.findIndex((p) => p.id === currentId)
        return calculationProblems[(index + 1) % calculationProblems.length]
      },
      { latency: 260, label: 'calculationService.next' },
    )
  },

  /** Marking stays server-side in production so answers are not shipped to the client. */
  async check(id: string, submitted: number): Promise<CalculationCheck> {
    return request(
      () => {
        const problem = getProblem(id) ?? notFound('problem')
        const correct = Math.abs(submitted - problem.answer) <= problem.tolerance
        const ratio = problem.answer === 0 ? 1 : submitted / problem.answer
        return {
          correct,
          submitted,
          answer: problem.answer,
          unit: problem.unit,
          steps: problem.steps,
          explanationIntro: problem.explanationIntro,
          pitfall: problem.pitfall,
          factorOfTen: !correct && (Math.abs(ratio - 10) < 0.6 || Math.abs(ratio - 0.1) < 0.06),
        }
      },
      { latency: 420, label: 'calculationService.check' },
    )
  },
}
