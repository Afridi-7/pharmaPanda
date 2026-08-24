import type {
  CompetencyKey,
  Evaluation,
  EvaluationHighlight,
  Patient,
  RecommendationOption,
  ReferralOption,
  SafetyIssue,
  Scenario,
  ScenarioAttempt,
  TimelineStep,
} from '@/types'
import { clamp, matchesAny, uid } from '@/lib/utils'
import { competencyLabels } from '@/data/users'

/**
 * Deterministic local evaluation engine.
 *
 * This is a stand-in for the backend Evaluation Engine. It scores *behaviour* —
 * what the student asked, in what order, and what they did with the answers —
 * rather than only the final recommendation. Replacing it with an API call means
 * swapping `evaluationService.evaluate()`; nothing in the UI depends on the maths.
 */

interface ScenarioRule {
  /** Recommendations that are unsafe once these fact ids are in play. */
  unsafeRecommendations: {
    choices: RecommendationOption[]
    requiresFacts?: string[]
    title: string
    what: string
    why: string
  }[]
  /** Recommendation considered clinically appropriate. */
  preferredRecommendations: RecommendationOption[]
  /** Referral outcome expected for a competent consultation. */
  expectedReferrals: ReferralOption[]
  /** Facts a safe consultation must uncover. */
  criticalFactIds: string[]
  betterApproach: string[]
  nextScenarioId: string
  nextScenarioReason: string
}

const DEFAULT_BETTER_APPROACH = [
  'Gather relevant history.',
  'Screen for red flags.',
  'Ask about allergies.',
  'Review current medications.',
  'Assess contraindications.',
  'Determine appropriate treatment.',
  'Provide counseling.',
]

