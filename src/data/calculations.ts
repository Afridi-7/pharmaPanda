import type { CalculationProblem, CalculationTopic } from '@/types'

export const calculationTopics: {
  topic: CalculationTopic
  blurb: string
  problemCount: number
  skills: string[]
}[] = [
  { topic: 'Dose Calculation', blurb: 'Convert a prescribed dose into what you actually hand over.', problemCount: 2, skills: ['Unit conversion', 'Strength'] },
  { topic: 'Concentration', blurb: 'Percentages, ratios and mg/mL — without losing a decimal place.', problemCount: 1, skills: ['% w/v', 'Ratio strength'] },
  { topic: 'Dilution', blurb: 'Make a weaker preparation from a stronger one, accurately.', problemCount: 1, skills: ['C1V1 = C2V2'] },
  { topic: 'Infusion Rate', blurb: 'Millilitres per hour, drops per minute, and time to completion.', problemCount: 1, skills: ['mL/h', 'Rate'] },
  { topic: 'Weight-Based Dosing', blurb: 'Paediatric and weight-banded dosing where accuracy is safety.', problemCount: 2, skills: ['mg/kg', 'Max dose'] },
  { topic: 'Quantity to Dispense', blurb: 'Work out days of supply and the pack you should reach for.', problemCount: 1, skills: ['Days supply', 'Pack size'] },
]

