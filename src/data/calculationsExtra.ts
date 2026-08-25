import type { CalculationProblem } from '@/types'

/**
 * Additional practice problems.
 *
 * Kept in a second file so the original set stays reviewable on its own.
 * `calculations.ts` concatenates both into `calculationProblems`; nothing else
 * needs to know there are two sources.
 *
 * DRAFT CONTENT — the arithmetic is verified, but the clinical framing should be
 * checked against local practice before students are assessed on it.
 */
export const extraCalculationProblems: CalculationProblem[] = [
  // --- Dose Calculation ----------------------------------------------------
  {
    id: 'calc_dose_susp',
    title: 'Suspension Volume',
    topic: 'Dose Calculation',
    difficulty: 'Beginner',
    prompt:
      'A prescription asks for a liquid antibiotic. Work out the volume for a single dose before labelling the bottle.',
    givens: [
      { label: 'Prescribed', value: '250 mg three times a day' },
      { label: 'Available', value: '125 mg / 5 mL' },
    ],
    question: 'How many mL should be given per dose?',
    unit: 'mL',
    answer: 10,
    tolerance: 0.1,
    explanationIntro: 'Find the strength per millilitre, then divide the dose by it.',
    steps: [
      { title: 'Strength per mL', detail: '125 mg ÷ 5 mL = 25 mg/mL.' },
      { title: 'Volume needed', detail: '250 mg ÷ 25 mg/mL = 10 mL per dose.' },
      { title: 'Sense-check', detail: '250 mg is twice 125 mg, so the volume is twice 5 mL. That agrees.' },
    ],
    pitfall:
      'Dividing by the total 125 mg rather than the 25 mg/mL strength gives 2 mL — a fivefold underdose.',
  },
  {
    id: 'calc_dose_tabs',
    title: 'Tablets Per Dose',
    topic: 'Dose Calculation',
    difficulty: 'Beginner',
    prompt: 'The prescribed dose does not match the tablet strength on the shelf.',
    givens: [
      { label: 'Prescribed', value: '75 microgram once daily' },
      { label: 'Available', value: '25 microgram tablets' },
    ],
    question: 'How many tablets are needed per dose?',
    unit: 'tablets',
    answer: 3,
    tolerance: 0.01,
    explanationIntro: 'Divide the prescribed dose by the strength of a single tablet.',
    steps: [
      { title: 'Divide', detail: '75 microgram ÷ 25 microgram = 3 tablets.' },
      {
        title: 'Sense-check',
        detail: 'Three tablets is a plausible single dose. An answer of 30 would mean the strength was misread.',
      },
    ],
    pitfall:
      'Confusing micrograms with milligrams is a 1000-fold error here. Write the units at every step.',
  },
  {
    id: 'calc_dose_units',
    title: 'Insulin Units to Volume',
    topic: 'Dose Calculation',
    difficulty: 'Intermediate',
    prompt: 'A dose must be drawn from an insulin vial. The volumes are small and the margin for error is not.',
    givens: [
      { label: 'Prescribed', value: '18 units' },
      { label: 'Available', value: '100 units / mL' },
    ],
    question: 'What volume corresponds to the prescribed dose?',
    unit: 'mL',
    answer: 0.18,
    tolerance: 0.005,
    explanationIntro: 'Convert units into volume using the concentration on the vial.',
    steps: [
      { title: 'Volume per unit', detail: '1 mL ÷ 100 units = 0.01 mL per unit.' },
      { title: 'Volume needed', detail: '18 units × 0.01 mL = 0.18 mL.' },
      { title: 'Sense-check', detail: 'Under a fifth of a millilitre, which fits a small insulin dose.' },
    ],
    pitfall:
      'Insulin is measured in an insulin syringe marked in units. Drawing 0.18 mL in a standard syringe invites error.',
  },

  // --- Concentration -------------------------------------------------------
  {
    id: 'calc_conc_ratio',
    title: 'Ratio Strength',
    topic: 'Concentration',
    difficulty: 'Intermediate',
    prompt: 'An injection is labelled as a ratio strength. Convert it into something you can dose with.',
    givens: [
      { label: 'Preparation', value: 'Adrenaline 1 in 1000' },
      { label: 'Available', value: '1 mL ampoule' },
    ],
    question: 'How many mg are contained in 1 mL?',
    unit: 'mg',
    answer: 1,
    tolerance: 0.01,
    explanationIntro: 'A ratio strength of 1 in 1000 means one gram in 1000 millilitres.',
    steps: [
      { title: 'Interpret the ratio', detail: '1 in 1000 means 1 g in 1000 mL.' },
      { title: 'Convert to mg', detail: '1 g = 1000 mg, so 1000 mg in 1000 mL is 1 mg/mL.' },
      { title: 'Answer', detail: 'A 1 mL ampoule therefore contains 1 mg.' },
    ],
    pitfall: 'Reading 1 in 1000 as 1 mg in 1000 mL understates the strength by a factor of 1000.',
  },
  {
    id: 'calc_conc_mgml',
    title: 'Percentage to mg per mL',
    topic: 'Concentration',
    difficulty: 'Beginner',
    prompt: 'An infusion bag is labelled as a percentage. Express it as a strength you can calculate with.',
    givens: [{ label: 'Preparation', value: 'Sodium chloride 0.9% w/v' }],
    question: 'How many mg of sodium chloride are in 1 mL?',
    unit: 'mg',
    answer: 9,
    tolerance: 0.1,
    explanationIntro: 'Percent w/v means grams of solute per 100 mL of solution.',
    steps: [
      { title: 'Interpret the percentage', detail: '0.9% w/v = 0.9 g in 100 mL.' },
      { title: 'Convert to mg', detail: '0.9 g is 900 mg, so 900 mg in 100 mL.' },
      { title: 'Per mL', detail: '900 mg ÷ 100 mL = 9 mg/mL.' },
    ],
    pitfall: 'Treating % w/v as milligrams per 100 mL gives 0.009 mg/mL — out by a factor of 1000.',
  },
  {
    id: 'calc_conc_total',
    title: 'Total Drug in a Bag',
    topic: 'Concentration',
    difficulty: 'Intermediate',
    prompt: 'Before an infusion is signed off, confirm how much drug the bag actually contains.',
    givens: [
      { label: 'Preparation', value: 'Glucose 5% w/v' },
      { label: 'Bag volume', value: '500 mL' },
    ],
    question: 'How many grams of glucose does the bag contain?',
    unit: 'g',
    answer: 25,
    tolerance: 0.1,
    explanationIntro: 'Convert the percentage to grams per 100 mL, then scale to the bag volume.',
    steps: [
      { title: 'Per 100 mL', detail: '5% w/v = 5 g in 100 mL.' },
      { title: 'Scale up', detail: '500 mL is five lots of 100 mL, so 5 g × 5 = 25 g.' },
      { title: 'Sense-check', detail: '25 g in a 500 mL bag of 5% glucose is the familiar figure.' },
    ],
    pitfall: 'Forgetting to scale from 100 mL to the actual bag volume leaves the answer at 5 g.',
  },

  // --- Dilution ------------------------------------------------------------
  {
    id: 'calc_dilution_c1v1',
    title: 'Diluting a Stock Solution',
    topic: 'Dilution',
    difficulty: 'Intermediate',
    prompt: 'A weaker solution is needed than the one held in stock.',
    givens: [
      { label: 'Stock strength', value: '20% w/v' },
      { label: 'Required', value: '250 mL of 5% w/v' },
    ],
    question: 'What volume of stock solution is needed?',
    unit: 'mL',
    answer: 62.5,
    tolerance: 0.5,
    explanationIntro: 'Use C1V1 = C2V2: dilution changes the volume, not the amount of drug.',
    steps: [
      { title: 'Set up', detail: '20% × V1 = 5% × 250 mL.' },
      { title: 'Rearrange', detail: 'V1 = (5 × 250) ÷ 20 = 1250 ÷ 20 = 62.5 mL.' },
      { title: 'Make up', detail: 'Add diluent up to 250 mL in total, not 250 mL of diluent.' },
    ],
    pitfall:
      'Adding 250 mL of diluent to 62.5 mL of stock produces 312.5 mL and the wrong final strength.',
  },
  {
    id: 'calc_dilution_final',
    title: 'Resulting Strength',
    topic: 'Dilution',
    difficulty: 'Beginner',
    prompt: 'A preparation has already been diluted. Check what strength was actually made.',
    givens: [
      { label: 'Stock used', value: '10 mL of 10% w/v' },
      { label: 'Made up to', value: '50 mL' },
    ],
    question: 'What is the final percentage strength?',
    unit: '%',
    answer: 2,
    tolerance: 0.05,
    explanationIntro: 'The amount of drug is unchanged; only the volume it sits in has grown.',
    steps: [
      { title: 'Set up', detail: '10% × 10 mL = C2 × 50 mL.' },
      { title: 'Rearrange', detail: 'C2 = 100 ÷ 50 = 2% w/v.' },
      { title: 'Sense-check', detail: 'A fivefold dilution should take 10% down to 2%. That agrees.' },
    ],
    pitfall: 'Dividing by the 40 mL of diluent instead of the 50 mL final volume gives 2.5%.',
  },
  {
    id: 'calc_dilution_diluent',
    title: 'How Much Diluent',
    topic: 'Dilution',
    difficulty: 'Advanced',
    prompt: 'Read the question carefully: it asks for the diluent, not the final volume.',
    givens: [
      { label: 'Stock', value: '50 mL of 40% w/v' },
      { label: 'Required strength', value: '10% w/v' },
    ],
    question: 'What volume of diluent must be added?',
    unit: 'mL',
    answer: 150,
    tolerance: 1,
    explanationIntro: 'Find the final volume first, then subtract the stock you started with.',
    steps: [
      { title: 'Final volume', detail: '40% × 50 mL = 10% × V2, so V2 = 2000 ÷ 10 = 200 mL.' },
      { title: 'Diluent', detail: '200 mL total − 50 mL of stock = 150 mL of diluent.' },
      { title: 'Sense-check', detail: 'Going from 40% to 10% is a fourfold dilution, so the volume quadruples.' },
    ],
    pitfall: 'Answering 200 mL gives the final volume, which is not what was asked.',
  },

  // --- Infusion Rate -------------------------------------------------------
  {
    id: 'calc_infusion_mlh',
    title: 'Setting the Pump Rate',
    topic: 'Infusion Rate',
    difficulty: 'Beginner',
    prompt: 'An infusion must run over a set period. Set the pump correctly.',
    givens: [
      { label: 'Volume', value: '1000 mL' },
      { label: 'Duration', value: '8 hours' },
    ],
    question: 'What rate should the pump be set to?',
    unit: 'mL/h',
    answer: 125,
    tolerance: 0.5,
    explanationIntro: 'Rate is volume divided by time.',
    steps: [
      { title: 'Divide', detail: '1000 mL ÷ 8 hours = 125 mL/h.' },
      { title: 'Sense-check', detail: '125 mL/h for 8 hours delivers 1000 mL. That agrees.' },
    ],
    pitfall: 'Converting the hours to minutes first gives a per-minute rate, not the mL/h the pump expects.',
  },
  {
    id: 'calc_infusion_drops',
    title: 'Drops Per Minute',
    topic: 'Infusion Rate',
    difficulty: 'Advanced',
    prompt: 'No pump is available, so the infusion runs by gravity through a giving set.',
    givens: [
      { label: 'Volume', value: '500 mL' },
      { label: 'Duration', value: '4 hours' },
      { label: 'Giving set', value: '20 drops / mL' },
    ],
    question: 'How many drops per minute should be counted?',
    unit: 'drops/min',
    answer: 41.7,
    tolerance: 1,
    explanationIntro: 'Convert the volume into drops, then spread those drops across the time in minutes.',
    steps: [
      { title: 'Total drops', detail: '500 mL × 20 drops/mL = 10 000 drops.' },
      { title: 'Total minutes', detail: '4 hours × 60 = 240 minutes.' },
      { title: 'Rate', detail: '10 000 ÷ 240 = 41.7, counted in practice as about 42 drops per minute.' },
    ],
    pitfall: 'Forgetting to convert hours into minutes gives 2500 drops per minute, which is impossible.',
  },
  {
    id: 'calc_infusion_time',
    title: 'Time to Completion',
    topic: 'Infusion Rate',
    difficulty: 'Intermediate',
    prompt: 'A patient asks when their infusion will finish.',
    givens: [
      { label: 'Volume remaining', value: '750 mL' },
      { label: 'Pump rate', value: '150 mL/h' },
    ],
    question: 'How many hours until the infusion finishes?',
    unit: 'hours',
    answer: 5,
    tolerance: 0.1,
    explanationIntro: 'Divide the volume still to run by the rate it is running at.',
    steps: [
      { title: 'Divide', detail: '750 mL ÷ 150 mL/h = 5 hours.' },
      { title: 'Sense-check', detail: '150 mL/h for 5 hours is 750 mL. That agrees.' },
    ],
    pitfall: 'Using the original bag volume instead of the volume remaining overestimates the time left.',
  },

  // --- Weight-Based Dosing -------------------------------------------------
  {
    id: 'calc_weight_max',
    title: 'Checking the Daily Maximum',
    topic: 'Weight-Based Dosing',
    difficulty: 'Intermediate',
    prompt: 'A weight-based dose has been prescribed. Confirm the daily total sits within the stated maximum.',
    givens: [
      { label: 'Patient', value: '32 kg' },
      { label: 'Prescribed', value: '15 mg/kg four times a day' },
      { label: 'Stated maximum', value: '2 g in 24 hours' },
    ],
    question: 'What is the total dose in 24 hours, in mg?',
    unit: 'mg',
    answer: 1920,
    tolerance: 1,
    explanationIntro: 'Work out a single dose, then multiply by the number of doses in a day.',
    steps: [
      { title: 'Single dose', detail: '15 mg/kg × 32 kg = 480 mg.' },
      { title: 'Daily total', detail: '480 mg × 4 doses = 1920 mg.' },
      { title: 'Compare', detail: '1920 mg is below the 2000 mg maximum, so the prescription is within limits.' },
    ],
    pitfall:
      'Treating 15 mg/kg as the daily total rather than the per-dose figure underestimates the exposure fourfold.',
  },
  {
    id: 'calc_weight_bsa',
    title: 'Dose by Body Surface Area',
    topic: 'Weight-Based Dosing',
    difficulty: 'Advanced',
    prompt: 'Some agents are dosed by body surface area rather than by weight.',
    givens: [
      { label: 'Body surface area', value: '1.7 m²' },
      { label: 'Prescribed', value: '80 mg/m² once daily' },
    ],
    question: 'What is the dose in mg?',
    unit: 'mg',
    answer: 136,
    tolerance: 1,
    explanationIntro: 'Multiply the dose per square metre by the patient’s surface area.',
    steps: [
      { title: 'Multiply', detail: '80 mg/m² × 1.7 m² = 136 mg.' },
      { title: 'Sense-check', detail: 'A surface area around 1.7 m² is typical for an adult, so the result is plausible.' },
    ],
    pitfall: 'Substituting body weight for surface area produces a very different, and unsafe, dose.',
  },
  {
    id: 'calc_weight_paed_daily',
    title: 'Splitting a Daily Dose',
    topic: 'Weight-Based Dosing',
    difficulty: 'Intermediate',
    prompt: 'A total daily dose has been prescribed and must be divided across the day.',
    givens: [
      { label: 'Patient', value: '14 kg' },
      { label: 'Prescribed', value: '30 mg/kg/day in 3 divided doses' },
      { label: 'Available', value: '100 mg / 5 mL' },
    ],
    question: 'How many mL should be given per dose?',
    unit: 'mL',
    answer: 7,
    tolerance: 0.1,
    explanationIntro: 'Daily dose first, then divide into doses, then convert to a volume.',
    steps: [
      { title: 'Daily dose', detail: '30 mg/kg × 14 kg = 420 mg per day.' },
      { title: 'Per dose', detail: '420 mg ÷ 3 doses = 140 mg.' },
      { title: 'Convert to volume', detail: '100 mg per 5 mL is 20 mg/mL, so 140 mg ÷ 20 mg/mL = 7 mL.' },
    ],
    pitfall: 'Converting to a volume before dividing by three gives 21 mL — a threefold overdose.',
  },

  // --- Quantity to Dispense ------------------------------------------------
  {
    id: 'calc_quantity_days',
    title: 'Days of Supply',
    topic: 'Quantity to Dispense',
    difficulty: 'Beginner',
    prompt: 'A patient asks how long their current pack will last.',
    givens: [
      { label: 'Pack size', value: '56 tablets' },
      { label: 'Directions', value: 'Two tablets twice a day' },
    ],
    question: 'How many days will the pack last?',
    unit: 'days',
    answer: 14,
    tolerance: 0.1,
    explanationIntro: 'Work out the daily consumption, then divide the pack size by it.',
    steps: [
      { title: 'Per day', detail: '2 tablets × 2 times daily = 4 tablets per day.' },
      { title: 'Divide', detail: '56 tablets ÷ 4 per day = 14 days.' },
    ],
    pitfall: 'Using two tablets per day instead of four doubles the estimate to 28 days.',
  },
  {
    id: 'calc_quantity_liquid',
    title: 'Volume to Supply',
    topic: 'Quantity to Dispense',
    difficulty: 'Intermediate',
    prompt: 'Work out the volume needed to complete a full course.',
    givens: [
      { label: 'Dose', value: '7.5 mL three times a day' },
      { label: 'Course length', value: '7 days' },
    ],
    question: 'What total volume is required for the course?',
    unit: 'mL',
    answer: 157.5,
    tolerance: 0.5,
    explanationIntro: 'Daily volume first, then multiply by the number of days.',
    steps: [
      { title: 'Per day', detail: '7.5 mL × 3 doses = 22.5 mL per day.' },
      { title: 'Whole course', detail: '22.5 mL × 7 days = 157.5 mL.' },
      { title: 'In practice', detail: 'A 200 mL bottle would be supplied; part-bottles are not dispensed.' },
    ],
    pitfall: 'Calculating 157.5 mL and stopping there ignores that stock comes in fixed pack sizes.',
  },
  {
    id: 'calc_quantity_inhaler',
    title: 'How Long an Inhaler Lasts',
    topic: 'Quantity to Dispense',
    difficulty: 'Intermediate',
    prompt: 'A patient wants to know when to reorder their preventer inhaler.',
    givens: [
      { label: 'Inhaler', value: '200 actuations' },
      { label: 'Directions', value: 'Two puffs twice a day' },
    ],
    question: 'How many days will one inhaler last?',
    unit: 'days',
    answer: 50,
    tolerance: 0.5,
    explanationIntro: 'Count the actuations used each day, then divide.',
    steps: [
      { title: 'Per day', detail: '2 puffs × 2 times daily = 4 actuations per day.' },
      { title: 'Divide', detail: '200 actuations ÷ 4 per day = 50 days.' },
      { title: 'Counsel', detail: 'Reordering at around six weeks avoids running out mid-course.' },
    ],
    pitfall:
      'This applies to regular preventer use. A reliever is taken as needed, so its lifespan cannot be calculated this way.',
  },
]
