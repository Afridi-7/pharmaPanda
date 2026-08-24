import type { Scenario } from '@/types'

/**
 * Simulation catalogue. `mission` is what the student is allowed to read before
 * entering — deliberately free of hidden clinical detail.
 */
export const scenarios: Scenario[] = [
  {
    id: 'sc_headache',
    title: 'The Headache That Isn’t Simple',
    tagline: 'A routine request that deserves a careful conversation.',
    description:
      'A 20-year-old walks in asking for something for a headache. Straightforward on the surface — but the right answer depends entirely on what you think to ask.',
    mission:
      'A 20-year-old patient enters the pharmacy asking for something for a headache.\n\nYour job is to determine whether self-care is appropriate.\n\nThe patient will not tell you everything automatically.\n\nAsk the right questions.',
    category: 'Pain',
    setting: 'Community Pharmacy',
    difficulty: 'Intermediate',
    durationMinutes: [8, 10],
    skills: ['History Taking', 'Red Flag Detection', 'Medication Safety'],
    objectives: [
      'Take a structured headache history, including onset, severity and character.',
      'Screen actively for neurological and systemic red flags.',
      'Uncover allergy, medication and relevant past medical history before recommending.',
      'Choose an analgesic that is safe for this specific patient.',
      'Counsel on dose, maximum daily dose and when to seek further help.',
    ],
    status: 'not-started',
    patientId: 'pat_sarah',
  },
  {
    id: 'sc_cough',
    title: 'The Persistent Cough',
    tagline: 'Five weeks of coughing, and a request for “something strong”.',
    description:
      'A 58-year-old wants a stronger cough medicine. Deciding whether that is the right response means separating a self-limiting cough from one that needs investigation.',
    mission:
      'A 58-year-old patient asks for a stronger cough medicine.\n\nDecide whether an over-the-counter product is appropriate, or whether this cough needs someone else to see it.\n\nThe details that matter will not be offered unprompted.',
    category: 'Cough & Cold',
    setting: 'Community Pharmacy',
    difficulty: 'Advanced',
    durationMinutes: [10, 12],
    skills: ['Red Flag Detection', 'Clinical Reasoning', 'Referral Decisions'],
    objectives: [
      'Establish cough duration, character and associated symptoms.',
      'Screen for weight loss, haemoptysis, night sweats and smoking history.',
      'Consider medication-induced cough as a differential.',
      'Reach a clear, justified referral decision and communicate its urgency.',
    ],
    status: 'not-started',
    patientId: 'pat_thomas',
  },
  {
    id: 'sc_heartburn',
    title: 'Heartburn After Dinner',
    tagline: 'Antacids are not working. Find out why.',
    description:
      'Three months of evening reflux in a 41-year-old. The cause may already be in her medicine cabinet.',
    mission:
      'A 41-year-old patient describes burning chest discomfort most evenings.\n\nWork out what is driving it, whether alarm features are present, and what should happen next.',
    category: 'Gastrointestinal',
    setting: 'Community Pharmacy',
    difficulty: 'Intermediate',
    durationMinutes: [8, 10],
    skills: ['History Taking', 'Medication Safety', 'Counseling'],
    objectives: [
      'Characterise the reflux symptoms and their pattern.',
      'Screen for alarm features requiring referral.',
      'Identify the NSAID as a likely contributing cause.',
      'Give lifestyle and treatment advice the patient can actually follow.',
    ],
    status: 'not-started',
    patientId: 'pat_amina',
  },
  {
    id: 'sc_allergy',
    title: 'Seasonal Allergy Trouble',
    tagline: 'The strongest option is not always the right one.',
    description:
      'A 27-year-old with hay fever wants the strongest antihistamine available. His job — and his chest — should change your answer.',
    mission:
      'A 27-year-old patient asks for the strongest hay fever treatment you have.\n\nEstablish what he actually needs, what he must avoid, and whether anything else deserves attention today.',
    category: 'Allergy',
    setting: 'Community Pharmacy',
    difficulty: 'Beginner',
    durationMinutes: [6, 8],
    skills: ['History Taking', 'Medication Safety', 'Counseling'],
    objectives: [
      'Confirm the pattern and severity of allergic rhinitis.',
      'Identify occupational reasons to avoid sedating antihistamines.',
      'Recognise poorly controlled asthma hiding behind hay fever symptoms.',
      'Recommend a non-sedating option with clear counselling.',
    ],
    status: 'not-started',
    patientId: 'pat_george',
  },
  {
    id: 'sc_rash',
    title: 'The Itchy Rash',
    tagline: 'Two weeks of itching, and a new hospital placement.',
    description:
      'A 23-year-old student asks for a cream. Distinguishing eczema from infection — and finding the trigger — is the real task.',
    mission:
      'A 23-year-old patient asks whether you have a cream for an itchy rash.\n\nAssess the rash, exclude infection, find the trigger, and decide what is appropriate to supply.',
    category: 'Dermatology',
    setting: 'Community Pharmacy',
    difficulty: 'Beginner',
    durationMinutes: [6, 8],
    skills: ['History Taking', 'Clinical Reasoning', 'Counseling'],
    objectives: [
      'Describe the rash: site, appearance, distribution and duration.',
      'Exclude signs of secondary bacterial infection.',
      'Identify the occupational trigger and advise on avoidance.',
      'Counsel on emollient and topical steroid use, including quantity and duration.',
    ],
    status: 'not-started',
    patientId: 'pat_lena',
  },
  {
    id: 'sc_fever_child',
    title: 'A Parent With a Feverish Child',
    tagline: 'A worried father, a kitchen teaspoon, and a dose you must get right.',
    description:
      'A three-year-old has had a fever since last night. You need red flags, an accurate weight-based dose, and a parent who leaves knowing exactly what to do.',
    mission:
      'A father asks what he can give his three-year-old daughter for a fever.\n\nScreen for red flags, establish what has already been given, and make sure the dose leaving this pharmacy is correct and clearly explained.',
    category: 'Calculations',
    setting: 'Community Pharmacy',
    difficulty: 'Intermediate',
    durationMinutes: [8, 10],
    skills: ['Red Flag Detection', 'Weight-Based Dosing', 'Counseling'],
    objectives: [
      'Screen systematically for paediatric red flags.',
      'Establish the child’s weight and what has already been administered.',
      'Calculate a correct weight-based paracetamol dose.',
      'Provide safety netting: what to watch for and when to seek urgent help.',
    ],
    status: 'not-started',
    patientId: 'pat_mateo',
  },
  {
    id: 'sc_missed_meds',
    title: 'The Patient Who Forgot Their Medication',
    tagline: 'A week away, three medicines missed.',
    description:
      'A 71-year-old returns from a trip having missed a week of medication. Which omissions matter most, and what should happen today?',
    mission:
      'A 71-year-old patient tells you she has not taken her tablets for a week.\n\nFind out what was missed, assess the consequences, and agree a safe plan for today.',
    category: 'Medication Counseling',
    setting: 'Community Pharmacy',
    difficulty: 'Intermediate',
    durationMinutes: [8, 10],
    skills: ['Medication Safety', 'Clinical Reasoning', 'Referral Decisions'],
    objectives: [
      'Establish exactly which medicines were missed and for how long.',
      'Assess for symptoms and signs of consequence, including hyperglycaemia.',
      'Advise correctly on restarting — without dose doubling.',
      'Decide whether the prescriber needs to be involved, and how urgently.',
    ],
    status: 'not-started',
    patientId: 'pat_ruth',
  },
  {
    id: 'sc_inhaler',
    title: 'The Difficult Inhaler',
    tagline: 'The inhaler is not failing. The technique is.',
    description:
      'A 19-year-old wants a stronger preventer inhaler. This case is won or lost on how well you can teach.',
    mission:
      'A 19-year-old patient says her preventer inhaler does not work and asks for something stronger.\n\nAssess her control, her technique and her understanding — then teach in a way she will remember tomorrow.',
    category: 'Medication Counseling',
    setting: 'Community Pharmacy',
    difficulty: 'Intermediate',
    durationMinutes: [10, 12],
    skills: ['Counseling', 'Communication', 'Medication Safety'],
    objectives: [
      'Assess asthma control using symptom and reliever-use questions.',
      'Elicit and correct inhaler technique step by step.',
      'Explain the difference between preventer and reliever in plain language.',
      'Check understanding with teach-back, and arrange appropriate follow-up.',
    ],
    status: 'not-started',
    patientId: 'pat_nadia',
  },
  {
    id: 'sc_interaction',
    title: 'The Unexpected Drug Interaction',
    tagline: '“Natural” is not the same as safe.',
    description:
      'A 64-year-old wants St John’s wort. His current medicines make that request a genuine safety event.',
    mission:
      'A 64-year-old patient asks to buy St John’s wort.\n\nEstablish what else he takes, judge the risk, and handle the refusal — if you decide on one — without losing his trust.',
    category: 'Drug Interactions',
    setting: 'Community Pharmacy',
    difficulty: 'Advanced',
    durationMinutes: [10, 12],
    skills: ['Medication Safety', 'Clinical Reasoning', 'Communication'],
    objectives: [
      'Take a complete medication history, including supplements and herbals.',
      'Identify the interactions with warfarin and sertraline and explain the mechanism.',
      'Assess mood safely, including risk screening.',
      'Redirect to the prescriber while maintaining rapport.',
    ],
    status: 'not-started',
    patientId: 'pat_derek',
  },
  {
    id: 'sc_wound',
    title: 'The Minor Wound',
    tagline: 'Decide what you can dress — and what you cannot.',
    description:
      'A 29-year-old has cut her palm on a rusty garden fork. Wound assessment, tetanus status and referral thresholds all matter here.',
    mission:
      'A 29-year-old patient asks you to dress a cut on her palm.\n\nAssess the wound properly, consider contamination and immunisation, and decide whether this belongs in your pharmacy or elsewhere.',
    category: 'Minor Injuries',
    setting: 'Community Pharmacy',
    difficulty: 'Beginner',
    durationMinutes: [6, 8],
    skills: ['Clinical Reasoning', 'Referral Decisions', 'Counseling'],
    objectives: [
      'Assess wound size, depth, contamination and neurovascular status.',
      'Establish tetanus immunisation status.',
      'Recognise wounds requiring closure or medical review.',
      'Advise on dressing choice, taking adhesive sensitivity into account.',
    ],
    status: 'not-started',
    patientId: 'pat_priya',
  },
]

export function getScenario(id: string) {
  return scenarios.find((s) => s.id === id)
}

export const scenarioCategories = [
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