export const calculationProblems: CalculationProblem[] = [
  {
    id: 'calc_paed_amox',
    title: 'Pediatric Dose Challenge',
    topic: 'Weight-Based Dosing',
    difficulty: 'Beginner',
    prompt:
      'A prescription arrives for a child with acute otitis media. Work out the volume for a single dose before you label the bottle.',
    givens: [
      { label: 'Patient', value: '18 kg' },
      { label: 'Medication', value: 'Amoxicillin' },
      { label: 'Dose', value: '40 mg/kg/day' },
      { label: 'Frequency', value: '2 doses/day' },
      { label: 'Available', value: '400 mg / 5 mL' },
    ],
    question: 'How many mL should be administered per dose?',
    unit: 'mL',
    answer: 4.5,
    tolerance: 0.05,
    explanationIntro: 'Total daily dose first, then split it, then convert milligrams into millilitres.',
    steps: [
      { title: 'Total daily dose', detail: '40 mg/kg/day × 18 kg = 720 mg per day.' },
      { title: 'Dose per administration', detail: '720 mg ÷ 2 doses = 360 mg per dose.' },
      { title: 'Convert to volume', detail: 'The suspension is 400 mg per 5 mL, i.e. 80 mg/mL. 360 mg ÷ 80 mg/mL = 4.5 mL.' },
      { title: 'Sense-check', detail: '4.5 mL is a plausible single volume for an 18 kg child and measurable with a 5 mL oral syringe.' },
    ],
    pitfall: 'The most common slip is treating 40 mg/kg as the *per dose* figure, which doubles the daily exposure.',
  },
  {
    id: 'calc_paed_para',
    title: 'Paracetamol for a Feverish Child',
    topic: 'Weight-Based Dosing',
    difficulty: 'Beginner',
    prompt: 'A father needs an accurate volume for his daughter, and an oral syringe rather than a kitchen spoon.',
    givens: [
      { label: 'Patient', value: '14 kg, 3 years' },
      { label: 'Medication', value: 'Paracetamol suspension' },
      { label: 'Dose', value: '15 mg/kg per dose' },
      { label: 'Available', value: '120 mg / 5 mL' },
    ],
    question: 'What volume should be given per dose?',
    unit: 'mL',
    answer: 8.75,
    tolerance: 0.15,
    explanationIntro: 'Dose in milligrams, then convert using the concentration of the suspension.',
    steps: [
      { title: 'Dose in mg', detail: '15 mg/kg × 14 kg = 210 mg per dose.' },
      { title: 'Concentration', detail: '120 mg per 5 mL = 24 mg/mL.' },
      { title: 'Volume', detail: '210 mg ÷ 24 mg/mL = 8.75 mL.' },
      { title: 'Practical rounding', detail: 'In practice you would supply 8.75 mL measured with an oral syringe, and state the maximum of four doses in 24 hours.' },
    ],
    pitfall: 'Using the 250 mg/5 mL strength by mistake gives 4.2 mL — under half the intended dose.',
  },
  {
    id: 'calc_dose_conv',
    title: 'Grams to Tablets',
    topic: 'Dose Calculation',
    difficulty: 'Beginner',
    prompt: 'A prescriber has written the dose in grams. Convert it into the tablets you will actually count.',
    givens: [
      { label: 'Prescribed dose', value: '1.5 g twice daily' },
      { label: 'Available', value: '500 mg tablets' },
    ],
    question: 'How many tablets are needed per dose?',
    unit: 'tablets',
    answer: 3,
    tolerance: 0,
    explanationIntro: 'Convert to a common unit before dividing.',
    steps: [
      { title: 'Convert', detail: '1.5 g = 1500 mg.' },
      { title: 'Divide', detail: '1500 mg ÷ 500 mg per tablet = 3 tablets per dose.' },
      { title: 'Daily total', detail: '3 tablets twice daily = 6 tablets per day, useful for the quantity to dispense.' },
    ],
    pitfall: 'Mixing grams and milligrams is the single most frequent dispensing arithmetic error.',
  },
  {
    id: 'calc_dose_mg',
    title: 'Injection Volume',
    topic: 'Dose Calculation',
    difficulty: 'Intermediate',
    prompt: 'Draw up a prescribed dose from a labelled vial.',
    givens: [
      { label: 'Prescribed dose', value: '80 mg' },
      { label: 'Vial', value: '250 mg / 10 mL' },
    ],
    question: 'What volume must be drawn up?',
    unit: 'mL',
    answer: 3.2,
    tolerance: 0.05,
    explanationIntro: 'Find the concentration per millilitre, then scale to the dose you need.',
    steps: [
      { title: 'Concentration', detail: '250 mg ÷ 10 mL = 25 mg/mL.' },
      { title: 'Volume required', detail: '80 mg ÷ 25 mg/mL = 3.2 mL.' },
      { title: 'Check', detail: '3.2 mL is under a third of the vial, consistent with 80 mg of 250 mg.' },
    ],
    pitfall: 'Inverting the ratio (25 ÷ 80) gives 0.31 mL — a tenfold class of error worth training yourself out of.',
  },
  {
    id: 'calc_conc_pct',
    title: 'Percentage to Milligrams',
    topic: 'Concentration',
    difficulty: 'Beginner',
    prompt: 'A patient asks how much active drug is in the bottle you have just handed over.',
    givens: [
      { label: 'Preparation', value: '0.9% w/v sodium chloride' },
      { label: 'Volume', value: '500 mL' },
    ],
    question: 'How many grams of sodium chloride does the bag contain?',
    unit: 'g',
    answer: 4.5,
    tolerance: 0.05,
    explanationIntro: '% w/v means grams of solute per 100 mL of solution.',
    steps: [
      { title: 'Interpret the percentage', detail: '0.9% w/v = 0.9 g per 100 mL.' },
      { title: 'Scale to the volume', detail: '500 mL ÷ 100 mL = 5. 0.9 g × 5 = 4.5 g.' },
      { title: 'Express in mg if needed', detail: '4.5 g = 4500 mg = 9 mg/mL.' },
    ],
    pitfall: 'Reading % w/v as “per litre” underestimates the content tenfold.',
  },
  {
    id: 'calc_dilution',
    title: 'Diluting a Stock Solution',
    topic: 'Dilution',
    difficulty: 'Intermediate',
    prompt: 'You need a weaker solution for a wound-cleaning preparation and have only concentrated stock.',
    givens: [
      { label: 'Stock', value: '5% w/v solution' },
      { label: 'Required', value: '0.5% w/v' },
      { label: 'Final volume', value: '200 mL' },
    ],
    question: 'What volume of stock solution is required?',
    unit: 'mL',
    answer: 20,
    tolerance: 0.5,
    explanationIntro: 'Use C₁V₁ = C₂V₂ and then make up to the final volume.',
    steps: [
      { title: 'Set up the equation', detail: '5% × V₁ = 0.5% × 200 mL.' },
      { title: 'Solve', detail: 'V₁ = (0.5 × 200) ÷ 5 = 20 mL of stock.' },
      { title: 'Make up', detail: 'Add diluent to 20 mL of stock up to a final volume of 200 mL — not 200 mL *of* diluent.' },
    ],
    pitfall: 'Adding 200 mL of diluent to 20 mL of stock gives 220 mL and the wrong final strength.',
  },
  {
    id: 'calc_infusion',
    title: 'Infusion Rate',
    topic: 'Infusion Rate',
    difficulty: 'Intermediate',
    prompt: 'Set the pump rate for a bag that must run over a fixed period.',
    givens: [
      { label: 'Bag volume', value: '1000 mL' },
      { label: 'Duration', value: '8 hours' },
    ],
    question: 'What rate should the pump be set to, in mL/hour?',
    unit: 'mL/h',
    answer: 125,
    tolerance: 1,
    explanationIntro: 'Rate is simply volume divided by time — keep the units explicit.',
    steps: [
      { title: 'Divide', detail: '1000 mL ÷ 8 h = 125 mL/h.' },
      { title: 'Cross-check', detail: '125 mL/h × 8 h = 1000 mL. Consistent.' },
      { title: 'If using a giving set', detail: 'At 20 drops/mL: 125 mL/h × 20 ÷ 60 ≈ 42 drops per minute.' },
    ],
    pitfall: 'Confusing mL/h with drops/min sets the rate three times too low on a 20 drops/mL set.',
  },
  {
    id: 'calc_quantity',
    title: 'Quantity to Dispense',
    topic: 'Quantity to Dispense',
    difficulty: 'Beginner',
    prompt: 'Decide how much to supply against a prescription written for a fixed course length.',
    givens: [
      { label: 'Prescription', value: 'Amoxicillin 250 mg capsules, one three times daily' },
      { label: 'Course', value: '7 days' },
      { label: 'Pack sizes', value: '15 or 21 capsules' },
    ],
    question: 'How many capsules should be dispensed?',
    unit: 'capsules',
    answer: 21,
    tolerance: 0,
    explanationIntro: 'Doses per day × days, then map onto a whole pack where possible.',
    steps: [
      { title: 'Daily quantity', detail: '1 capsule × 3 times daily = 3 capsules per day.' },
      { title: 'Course quantity', detail: '3 × 7 days = 21 capsules.' },
      { title: 'Pack selection', detail: 'A 21-capsule pack matches exactly — no splitting required, and the course finishes as intended.' },
    ],
    pitfall: 'Supplying 15 leaves the course two days short, a classic driver of antibiotic non-completion.',
  },
]

export function problemsForTopic(topic: CalculationTopic) {
  return calculationProblems.filter((p) => p.topic === topic)
}

export function getProblem(id: string) {
  return calculationProblems.find((p) => p.id === id)
}
