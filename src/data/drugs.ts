import type { Drug } from '@/types'
import { extraDrugs } from './drugsExtra'

/**
 * Curated drug entries.
 *
 * Scoped to the agents the consultation cases turn on, so a student who meets a
 * drug in a case can look it up here. This is a study aid, not a formulary. In
 * production these fields would be populated by a curated knowledge service
 * (`GET /drugs/:id`), with provenance shown in `sourceNote`.
 */
const baseDrugs: Drug[] = [
  {
    id: 'drug_paracetamol',
    name: 'Paracetamol',
    genericFor: 'Acetaminophen',
    drugClass: 'Non-opioid analgesic / antipyretic',
    summary:
      'First-line analgesic and antipyretic for mild to moderate pain and fever, with a favourable interaction profile that makes it the default choice in many higher-risk patients.',
    commonUses: ['Mild to moderate pain', 'Fever', 'Headache', 'Musculoskeletal pain', 'Paediatric fever'],
    adverseEffects: [
      'Generally well tolerated at licensed doses',
      'Rash (uncommon)',
      'Hepatotoxicity in overdose or with chronic excess',
      'Thrombocytopenia (rare)',
    ],
    counselingPoints: [
      'Adults: 500 mg–1 g every 4–6 hours, maximum 4 g in 24 hours.',
      'Count every source — many cold and flu products already contain paracetamol.',
      'Paediatric doses are weight-based; use an oral syringe, never a kitchen spoon.',
      'If pain persists beyond three days, come back rather than increasing the dose.',
    ],
    safetyConsiderations: [
      'Reduce the maximum daily dose in adults under 50 kg, chronic malnutrition or alcohol dependence.',
      'Overdose can be asymptomatic initially yet still cause severe liver injury — always treat as urgent.',
      'Preferred over NSAIDs in anticoagulation, peptic ulcer history and asthma sensitive to NSAIDs.',
    ],
    interactionsToWatch: [
      'Warfarin — regular high-dose use may modestly raise INR; monitor if used continuously.',
      'Carbamazepine, phenytoin, rifampicin — enzyme induction increases hepatotoxic risk in overdose.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_ibuprofen',
    name: 'Ibuprofen',
    drugClass: 'Non-steroidal anti-inflammatory drug (NSAID), propionic acid derivative',
    summary:
      'Effective anti-inflammatory analgesic whose gastrointestinal, renal, cardiovascular and bleeding risks make patient selection the critical step.',
    commonUses: ['Inflammatory pain', 'Dysmenorrhoea', 'Musculoskeletal injury', 'Fever', 'Dental pain'],
    adverseEffects: [
      'Dyspepsia and abdominal pain',
      'Gastrointestinal ulceration and bleeding',
      'Fluid retention, raised blood pressure',
      'Reduced renal function',
      'Bronchospasm in NSAID-sensitive asthma',
    ],
    counselingPoints: [
      'Take with or just after food, at the lowest effective dose for the shortest time.',
      'OTC adult dosing is typically 200–400 mg every 4–6 hours, maximum 1.2 g in 24 hours without medical advice.',
      'Stop and seek advice if you notice black stools, vomit resembling coffee grounds, or new indigestion.',
      'Do not combine with another oral NSAID, including aspirin taken for pain.',
    ],
    safetyConsiderations: [
      'Avoid in active or previous peptic ulceration unless specifically directed with gastroprotection.',
      'Avoid with anticoagulants where possible — the bleeding risk is additive.',
      'Caution in heart failure, chronic kidney disease, dehydration and the elderly.',
      'Cross-reactivity means an aspirin allergy generally rules out NSAIDs.',
    ],
    interactionsToWatch: [
      'Warfarin and DOACs — increased bleeding risk.',
      'ACE inhibitors/ARBs + diuretics — the "triple whammy" risk of acute kidney injury.',
      'SSRIs — additive gastrointestinal bleeding risk.',
      'Methotrexate and lithium — reduced clearance.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_warfarin',
    name: 'Warfarin',
    drugClass: 'Vitamin K antagonist anticoagulant',
    summary:
      'Narrow therapeutic index anticoagulant requiring INR monitoring, with one of the longest interaction lists in practice — including several over-the-counter and herbal products.',
    commonUses: ['Atrial fibrillation', 'Venous thromboembolism', 'Mechanical heart valves'],
    adverseEffects: ['Bruising', 'Bleeding, including major haemorrhage', 'Rash', 'Alopecia', 'Calciphylaxis (rare)'],
    counselingPoints: [
      'Take at the same time each day, usually early evening, and never double up on a missed dose.',
      'Keep vitamin K intake consistent rather than avoiding green vegetables entirely.',
      'Carry the anticoagulant alert card and show it before any procedure, including dental work.',
      'Check with the pharmacy before starting anything new, including herbal products.',
    ],
    safetyConsiderations: [
      'Report unusual bruising, prolonged bleeding, dark stools or red urine promptly.',
      'Avoid NSAIDs; use paracetamol for analgesia.',
      'Acute illness, alcohol binges and antibiotics can all destabilise the INR.',
    ],
    interactionsToWatch: [
      'NSAIDs and aspirin — bleeding risk.',
      'Antibiotics, particularly metronidazole, macrolides and co-trimoxazole — raised INR.',
      'St John’s wort — enzyme induction, reduced anticoagulant effect.',
      'Cranberry juice and high-dose vitamin E — reported INR effects.',
      'Miconazole oral gel — a common, easily missed interaction.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_metformin',
    name: 'Metformin',
    drugClass: 'Biguanide antihyperglycaemic',
    summary:
      'First-line agent in type 2 diabetes. Does not cause hypoglycaemia on its own; the counselling emphasis is gastrointestinal tolerance and sick-day rules.',
    commonUses: ['Type 2 diabetes', 'Polycystic ovary syndrome (off-label)', 'Prediabetes risk reduction'],
    adverseEffects: [
      'Nausea, diarrhoea, abdominal discomfort (usually early and transient)',
      'Metallic taste',
      'Reduced vitamin B12 absorption with long-term use',
      'Lactic acidosis (rare, associated with renal impairment or dehydration)',
    ],
    counselingPoints: [
      'Take with or immediately after meals to reduce stomach upset.',
      'Doses are increased gradually; modified-release preparations help if tolerance is a problem.',
      'It does not usually cause low blood sugar unless combined with other agents.',
      'Restart at the usual dose after missed doses — never double up.',
    ],
    safetyConsiderations: [
      'Sick-day rules: stop temporarily during vomiting, diarrhoea or dehydration, and seek advice.',
      'Withhold before procedures using iodinated contrast media.',
      'Review dose against renal function; avoid if eGFR falls below 30 mL/min/1.73 m².',
    ],
    interactionsToWatch: [
      'Alcohol excess — lactic acidosis risk.',
      'Diuretics, ACE inhibitors and NSAIDs — indirectly, via renal function.',
      'Iodinated contrast — temporary suspension required.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_amoxicillin',
    name: 'Amoxicillin',
    drugClass: 'Broad-spectrum penicillin antibacterial',
    summary:
      'Widely used beta-lactam for respiratory, ENT and urinary infections. Allergy history and course completion dominate the counselling.',
    commonUses: ['Otitis media', 'Community-acquired pneumonia', 'Sinusitis', 'Dental abscess', 'Urinary tract infection'],
    adverseEffects: [
      'Nausea and diarrhoea',
      'Rash — maculopapular, particularly with concurrent viral infection',
      'Candidiasis',
      'Anaphylaxis (rare but serious)',
      'Antibiotic-associated colitis',
    ],
    counselingPoints: [
      'Complete the course as prescribed; spread doses evenly across the day.',
      'Suspensions are usually refrigerated after reconstitution — check the label and expiry.',
      'Shake the bottle and measure with the syringe or spoon supplied.',
      'Report any rash, facial swelling or breathing difficulty immediately.',
    ],
    safetyConsiderations: [
      'Contraindicated in penicillin allergy; clarify whether a reported "allergy" was rash, intolerance or anaphylaxis.',
      'Dose adjustment required in significant renal impairment.',
      'Paediatric dosing is weight-based — confirm both the weight and the strength supplied.',
    ],
    interactionsToWatch: [
      'Methotrexate — reduced excretion, increased toxicity.',
      'Warfarin — INR may be altered; monitor if a course is started.',
      'Allopurinol — increased incidence of rash.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_salbutamol',
    name: 'Salbutamol',
    genericFor: 'Albuterol',
    drugClass: 'Short-acting beta₂ agonist bronchodilator (reliever)',
    summary:
      'Rapid-onset reliever for asthma and COPD. How often it is used is one of the most useful control markers available to a pharmacist.',
    commonUses: ['Acute asthma symptoms', 'Exercise-induced bronchoconstriction', 'COPD symptom relief'],
    adverseEffects: ['Tremor', 'Palpitations', 'Headache', 'Muscle cramps', 'Hypokalaemia at high doses'],
    counselingPoints: [
      'Shake, breathe out fully, seal your lips, press and inhale slowly, then hold for about ten seconds.',
      'A spacer improves delivery substantially and is worth using routinely.',
      'Needing it more than three times a week suggests your asthma is not controlled — that needs a review, not more reliever.',
      'Carry it with you, and check the dose counter or expiry regularly.',
    ],
    safetyConsiderations: [
      'Increasing reliever use, night waking or a canister lasting under a month are all warning signs.',
      'A reliever alone does not treat the underlying inflammation — preventer adherence matters more.',
      'Seek emergency help if relief lasts under an hour or symptoms are severe.',
    ],
    interactionsToWatch: [
      'Non-selective beta-blockers — may block the bronchodilator effect and provoke bronchospasm.',
      'Diuretics and corticosteroids — additive hypokalaemia at high salbutamol doses.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_omeprazole',
    name: 'Omeprazole',
    drugClass: 'Proton pump inhibitor',
    summary:
      'Acid suppression for reflux, dyspepsia and ulcer prevention. The pharmacy contribution is usually deciding whether it is treating a symptom or masking a cause.',
    commonUses: ['Gastro-oesophageal reflux disease', 'Peptic ulcer healing', 'NSAID gastroprotection', 'H. pylori regimens'],
    adverseEffects: [
      'Headache',
      'Diarrhoea or constipation',
      'Hypomagnesaemia with prolonged use',
      'Increased fracture risk with long-term high-dose use',
      'Rebound acid hypersecretion on stopping abruptly',
    ],
    counselingPoints: [
      'Take 30–60 minutes before the first meal of the day.',
      'Swallow capsules whole; if opened, do not crush the granules.',
      'OTC courses are intended to be short — persistent symptoms need review, not repeat purchases.',
      'Alarm features such as difficulty swallowing, weight loss or vomiting blood need same-day medical attention.',
    ],
    safetyConsiderations: [
      'Can mask symptoms of gastric malignancy — always screen for alarm features first.',
      'If reflux is NSAID-driven, addressing the NSAID matters more than adding acid suppression.',
      'Review long-term use periodically; consider step-down or on-demand dosing.',
    ],
    interactionsToWatch: [
      'Clopidogrel — reduced activation; alternative PPIs are usually preferred.',
      'Methotrexate — reduced clearance at high doses.',
      'Drugs needing gastric acid for absorption, e.g. some antifungals and HIV agents.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
]

/** The full reference set. Split across two files purely for reviewability. */
export const drugs: Drug[] = [...baseDrugs, ...extraDrugs]

export function getDrug(id: string) {
  return drugs.find((d) => d.id === id)
}
