import type { Drug } from '@/types'

/**
 * Additional drug entries.
 *
 * Chosen to cover the agents the consultation cases actually turn on, so a
 * student who meets warfarin or a sedating antihistamine in a case can look it
 * up here. Kept separate from `drugs.ts` purely so each set stays reviewable.
 *
 * DRAFT CONTENT — requires pharmacist review against the current SmPC and
 * national formulary before students are assessed on it.
 */
export const extraDrugs: Drug[] = [
  {
    id: 'drug_naproxen',
    name: 'Naproxen',
    drugClass: 'Non-steroidal anti-inflammatory drug (NSAID)',
    summary:
      'A longer-acting NSAID used for musculoskeletal and period pain, carrying the same gastrointestinal, renal and cardiovascular cautions as the class.',
    commonUses: ['Musculoskeletal pain', 'Period pain', 'Inflammatory joint pain', 'Acute gout'],
    adverseEffects: [
      'Dyspepsia and gastric irritation',
      'Peptic ulceration and gastrointestinal bleeding',
      'Fluid retention and raised blood pressure',
      'Renal impairment, particularly in dehydration',
      'Bronchospasm in aspirin-sensitive asthma',
    ],
    counselingPoints: [
      'Take with or just after food to reduce stomach irritation.',
      'Use the lowest effective dose for the shortest period that controls symptoms.',
      'Stop and seek advice if you notice black stools, vomiting blood or persistent stomach pain.',
      'Do not combine with another oral NSAID, including ibuprofen bought over the counter.',
    ],
    safetyConsiderations: [
      'Avoid in active peptic ulceration and in severe heart failure.',
      'Avoid from 20 weeks of pregnancy onwards unless a specialist advises otherwise.',
      'Caution in asthma: a minority of patients experience NSAID-induced bronchospasm.',
      'Consider gastroprotection in older patients or those on other ulcer-risk medicines.',
    ],
    interactionsToWatch: [
      'Warfarin and other anticoagulants: substantially increased bleeding risk.',
      'ACE inhibitors and diuretics: the "triple whammy" risk of acute kidney injury.',
      'SSRIs: additive gastrointestinal bleeding risk.',
      'Lithium and methotrexate: reduced clearance, raising toxicity risk.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_loratadine',
    name: 'Loratadine',
    drugClass: 'Non-sedating antihistamine (second generation)',
    summary:
      'A once-daily antihistamine for allergic rhinitis and urticaria, chosen over older agents when alertness matters.',
    commonUses: ['Hay fever', 'Allergic rhinitis', 'Urticaria', 'Allergic skin reactions'],
    adverseEffects: [
      'Headache',
      'Dry mouth',
      'Fatigue (much less than with sedating antihistamines)',
      'Rarely, palpitations',
    ],
    counselingPoints: [
      'One dose lasts 24 hours; taking more does not improve control.',
      'For seasonal symptoms, regular daily use works better than taking it only on bad days.',
      'Considerably less sedating than chlorphenamine, but individual responses vary.',
      'If symptoms are mainly nasal, a steroid nasal spray may suit better — ask.',
    ],
    safetyConsiderations: [
      'Dose reduction is advised in significant hepatic impairment.',
      'Still preferable to a sedating antihistamine for drivers and machine operators.',
      'Not a treatment for anaphylaxis — that requires adrenaline and emergency care.',
    ],
    interactionsToWatch: [
      'Few clinically significant interactions at usual doses.',
      'Alcohol: additive drowsiness is possible even with non-sedating agents.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_chlorphenamine',
    name: 'Chlorphenamine',
    drugClass: 'Sedating antihistamine (first generation)',
    summary:
      'An older antihistamine that crosses into the brain, causing marked sedation. Effective, but the wrong choice for anyone who must stay alert.',
    commonUses: ['Allergic reactions', 'Urticaria', 'Insect bites', 'Adjunct in acute allergic episodes'],
    adverseEffects: [
      'Marked drowsiness and impaired concentration',
      'Dry mouth, blurred vision and urinary retention (antimuscarinic effects)',
      'Constipation',
      'Paradoxical excitation, particularly in children',
    ],
    counselingPoints: [
      'This will make you drowsy — do not drive or operate machinery after taking it.',
      'Drowsiness can persist into the following morning after an evening dose.',
      'Avoid alcohol entirely while taking it.',
      'If you need an antihistamine during the working day, ask about a non-sedating alternative.',
    ],
    safetyConsiderations: [
      'Avoid in professional drivers and anyone operating machinery.',
      'Caution in older patients: falls, confusion and urinary retention are real risks.',
      'Caution in prostatic enlargement, glaucoma and epilepsy.',
      'Driving while impaired by a sedating antihistamine has legal as well as clinical consequences.',
    ],
    interactionsToWatch: [
      'Alcohol, opioids, benzodiazepines: additive central nervous system depression.',
      'Other antimuscarinic medicines: cumulative dry mouth, retention and confusion.',
      'MAOIs: intensified and prolonged antimuscarinic effects.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_loperamide',
    name: 'Loperamide',
    drugClass: 'Antimotility agent',
    summary:
      'Slows gut transit in uncomplicated acute diarrhoea. Symptomatic only — it does not treat the cause, and there are situations where it should be withheld.',
    commonUses: ['Acute non-specific diarrhoea', 'Symptom control in chronic diarrhoea under supervision'],
    adverseEffects: ['Constipation', 'Abdominal cramps', 'Bloating', 'Dizziness'],
    counselingPoints: [
      'Take alongside oral rehydration, not instead of it — fluid replacement matters more.',
      'Stop as soon as stools are formed.',
      'Seek advice if diarrhoea lasts more than 48 hours, or sooner if you feel unwell.',
      'Never exceed the labelled dose: high doses carry a serious cardiac risk.',
    ],
    safetyConsiderations: [
      'Do not use where there is blood in the stool or a high fever — refer instead.',
      'Avoid in suspected inflammatory bowel disease flare or antibiotic-associated colitis.',
      'Not recommended in young children without medical advice.',
      'Deliberate high-dose misuse causes QT prolongation and life-threatening arrhythmia.',
    ],
    interactionsToWatch: [
      'Quinidine, ritonavir and other P-glycoprotein inhibitors: raised loperamide exposure.',
      'Medicines that prolong the QT interval: additive cardiac risk at high doses.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_ranitidine_alt',
    name: 'Famotidine',
    drugClass: 'H2-receptor antagonist',
    summary:
      'Reduces gastric acid secretion. A step between antacids and proton pump inhibitors for dyspepsia and reflux.',
    commonUses: ['Heartburn', 'Acid reflux', 'Dyspepsia', 'Gastric acid reduction'],
    adverseEffects: ['Headache', 'Dizziness', 'Constipation or diarrhoea', 'Rarely, confusion in older patients'],
    counselingPoints: [
      'Onset is slower than an antacid but the effect lasts considerably longer.',
      'Can be taken before a meal known to trigger symptoms.',
      'If symptoms persist beyond two weeks of treatment, seek review rather than continuing.',
      'Lifestyle measures — smaller meals, weight, late eating, alcohol — matter alongside the medicine.',
    ],
    safetyConsiderations: [
      'Dose reduction is required in renal impairment.',
      'Acid suppression can mask the symptoms of gastric malignancy — always screen for alarm features.',
      'Alarm features (weight loss, dysphagia, vomiting, anaemia, melaena) need referral, not treatment.',
    ],
    interactionsToWatch: [
      'Medicines needing gastric acid for absorption, such as some antifungals, may be less effective.',
      'Fewer interactions than cimetidine, which inhibits several CYP enzymes.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_hydrocortisone',
    name: 'Hydrocortisone (topical)',
    drugClass: 'Mild topical corticosteroid',
    summary:
      'A mild steroid cream for short-term treatment of inflammatory skin conditions such as eczema and insect-bite reactions.',
    commonUses: ['Mild eczema', 'Contact dermatitis', 'Insect bite reactions', 'Mild inflammatory rashes'],
    adverseEffects: [
      'Local burning or stinging on application',
      'Skin thinning with prolonged use',
      'Worsening of untreated skin infection',
      'Perioral dermatitis if used on the face',
    ],
    counselingPoints: [
      'Apply thinly to the affected area only, once or twice daily.',
      'Use for no more than seven days without seeking advice.',
      'Continue emollients alongside — they do the long-term work.',
      'Wash your hands after applying, unless the hands are the area being treated.',
    ],
    safetyConsiderations: [
      'Not for use on broken or infected skin: steroids can let infection spread.',
      'Avoid the face, eyes and genital area unless specifically advised.',
      'Over-the-counter use is restricted by age and body site — check before supply.',
      'A rash that is spreading, weeping or crusting suggests infection and needs referral.',
    ],
    interactionsToWatch: [
      'Few systemic interactions when used correctly on small areas.',
      'Extensive or occluded application increases systemic absorption.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_simvastatin',
    name: 'Simvastatin',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    summary:
      'Lowers cholesterol to reduce cardiovascular risk. Interaction-prone, and the reason several common over-the-counter requests need checking.',
    commonUses: ['Primary and secondary cardiovascular prevention', 'Hypercholesterolaemia'],
    adverseEffects: [
      'Muscle aches (myalgia)',
      'Raised liver enzymes',
      'Gastrointestinal upset',
      'Rarely, rhabdomyolysis',
    ],
    counselingPoints: [
      'Usually taken in the evening, when cholesterol synthesis is highest.',
      'Report unexplained muscle pain, tenderness or weakness promptly.',
      'Avoid grapefruit juice — it raises simvastatin levels substantially.',
      'It works alongside diet and activity rather than replacing them.',
    ],
    safetyConsiderations: [
      'Contraindicated in pregnancy and breastfeeding.',
      'Dose limits apply when combined with certain interacting medicines.',
      'Muscle symptoms with dark urine need same-day assessment.',
    ],
    interactionsToWatch: [
      'Clarithromycin and erythromycin: markedly raised statin exposure and myopathy risk.',
      'Itraconazole and ketoconazole: contraindicated combinations.',
      'Amlodipine and diltiazem: dose restrictions apply.',
      'Grapefruit juice: a genuine and often-overlooked interaction.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_levothyroxine',
    name: 'Levothyroxine',
    drugClass: 'Thyroid hormone replacement',
    summary:
      'Replaces thyroid hormone in hypothyroidism. Absorption is easily disturbed, which makes counselling on timing unusually important.',
    commonUses: ['Hypothyroidism', 'Thyroid hormone replacement after thyroidectomy'],
    adverseEffects: [
      'Symptoms of over-replacement: palpitations, tremor, weight loss, heat intolerance',
      'Insomnia',
      'Diarrhoea',
      'Reduced bone density with prolonged over-treatment',
    ],
    counselingPoints: [
      'Take on an empty stomach, usually 30 to 60 minutes before breakfast.',
      'Separate from calcium, iron and indigestion remedies by at least four hours.',
      'Take it at the same time each day; do not double up after a missed dose.',
      'Dose changes are guided by blood tests — never adjust it yourself.',
    ],
    safetyConsiderations: [
      'Requirements change in pregnancy and need prompt review.',
      'Start low and increase slowly in older patients and in ischaemic heart disease.',
      'Persistent palpitations or tremor suggest over-replacement and need review.',
    ],
    interactionsToWatch: [
      'Calcium and iron salts: markedly reduced absorption if taken together.',
      'Proton pump inhibitors and antacids: reduced absorption.',
      'Warfarin: thyroid status alters anticoagulant response.',
      'Rifampicin and carbamazepine: increased metabolism, so higher doses may be needed.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
  {
    id: 'drug_stjohnswort',
    name: 'St John’s Wort',
    drugClass: 'Herbal preparation (enzyme inducer)',
    summary:
      'Sold for low mood, and one of the most interaction-prone products on the shelf. A potent CYP450 and P-glycoprotein inducer.',
    commonUses: ['Low mood (self-treatment)', 'Mild depressive symptoms'],
    adverseEffects: ['Photosensitivity', 'Gastrointestinal upset', 'Restlessness', 'Dry mouth'],
    counselingPoints: [
      'Always tell the pharmacist about herbal products — this one interacts widely.',
      'It can stop prescribed medicines from working, including contraception.',
      'Do not start it without checking your full medication list first.',
      'Persistent low mood deserves proper assessment rather than self-treatment.',
    ],
    safetyConsiderations: [
      'Reduces the effect of warfarin, destabilising INR control.',
      'Reduces the effectiveness of hormonal contraception, risking unintended pregnancy.',
      'Serotonin syndrome risk when combined with SSRIs or triptans.',
      'Product strength varies between brands, so effects are unpredictable.',
    ],
    interactionsToWatch: [
      'Warfarin: reduced anticoagulant effect.',
      'SSRIs and triptans: serotonergic toxicity.',
      'Hormonal contraceptives: contraceptive failure.',
      'Ciclosporin, tacrolimus and antiretrovirals: loss of therapeutic effect, with serious consequences.',
    ],
    sourceNote: 'Reference entry for study use.',
  },
]