const rules: Record<string, ScenarioRule> = {
  sc_headache: {
    unsafeRecommendations: [
      {
        choices: ['NSAID'],
        title: 'NSAID recommended despite significant contraindications',
        what:
          'You recommended an NSAID for a patient taking warfarin, with a previous gastric ulcer and an aspirin allergy.',
        why:
          'NSAIDs increase bleeding risk substantially on warfarin, they are directly implicated in peptic ulcer recurrence, and cross-reactivity with an aspirin allergy is well described. Paracetamol is the appropriate first-line analgesic here, alongside advice on hydration, sleep and screen breaks.',
      },
    ],
    preferredRecommendations: ['Paracetamol', 'Non-drug management'],
    expectedReferrals: ['No referral', 'Routine physician referral'],
    criticalFactIds: ['sarah_allergy', 'sarah_meds', 'sarah_history', 'sarah_redflags'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_inhaler',
    nextScenarioReason: 'Your clinical reasoning is strong. Let’s improve your patient counseling.',
  },
  sc_cough: {
    unsafeRecommendations: [
      {
        choices: ['NSAID', 'Paracetamol', 'Non-drug management'],
        title: 'Symptomatic treatment offered instead of referral',
        what: 'You treated a five-week cough with weight loss, night sweats and a 30 pack-year smoking history.',
        why:
          'This combination meets referral criteria for suspected serious pathology and needs imaging, not a cough syrup. A chest examination and chest X-ray are the priority; the ACE inhibitor is a secondary consideration.',
      },
    ],
    preferredRecommendations: ['Routine physician referral', 'Urgent referral', 'No OTC treatment'],
    expectedReferrals: ['Urgent referral', 'Routine physician referral'],
    criticalFactIds: ['thomas_weight', 'thomas_smoking', 'thomas_meds'],
    betterApproach: [
      'Establish cough duration and character.',
      'Screen for weight loss, night sweats and haemoptysis.',
      'Take a smoking history in pack-years.',
      'Review medication for ACE-inhibitor cough.',
      'Recognise that red flags override symptomatic treatment.',
      'Refer with a clear stated urgency.',
      'Tell the patient exactly what to say when they book.',
    ],
    nextScenarioId: 'sc_interaction',
    nextScenarioReason: 'You handle referral well. Next, stress-test your medication safety knowledge.',
  },
  sc_heartburn: {
    unsafeRecommendations: [
      {
        choices: ['NSAID'],
        title: 'NSAID recommended in NSAID-induced dyspepsia',
        what: 'You recommended an NSAID for a patient whose symptoms are most likely caused by regular naproxen.',
        why:
          'Adding NSAID load to suspected NSAID-induced dyspepsia worsens the underlying cause. The correct approach is gastroprotection, a review of the naproxen with the prescriber, and lifestyle measures.',
      },
    ],
    preferredRecommendations: ['Routine physician referral', 'Non-drug management', 'Other'],
    expectedReferrals: ['Routine physician referral', 'No referral'],
    criticalFactIds: ['amina_meds', 'amina_alarm'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_inhaler',
    nextScenarioReason: 'Strong safety instincts. Counseling is where you can gain most next.',
  },
  sc_allergy: {
    unsafeRecommendations: [
      {
        choices: ['Other'],
        requiresFacts: ['george_job'],
        title: 'Sedating option for a professional driver',
        what: 'A sedating antihistamine was implied for a patient who drives a delivery van all day.',
        why:
          'Sedating antihistamines carry a documented impairment risk while driving. A non-sedating agent is essential, and his poorly controlled asthma needs addressing separately.',
      },
    ],
    preferredRecommendations: ['Other', 'Non-drug management', 'Routine physician referral'],
    expectedReferrals: ['Routine physician referral', 'No referral'],
    criticalFactIds: ['george_job', 'george_chest', 'george_history'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_fever_child',
    nextScenarioReason: 'Try a case where the dose itself has to be exactly right.',
  },
  sc_rash: {
    unsafeRecommendations: [],
    preferredRecommendations: ['Non-drug management', 'Other', 'Routine physician referral'],
    expectedReferrals: ['No referral', 'Routine physician referral'],
    criticalFactIds: ['lena_infection', 'lena_trigger'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_headache',
    nextScenarioReason: 'Practise a case where the safe choice depends on hidden medication history.',
  },
  sc_fever_child: {
    unsafeRecommendations: [
      {
        choices: ['NSAID'],
        requiresFacts: ['mateo_meds'],
        title: 'Second agent added without establishing the first dose',
        what: 'You added ibuprofen without first establishing how much paracetamol was actually given.',
        why:
          'An uncertain dose given with a kitchen spoon must be quantified before anything else is added, and the parent needs an oral syringe. Sequencing matters: establish, then dose, then safety-net.',
      },
    ],
    preferredRecommendations: ['Paracetamol', 'Non-drug management'],
    expectedReferrals: ['No referral', 'Routine physician referral'],
    criticalFactIds: ['mateo_redflags', 'mateo_weight', 'mateo_meds'],
    betterApproach: [
      'Screen for paediatric red flags first.',
      'Establish the child’s current weight.',
      'Establish exactly what has already been given, and when.',
      'Calculate the weight-based dose and check the maximum in 24 hours.',
      'Supply an oral syringe and demonstrate the measurement.',
      'Counsel on fluids, monitoring and antipyretic expectations.',
      'Safety-net: state precisely when to seek urgent help.',
    ],
    nextScenarioId: 'sc_inhaler',
    nextScenarioReason: 'Your dosing was careful. Next, focus on teaching a technique clearly.',
  },
  sc_missed_meds: {
    unsafeRecommendations: [
      {
        choices: ['Other'],
        requiresFacts: ['ruth_monitoring'],
        title: 'Missed-dose plan without addressing the glucose reading',
        what: 'A glucose of 14.2 mmol/L after a week without metformin was not acted upon.',
        why:
          'Restarting the usual dose is correct, but persistent hyperglycaemia after restarting needs prescriber review. Levothyroxine and ramipril should also simply be resumed at the usual dose — never doubled.',
      },
    ],
    preferredRecommendations: ['Routine physician referral', 'Other', 'Non-drug management'],
    expectedReferrals: ['Routine physician referral', 'No referral'],
    criticalFactIds: ['ruth_meds', 'ruth_monitoring', 'ruth_symptoms'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_interaction',
    nextScenarioReason: 'You are comfortable with chronic medication. Now test interaction knowledge.',
  },
  sc_inhaler: {
    unsafeRecommendations: [
      {
        choices: ['Other'],
        requiresFacts: ['nadia_reliever'],
        title: 'Escalation without correcting technique',
        what: 'A stronger inhaler was considered before technique and adherence were corrected.',
        why:
          'Reliever use of 8–10 puffs weekly with night waking indicates poor control, but the modifiable cause here is technique and preventer adherence. Escalating strength first exposes the patient to more steroid without fixing delivery.',
      },
    ],
    preferredRecommendations: ['Non-drug management', 'Other', 'Routine physician referral'],
    expectedReferrals: ['Routine physician referral', 'No referral'],
    criticalFactIds: ['nadia_technique', 'nadia_reliever', 'nadia_control'],
    betterApproach: [
      'Ask what the patient believes each inhaler does.',
      'Assess control: night symptoms, reliever use, activity limitation.',
      'Watch the technique rather than asking about it.',
      'Correct one or two steps at a time, then demonstrate.',
      'Explain preventer vs reliever in everyday language.',
      'Check understanding with teach-back.',
      'Arrange asthma review and document reliever overuse.',
    ],
    nextScenarioId: 'sc_headache',
    nextScenarioReason: 'Bring that counseling clarity into a medication safety case.',
  },
  sc_interaction: {
    unsafeRecommendations: [
      {
        choices: ['Other', 'Non-drug management'],
        requiresFacts: ['derek_meds'],
        title: 'Herbal supply considered alongside warfarin and sertraline',
        what: 'St John’s wort was not clearly declined for a patient on warfarin and sertraline.',
        why:
          'St John’s wort induces CYP450 enzymes and reduces warfarin effect — destabilising INR — and adds serotonergic risk with sertraline. This is a supply you decline, with a clear explanation and a route back to the prescriber.',
      },
    ],
    preferredRecommendations: ['No OTC treatment', 'Routine physician referral'],
    expectedReferrals: ['Routine physician referral', 'No referral'],
    criticalFactIds: ['derek_meds', 'derek_mood', 'derek_supplements'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_inhaler',
    nextScenarioReason: 'Your safety screening is excellent. Counseling clarity is the next gain.',
  },
  sc_wound: {
    unsafeRecommendations: [
      {
        choices: ['Non-drug management'],
        requiresFacts: ['priya_tetanus'],
        title: 'Wound dressed without addressing tetanus risk',
        what: 'A soil-contaminated wound was dressed without arranging tetanus assessment.',
        why:
          'A dirty wound with an uncertain booster history over 10 years old requires tetanus assessment. A gaping 3 cm laceration also warrants review for closure within the appropriate window.',
      },
    ],
    preferredRecommendations: ['Routine physician referral', 'Urgent referral'],
    expectedReferrals: ['Routine physician referral', 'Urgent referral'],
    criticalFactIds: ['priya_wound', 'priya_contamination', 'priya_tetanus'],
    betterApproach: DEFAULT_BETTER_APPROACH,
    nextScenarioId: 'sc_fever_child',
    nextScenarioReason: 'Solid assessment. Next, practise getting a paediatric dose exactly right.',
  },
}

export function ruleFor(scenarioId: string): ScenarioRule {
  return (
    rules[scenarioId] ?? {
      unsafeRecommendations: [],
      preferredRecommendations: ['Paracetamol', 'Non-drug management'],
      expectedReferrals: ['No referral', 'Routine physician referral'],
      criticalFactIds: [],
      betterApproach: DEFAULT_BETTER_APPROACH,
      nextScenarioId: 'sc_headache',
      nextScenarioReason: 'A good all-round case to consolidate what you practised.',
    }
  )
}

const COUNSELING_MARKERS = [
  { keys: ['dose', 'mg', 'ml', 'tablet', 'puff'], label: 'stated the dose' },
  { keys: ['maximum', 'max', 'no more than', 'per day', 'in 24 hours', 'four times'], label: 'gave a daily limit' },
  { keys: ['come back', 'see a doctor', 'if it gets worse', 'worse', 'return', 'call', 'seek'], label: 'safety-netted' },
  { keys: ['with food', 'water', 'how to take', 'morning', 'night', 'rinse', 'spacer'], label: 'explained how to use it' },
  { keys: ['any questions', 'does that make sense', 'repeat', 'tell me how you', 'teach'], label: 'checked understanding' },
]

const EMPATHY_MARKERS = ['sorry to hear', 'that sounds', 'i understand', 'must be', 'thank you for', 'i can see why']

function studentQuestions(attempt: ScenarioAttempt) {
  return attempt.actions.filter((a) => a.type === 'question')
}

interface ScoreSheet {
  scores: Record<CompetencyKey, number>
  strengths: EvaluationHighlight[]
  missed: EvaluationHighlight[]
  safetyIssues: SafetyIssue[]
}

function highlight(title: string, detail: string): EvaluationHighlight {
  return { id: uid('hl'), title, detail }
}

function buildTimeline(attempt: ScenarioAttempt, patient: Patient, unsafe: SafetyIssue[]): TimelineStep[] {
  const steps: TimelineStep[] = []
  const factById = new Map(patient.facts.map((f) => [f.id, f]))

  attempt.actions.forEach((action) => {
    if (action.type === 'question') {
      steps.push({
        id: uid('tl'),
        kind: 'student-ask',
        label: 'Student asked',
        detail: `“${action.content.trim()}”`,
      })
      ;(action.revealed ?? []).forEach((factId) => {
        const fact = factById.get(factId)
        if (!fact) return
        steps.push({
          id: uid('tl'),
          kind: 'patient-reveal',
          label: 'Patient revealed',
          detail: `${fact.label}: ${fact.value}`,
        })
      })
    }
    if (action.type === 'recommendation') {
      steps.push({
        id: uid('tl'),
        kind: 'student-decision',
        label: 'Student recommended',
        detail: `${action.choice}${action.content ? ` — “${action.content.trim()}”` : ''}`,
      })
    }
    if (action.type === 'counseling') {
      steps.push({
        id: uid('tl'),
        kind: 'student-counsel',
        label: 'Student counselled',
        detail: `“${action.content.trim().slice(0, 160)}${action.content.trim().length > 160 ? '…' : ''}”`,
      })
    }
    if (action.type === 'referral') {
      steps.push({
        id: uid('tl'),
        kind: 'student-decision',
        label: 'Student decided on referral',
        detail: `${action.choice}${action.content ? ` — “${action.content.trim()}”` : ''}`,
      })
    }
  })

  unsafe.forEach((issue) => {
    steps.push({
      id: uid('tl'),
      kind: 'system-detect',
      label: 'System detected',
      detail: issue.title,
    })
  })

  return steps
}

function score(attempt: ScenarioAttempt, scenario: Scenario, patient: Patient): ScoreSheet {
  const rule = ruleFor(scenario.id)
  const revealed = patient.facts.filter(
    (f) => attempt.revealedFactIds.includes(f.id) && !f.revealedAtStart,
  )
  const questions = studentQuestions(attempt)
  const questionText = questions.map((q) => q.content).join(' ')
  const counseling = attempt.counseling ?? ''

  const scores: Record<CompetencyKey, number> = {
    historyTaking: 42,
    clinicalReasoning: 44,
    medicationSafety: 44,
    counseling: 40,
    communication: 46,
    referralDecisions: 46,
  }
  const strengths: EvaluationHighlight[] = []
  const missed: EvaluationHighlight[] = []
  const safetyIssues: SafetyIssue[] = []

  // --- Discovery: every uncovered fact credits its competency. -------------
  revealed.forEach((fact) => {
    scores[fact.credits] += fact.safetyCritical ? 13 : 8
    if (fact.section === 'symptoms') scores.historyTaking += 3
  })

  const askedAllergies = revealed.some((f) => f.section === 'allergies')
  const askedMeds = revealed.some((f) => f.section === 'medications')
  const askedHistory = revealed.some((f) => f.section === 'history')
  const askedSeverity = matchesAny(questionText, ['how bad', 'severity', 'scale', 'how severe', 'how painful'])
  const askedDuration = matchesAny(questionText, ['how long', 'when did', 'since when', 'started'])

  if (askedAllergies) {
    scores.medicationSafety += 8
    strengths.push(highlight('Checked for allergies', 'You asked directly about drug allergies before choosing a product.'))
  } else {
    missed.push(
      highlight(
        'You did not ask about allergies',
        'Allergy status changes which agents are available to you. Ask it early — it takes one sentence and it can rule out an entire drug class.',
      ),
    )
    scores.medicationSafety -= 10
  }

  if (askedMeds) {
    scores.medicationSafety += 8
    strengths.push(
      highlight('Asked about current medication', 'You established the current medication list before recommending anything.'),
    )
  } else {
    missed.push(
      highlight(
        'Current medication was never established',
        'Without the medication list you cannot screen for interactions. In this case there was something in it that mattered.',
      ),
    )
    scores.medicationSafety -= 12
  }

  if (askedHistory) {
    scores.historyTaking += 7
  } else {
    missed.push(
      highlight(
        'You could have explored medical history earlier',
        'Past conditions frequently decide whether an over-the-counter option is safe. Asking “any conditions you see a doctor about?” usually surfaces it.',
      ),
    )
  }

  if (askedDuration) scores.historyTaking += 6
  if (askedSeverity) {
    scores.historyTaking += 6
  } else {
    missed.push(
      highlight(
        'You did not assess symptom severity early',
        'Severity shapes both urgency and product choice. A quick 0–10 scale in your first two questions gives you a baseline to counsel against.',
      ),
    )
  }

  // Breadth of questioning, with diminishing returns and a nudge if too thin.
  scores.historyTaking += Math.min(12, questions.length * 2)
  if (questions.length < 4) {
    missed.push(
      highlight(
        'The consultation was short',
        'Four to eight focused questions is typical before committing to a plan. You reached a decision with fewer.',
      ),
    )
    scores.clinicalReasoning -= 6
  }

  const criticalFound = rule.criticalFactIds.filter((id) => attempt.revealedFactIds.includes(id))
  scores.clinicalReasoning += criticalFound.length * 7
  if (rule.criticalFactIds.length > 0 && criticalFound.length === rule.criticalFactIds.length) {
    strengths.push(
      highlight('Identified an important safety concern', 'You uncovered every detail that materially changes management in this case.'),
    )
  }
  // --- Recommendation and reasoning ---------------------------------------
  if (attempt.recommendation) {
    const { choice, reasoning } = attempt.recommendation
    if (rule.preferredRecommendations.includes(choice)) {
      scores.clinicalReasoning += 14
      scores.medicationSafety += 10
      strengths.push(
        highlight('Chose a defensible option', `“${choice}” is an appropriate course of action for this patient.`),
      )
    } else {
      scores.clinicalReasoning -= 8
    }

    if (reasoning.trim().length > 80) {
      scores.clinicalReasoning += 10
      strengths.push(highlight('Explained your reasoning', 'You justified the decision rather than only naming a product.'))
    } else if (reasoning.trim().length > 0) {
      scores.clinicalReasoning += 4
      missed.push(
        highlight(
          'Your reasoning was brief',
          'Spelling out why you excluded the alternatives is what an examiner marks. Name the risk you were avoiding.',
        ),
      )
    }

    rule.unsafeRecommendations.forEach((unsafe) => {
      if (!unsafe.choices.includes(choice)) return
      const factGate = unsafe.requiresFacts ?? []
      const gateOpen = factGate.length === 0 || factGate.some((id) => attempt.revealedFactIds.includes(id))
      if (!gateOpen) return
      safetyIssues.push({ id: uid('si'), severity: 'critical', title: unsafe.title, what: unsafe.what, why: unsafe.why })
      scores.medicationSafety -= 26
      scores.clinicalReasoning -= 10
    })

    // Recommending before uncovering the safety-critical facts is its own error.
    const criticalMissedBeforeDecision = rule.criticalFactIds.filter((id) => !attempt.revealedFactIds.includes(id))
    if (criticalMissedBeforeDecision.length > 0 && safetyIssues.length === 0) {
      const factLabels = patient.facts
        .filter((f) => criticalMissedBeforeDecision.includes(f.id))
        .map((f) => f.label.toLowerCase())
      safetyIssues.push({
        id: uid('si'),
        severity: 'warning',
        title: 'Decision made with incomplete information',
        what: `You committed to a plan without establishing ${factLabels.join(', ')}.`,
        why:
          'A recommendation is only as safe as the history behind it. Uncovering these first would not have changed how long the consultation took, but it would have changed how defensible the decision was.',
      })
      scores.medicationSafety -= 8
    }
  } else {
    missed.push(
      highlight(
        'No recommendation was recorded',
        'Patients need a decision, not only questions. Commit to a course of action and say why.',
      ),
    )
    scores.clinicalReasoning -= 12
  }

  // --- Counseling ----------------------------------------------------------
  if (counseling.trim().length > 0) {
    scores.counseling += 18
    const hits = COUNSELING_MARKERS.filter((m) => matchesAny(counseling, m.keys))
    scores.counseling += hits.length * 7
    if (hits.length >= 3) {
      strengths.push(
        highlight('Counselled thoroughly', `You ${hits.map((h) => h.label).join(', ')} — the patient can act on this.`),
      )
    } else {
      missed.push(
        highlight(
          'Counselling could be more complete',
          'Aim to cover four things every time: what it is, how to take it, the daily maximum, and when to come back.',
        ),
      )
    }
    if (counseling.trim().length > 220) scores.communication += 6
  } else {
    missed.push(
      highlight(
        'The patient left without counselling',
        'Even a referral needs counselling: what you found, what happens next, and what to watch for meanwhile.',
      ),
    )
    scores.counseling -= 14
  }

  // --- Referral ------------------------------------------------------------
  if (attempt.referral) {
    if (rule.expectedReferrals.includes(attempt.referral.choice)) {
      scores.referralDecisions += 22
      strengths.push(
        highlight('Referral decision was appropriate', `“${attempt.referral.choice}” matches the risk you uncovered.`),
      )
    } else {
      scores.referralDecisions -= 14
      missed.push(
        highlight(
          'Referral urgency did not match the findings',
          'Match the level to the risk: emergency for red flags now, urgent for suspected serious pathology, routine for review.',
        ),
      )
    }
    if (attempt.referral.reasoning.trim().length > 40) scores.referralDecisions += 8
  } else {
    scores.referralDecisions -= 6
    missed.push(
      highlight(
        'No explicit referral decision',
        'Deciding that referral is *not* needed is still a decision. State it, so the patient knows where they stand.',
      ),
    )
  }

  // --- Communication -------------------------------------------------------
  const confusedTurns = attempt.messages.filter((m) => m.tone === 'confused').length
  if (confusedTurns > 0) {
    scores.communication -= confusedTurns * 7
    missed.push(
      highlight(
        'Clinical terminology lost the patient',
        `The patient told you ${confusedTurns} time${confusedTurns > 1 ? 's' : ''} that they did not follow a term you used. Swap in everyday words.`,
      ),
    )
  } else {
    scores.communication += 8
  }

  if (matchesAny(questionText + ' ' + counseling, EMPATHY_MARKERS)) {
    scores.communication += 12
    strengths.push(highlight('Communicated clearly and warmly', 'You acknowledged how the patient felt before working through your questions.'))
  } else {
    missed.push(
      highlight(
        'Little explicit empathy',
        'One sentence acknowledging the patient’s concern measurably improves how much of your advice they retain.',
      ),
    )
  }

  if (attempt.notes.trim().length > 40) {
    scores.clinicalReasoning += 5
    strengths.push(highlight('Documented your findings', 'You kept clinical notes during the consultation.'))
  }

  return { scores, strengths, missed, safetyIssues }
}

const WEIGHTS: Record<CompetencyKey, number> = {
  historyTaking: 0.2,
  clinicalReasoning: 0.22,
  medicationSafety: 0.24,
  counseling: 0.16,
  communication: 0.09,
  referralDecisions: 0.09,
}

function headlineFor(total: number, hasCritical: boolean) {
  if (hasCritical) {
    return {
      headline: 'Safety issue identified',
      panda: 'A decision was reached, but the safety issue below would have changed the outcome at a real counter. Review it before repeating the case.',
    }
  }
  if (total >= 85) {
    return {
      headline: 'Strong consultation',
      panda: 'Structured questioning and a well-justified decision. The history covered the findings this case depends on.',
    }
  }
  if (total >= 70) {
    return {
      headline: 'Competent consultation',
      panda: 'Sound clinical reasoning. More depth in the history would raise the score further.',
    }
  }
  if (total >= 55) {
    return {
      headline: 'Adequate, with gaps',
      panda: 'The decision was reasonable but the history was thin. Spend longer at the questioning stage.',
    }
  }
  return {
    headline: 'Significant gaps',
    panda: 'Key findings were not uncovered before a decision was made. Repeat the case and lead with the safety questions.',
  }
}

export function computeEvaluation(
  attempt: ScenarioAttempt,
  scenario: Scenario,
  patient: Patient,
): Evaluation {
  const rule = ruleFor(scenario.id)
  const sheet = score(attempt, scenario, patient)

  const scoreList = (Object.keys(WEIGHTS) as CompetencyKey[]).map((key) => ({
    key,
    label: competencyLabels[key],
    score: Math.round(clamp(sheet.scores[key], 12, 100)),
  }))

  const total = Math.round(
    scoreList.reduce((sum, item) => sum + item.score * WEIGHTS[item.key], 0),
  )

  const hasCritical = sheet.safetyIssues.some((i) => i.severity === 'critical')
  const { headline, panda } = headlineFor(total, hasCritical)

  return {
    id: uid('eval'),
    attemptId: attempt.id,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    totalScore: hasCritical ? Math.min(total, 68) : total,
    headline,
    pandaMessage: panda,
    scores: scoreList,
    strengths: sheet.strengths.slice(0, 6),
    missed: sheet.missed.slice(0, 6),
    safetyIssues: sheet.safetyIssues,
    timeline: buildTimeline(attempt, patient, sheet.safetyIssues),
    betterApproach: rule.betterApproach,
    nextScenarioId: rule.nextScenarioId,
    nextScenarioReason: rule.nextScenarioReason,
    createdAt: new Date().toISOString(),
  }
}

/** Stages shown on the evaluation loading screen. */
export const evaluationStages = [
  'History taking',
  'Clinical reasoning',
  'Medication safety',
  'Communication',
  'Counseling',
  'Referral decision',
]



