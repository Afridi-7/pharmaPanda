"""
Scenario scoring rules.

Extracted verbatim from `src/lib/evaluationEngine.ts` so the Python engine
scores identically to the TypeScript one it replaces. Generated once, then
maintained here as the single source of truth.
"""

EVALUATION_STAGES = ['History taking',
 'Clinical reasoning',
 'Medication safety',
 'Communication',
 'Counseling',
 'Referral decision']

RULES: dict[str, dict] = {'sc_headache': {'unsafeRecommendations': [{'choices': ['NSAID'],
                                            'title': 'NSAID recommended despite significant '
                                                     'contraindications',
                                            'what': 'You recommended an NSAID for a patient taking '
                                                    'warfarin, with a previous gastric ulcer and '
                                                    'an aspirin allergy.',
                                            'why': 'NSAIDs increase bleeding risk substantially on '
                                                   'warfarin, they are directly implicated in '
                                                   'peptic ulcer recurrence, and cross-reactivity '
                                                   'with an aspirin allergy is well described. '
                                                   'Paracetamol is the appropriate first-line '
                                                   'analgesic here, alongside advice on hydration, '
                                                   'sleep and screen breaks.'}],
                 'preferredRecommendations': ['Paracetamol', 'Non-drug management'],
                 'expectedReferrals': ['No referral', 'Routine physician referral'],
                 'criticalFactIds': ['sarah_allergy',
                                     'sarah_meds',
                                     'sarah_history',
                                     'sarah_redflags'],
                 'betterApproach': ['Gather relevant history.',
                                    'Screen for red flags.',
                                    'Ask about allergies.',
                                    'Review current medications.',
                                    'Assess contraindications.',
                                    'Determine appropriate treatment.',
                                    'Provide counseling.'],
                 'nextScenarioId': 'sc_inhaler',
                 'nextScenarioReason': 'Your clinical reasoning is strong. Let’s improve your '
                                       'patient counseling.'},
 'sc_cough': {'unsafeRecommendations': [{'choices': ['NSAID', 'Paracetamol', 'Non-drug management'],
                                         'title': 'Symptomatic treatment offered instead of '
                                                  'referral',
                                         'what': 'You treated a five-week cough with weight loss, '
                                                 'night sweats and a 30 pack-year smoking history.',
                                         'why': 'This combination meets referral criteria for '
                                                'suspected serious pathology and needs imaging, '
                                                'not a cough syrup. A chest examination and chest '
                                                'X-ray are the priority; the ACE inhibitor is a '
                                                'secondary consideration.'}],
              'preferredRecommendations': ['Routine physician referral',
                                           'Urgent referral',
                                           'No OTC treatment'],
              'expectedReferrals': ['Urgent referral', 'Routine physician referral'],
              'criticalFactIds': ['thomas_weight', 'thomas_smoking', 'thomas_meds'],
              'betterApproach': ['Establish cough duration and character.',
                                 'Screen for weight loss, night sweats and haemoptysis.',
                                 'Take a smoking history in pack-years.',
                                 'Review medication for ACE-inhibitor cough.',
                                 'Recognise that red flags override symptomatic treatment.',
                                 'Refer with a clear stated urgency.',
                                 'Tell the patient exactly what to say when they book.'],
              'nextScenarioId': 'sc_interaction',
              'nextScenarioReason': 'You handle referral well. Next, stress-test your medication '
                                    'safety knowledge.'},
 'sc_heartburn': {'unsafeRecommendations': [{'choices': ['NSAID'],
                                             'title': 'NSAID recommended in NSAID-induced '
                                                      'dyspepsia',
                                             'what': 'You recommended an NSAID for a patient whose '
                                                     'symptoms are most likely caused by regular '
                                                     'naproxen.',
                                             'why': 'Adding NSAID load to suspected NSAID-induced '
                                                    'dyspepsia worsens the underlying cause. The '
                                                    'correct approach is gastroprotection, a '
                                                    'review of the naproxen with the prescriber, '
                                                    'and lifestyle measures.'}],
                  'preferredRecommendations': ['Routine physician referral',
                                               'Non-drug management',
                                               'Other'],
                  'expectedReferrals': ['Routine physician referral', 'No referral'],
                  'criticalFactIds': ['amina_meds', 'amina_alarm'],
                  'betterApproach': ['Gather relevant history.',
                                     'Screen for red flags.',
                                     'Ask about allergies.',
                                     'Review current medications.',
                                     'Assess contraindications.',
                                     'Determine appropriate treatment.',
                                     'Provide counseling.'],
                  'nextScenarioId': 'sc_inhaler',
                  'nextScenarioReason': 'Strong safety instincts. Counseling is where you can gain '
                                        'most next.'},
 'sc_allergy': {'unsafeRecommendations': [{'choices': ['Other'],
                                           'requiresFacts': ['george_job'],
                                           'title': 'Sedating option for a professional driver',
                                           'what': 'A sedating antihistamine was implied for a '
                                                   'patient who drives a delivery van all day.',
                                           'why': 'Sedating antihistamines carry a documented '
                                                  'impairment risk while driving. A non-sedating '
                                                  'agent is essential, and his poorly controlled '
                                                  'asthma needs addressing separately.'}],
                'preferredRecommendations': ['Other',
                                             'Non-drug management',
                                             'Routine physician referral'],
                'expectedReferrals': ['Routine physician referral', 'No referral'],
                'criticalFactIds': ['george_job', 'george_chest', 'george_history'],
                'betterApproach': ['Gather relevant history.',
                                   'Screen for red flags.',
                                   'Ask about allergies.',
                                   'Review current medications.',
                                   'Assess contraindications.',
                                   'Determine appropriate treatment.',
                                   'Provide counseling.'],
                'nextScenarioId': 'sc_fever_child',
                'nextScenarioReason': 'Try a case where the dose itself has to be exactly right.'},
 'sc_rash': {'unsafeRecommendations': [],
             'preferredRecommendations': ['Non-drug management',
                                          'Other',
                                          'Routine physician referral'],
             'expectedReferrals': ['No referral', 'Routine physician referral'],
             'criticalFactIds': ['lena_infection', 'lena_trigger'],
             'betterApproach': ['Gather relevant history.',
                                'Screen for red flags.',
                                'Ask about allergies.',
                                'Review current medications.',
                                'Assess contraindications.',
                                'Determine appropriate treatment.',
                                'Provide counseling.'],
             'nextScenarioId': 'sc_headache',
             'nextScenarioReason': 'Practise a case where the safe choice depends on hidden '
                                   'medication history.'},
 'sc_fever_child': {'unsafeRecommendations': [{'choices': ['NSAID'],
                                               'requiresFacts': ['mateo_meds'],
                                               'title': 'Second agent added without establishing '
                                                        'the first dose',
                                               'what': 'You added ibuprofen without first '
                                                       'establishing how much paracetamol was '
                                                       'actually given.',
                                               'why': 'An uncertain dose given with a kitchen '
                                                      'spoon must be quantified before anything '
                                                      'else is added, and the parent needs an oral '
                                                      'syringe. Sequencing matters: establish, '
                                                      'then dose, then safety-net.'}],
                    'preferredRecommendations': ['Paracetamol', 'Non-drug management'],
                    'expectedReferrals': ['No referral', 'Routine physician referral'],
                    'criticalFactIds': ['mateo_redflags', 'mateo_weight', 'mateo_meds'],
                    'betterApproach': ['Screen for paediatric red flags first.',
                                       'Establish the child’s current weight.',
                                       'Establish exactly what has already been given, and when.',
                                       'Calculate the weight-based dose and check the maximum in '
                                       '24 hours.',
                                       'Supply an oral syringe and demonstrate the measurement.',
                                       'Counsel on fluids, monitoring and antipyretic '
                                       'expectations.',
                                       'Safety-net: state precisely when to seek urgent help.'],
                    'nextScenarioId': 'sc_inhaler',
                    'nextScenarioReason': 'Your dosing was careful. Next, focus on teaching a '
                                          'technique clearly.'},
 'sc_missed_meds': {'unsafeRecommendations': [{'choices': ['Other'],
                                               'requiresFacts': ['ruth_monitoring'],
                                               'title': 'Missed-dose plan without addressing the '
                                                        'glucose reading',
                                               'what': 'A glucose of 14.2 mmol/L after a week '
                                                       'without metformin was not acted upon.',
                                               'why': 'Restarting the usual dose is correct, but '
                                                      'persistent hyperglycaemia after restarting '
                                                      'needs prescriber review. Levothyroxine and '
                                                      'ramipril should also simply be resumed at '
                                                      'the usual dose — never doubled.'}],
                    'preferredRecommendations': ['Routine physician referral',
                                                 'Other',
                                                 'Non-drug management'],
                    'expectedReferrals': ['Routine physician referral', 'No referral'],
                    'criticalFactIds': ['ruth_meds', 'ruth_monitoring', 'ruth_symptoms'],
                    'betterApproach': ['Gather relevant history.',
                                       'Screen for red flags.',
                                       'Ask about allergies.',
                                       'Review current medications.',
                                       'Assess contraindications.',
                                       'Determine appropriate treatment.',
                                       'Provide counseling.'],
                    'nextScenarioId': 'sc_interaction',
                    'nextScenarioReason': 'You are comfortable with chronic medication. Now test '
                                          'interaction knowledge.'},
 'sc_inhaler': {'unsafeRecommendations': [{'choices': ['Other'],
                                           'requiresFacts': ['nadia_reliever'],
                                           'title': 'Escalation without correcting technique',
                                           'what': 'A stronger inhaler was considered before '
                                                   'technique and adherence were corrected.',
                                           'why': 'Reliever use of 8–10 puffs weekly with night '
                                                  'waking indicates poor control, but the '
                                                  'modifiable cause here is technique and '
                                                  'preventer adherence. Escalating strength first '
                                                  'exposes the patient to more steroid without '
                                                  'fixing delivery.'}],
                'preferredRecommendations': ['Non-drug management',
                                             'Other',
                                             'Routine physician referral'],
                'expectedReferrals': ['Routine physician referral', 'No referral'],
                'criticalFactIds': ['nadia_technique', 'nadia_reliever', 'nadia_control'],
                'betterApproach': ['Ask what the patient believes each inhaler does.',
                                   'Assess control: night symptoms, reliever use, activity '
                                   'limitation.',
                                   'Watch the technique rather than asking about it.',
                                   'Correct one or two steps at a time, then demonstrate.',
                                   'Explain preventer vs reliever in everyday language.',
                                   'Check understanding with teach-back.',
                                   'Arrange asthma review and document reliever overuse.'],
                'nextScenarioId': 'sc_headache',
                'nextScenarioReason': 'Bring that counseling clarity into a medication safety '
                                      'case.'},
 'sc_interaction': {'unsafeRecommendations': [{'choices': ['Other', 'Non-drug management'],
                                               'requiresFacts': ['derek_meds'],
                                               'title': 'Herbal supply considered alongside '
                                                        'warfarin and sertraline',
                                               'what': 'St John’s wort was not clearly declined '
                                                       'for a patient on warfarin and sertraline.',
                                               'why': 'St John’s wort induces CYP450 enzymes and '
                                                      'reduces warfarin effect — destabilising INR '
                                                      '— and adds serotonergic risk with '
                                                      'sertraline. This is a supply you decline, '
                                                      'with a clear explanation and a route back '
                                                      'to the prescriber.'}],
                    'preferredRecommendations': ['No OTC treatment', 'Routine physician referral'],
                    'expectedReferrals': ['Routine physician referral', 'No referral'],
                    'criticalFactIds': ['derek_meds', 'derek_mood', 'derek_supplements'],
                    'betterApproach': ['Gather relevant history.',
                                       'Screen for red flags.',
                                       'Ask about allergies.',
                                       'Review current medications.',
                                       'Assess contraindications.',
                                       'Determine appropriate treatment.',
                                       'Provide counseling.'],
                    'nextScenarioId': 'sc_inhaler',
                    'nextScenarioReason': 'Your safety screening is excellent. Counseling clarity '
                                          'is the next gain.'},
 'sc_wound': {'unsafeRecommendations': [{'choices': ['Non-drug management'],
                                         'requiresFacts': ['priya_tetanus'],
                                         'title': 'Wound dressed without addressing tetanus risk',
                                         'what': 'A soil-contaminated wound was dressed without '
                                                 'arranging tetanus assessment.',
                                         'why': 'A dirty wound with an uncertain booster history '
                                                'over 10 years old requires tetanus assessment. A '
                                                'gaping 3 cm laceration also warrants review for '
                                                'closure within the appropriate window.'}],
              'preferredRecommendations': ['Routine physician referral', 'Urgent referral'],
              'expectedReferrals': ['Routine physician referral', 'Urgent referral'],
              'criticalFactIds': ['priya_wound', 'priya_contamination', 'priya_tetanus'],
              'betterApproach': ['Gather relevant history.',
                                 'Screen for red flags.',
                                 'Ask about allergies.',
                                 'Review current medications.',
                                 'Assess contraindications.',
                                 'Determine appropriate treatment.',
                                 'Provide counseling.'],
              'nextScenarioId': 'sc_fever_child',
              'nextScenarioReason': 'Solid assessment. Next, practise getting a paediatric dose '
                                    'exactly right.'}}


# --- Drafted cases ---------------------------------------------------------
# Structure and teaching point are settled; clinical wording needs pharmacist
# review before these reach students.

RULES["sc_sore_throat"] = {
    "unsafeRecommendations": [
        {
            "choices": ["Paracetamol", "Non-drug management", "NSAID"],
            "requiresFacts": ["amir_exudate", "amir_breathing"],
            "title": "Symptomatic treatment offered despite features needing assessment",
            "what": (
                "You treated a five-day sore throat with fever, tonsillar exudate, tender cervical "
                "nodes and difficulty swallowing saliva as a self-limiting illness."
            ),
            "why": (
                "That combination is what distinguishes a sore throat needing clinical assessment "
                "from one that will settle on its own. Difficulty swallowing saliva in particular "
                "is an airway concern and needs same-day review, not a lozenge. Analgesia is "
                "reasonable alongside referral — not instead of it."
            ),
        },
    ],
    "preferredRecommendations": ["Routine physician referral", "Urgent referral", "No OTC treatment"],
    "expectedReferrals": ["Urgent referral", "Routine physician referral"],
    "criticalFactIds": ["amir_exudate", "amir_breathing", "amir_fever", "amir_allergy"],
    "betterApproach": [
        "Establish duration and whether it is improving or worsening.",
        "Ask about fever and measure or confirm the temperature.",
        "Ask what the throat looks like and about swollen neck glands.",
        "Screen for airway concern: swallowing saliva, drooling, voice change, breathing.",
        "Confirm allergy status before any treatment is discussed.",
        "Explain that antibiotic supply is a prescriber decision, and why.",
        "Refer with a stated urgency, and safety-net what would make it an emergency.",
    ],
    "nextScenarioId": "sc_uti",
    "nextScenarioReason": (
        "You handled a referral decision well. Next, a case where one unasked question changes "
        "the answer entirely."
    ),
}

RULES["sc_uti"] = {
    "unsafeRecommendations": [
        {
            "choices": ["Other", "Non-drug management", "NSAID", "Paracetamol"],
            "requiresFacts": ["bea_pregnancy"],
            "title": "Pharmacy treatment considered for a urinary infection in pregnancy",
            "what": (
                "You treated urinary symptoms in a patient who is ten weeks pregnant as an "
                "over-the-counter matter."
            ),
            "why": (
                "Urinary infection in pregnancy is not a pharmacy self-care presentation. Untreated "
                "or inadequately treated infection carries risk to the pregnancy, treatment choice "
                "is constrained by trimester, and it needs prescriber assessment with a urine "
                "sample. The correct action is prompt referral, with an explanation that does not "
                "alarm her."
            ),
        },
    ],
    "preferredRecommendations": ["Routine physician referral", "Urgent referral", "No OTC treatment"],
    "expectedReferrals": ["Urgent referral", "Routine physician referral"],
    "criticalFactIds": ["bea_pregnancy", "bea_redflags", "bea_meds"],
    "betterApproach": [
        "Characterise the urinary symptoms and how long they have been present.",
        "Screen for fever, flank pain and systemic upset suggesting upper tract involvement.",
        "Ask directly about pregnancy before considering any treatment.",
        "Establish current medication — folic acid alone is itself a clue.",
        "Recognise that pregnancy moves this out of pharmacy self-care.",
        "Refer promptly and say what to expect: a urine sample and a prescriber review.",
        "Safety-net: what would make this urgent before that appointment.",
    ],
    "nextScenarioId": "sc_interaction",
    "nextScenarioReason": (
        "Your safety questioning is strong. Next, stress-test your interaction knowledge."
    ),
}

RULES["sc_chest_pain"] = {
    "unsafeRecommendations": [
        {
            "choices": ["Other", "Non-drug management", "Paracetamol", "NSAID", "No referral"],
            "requiresFacts": ["colin_radiation", "colin_autonomic"],
            "title": "Cardiac presentation treated as indigestion",
            "what": (
                "You supplied or advised symptomatic treatment for chest discomfort that radiates "
                "to the arm and jaw, with sweating, nausea and breathlessness, in a 58-year-old "
                "smoker with hypertension."
            ),
            "why": (
                "That combination is an acute coronary syndrome until proven otherwise. It needs "
                "emergency assessment, not an antacid. Supplying a remedy here delays definitive "
                "care during the window when it matters most."
            ),
        },
    ],
    "preferredRecommendations": ["Urgent referral", "No OTC treatment"],
    "expectedReferrals": ["Emergency referral", "Urgent referral"],
    "criticalFactIds": ["colin_radiation", "colin_autonomic", "colin_history", "colin_meds"],
    "betterApproach": [
        "Characterise the discomfort yourself rather than accepting the label of indigestion.",
        "Ask specifically whether it radiates to the arm, jaw, neck or back.",
        "Screen for sweating, nausea and breathlessness.",
        "Ask what brings it on and what relieves it.",
        "Establish cardiovascular risk: age, smoking, blood pressure, family history.",
        "Recognise that this is an emergency presentation and arrange immediate assessment.",
        "Stay with the patient and explain calmly why you are not selling a remedy.",
    ],
    "nextScenarioId": "sc_red_eye",
    "nextScenarioReason": (
        "You recognised an emergency behind a routine request. Next, a case where the same skill "
        "applies to sight."
    ),
}

RULES["sc_red_eye"] = {
    "unsafeRecommendations": [
        {
            "choices": ["Other", "Non-drug management", "No referral"],
            "requiresFacts": ["dana_vision", "dana_contacts"],
            "title": "Sight-threatening presentation treated as conjunctivitis",
            "what": (
                "You treated a red eye with reduced vision, deep pain and photophobia in a contact "
                "lens wearer who has slept in her lenses."
            ),
            "why": (
                "Reduced acuity and photophobia are not features of simple conjunctivitis. In a "
                "lens wearer who has slept in lenses, microbial keratitis must be excluded the "
                "same day. Chloramphenicol will not treat it and delay risks permanent visual loss."
            ),
        },
    ],
    "preferredRecommendations": ["Urgent referral", "Routine physician referral", "No OTC treatment"],
    "expectedReferrals": ["Urgent referral", "Emergency referral"],
    "criticalFactIds": ["dana_vision", "dana_pain", "dana_contacts"],
    "betterApproach": [
        "Ask whether vision is affected, and whether it clears on blinking.",
        "Distinguish surface grittiness from deep ache with light sensitivity.",
        "Ask about discharge: watery, or purulent with morning crusting.",
        "Ask directly about contact lens wear, including sleeping in lenses.",
        "Recognise that acuity loss plus photophobia excludes simple conjunctivitis.",
        "Refer for same-day assessment and advise stopping lens wear immediately.",
        "Tell her to take her lenses and solution with her to the appointment.",
    ],
    "nextScenarioId": "sc_teething",
    "nextScenarioReason": (
        "Strong red-flag recognition. Next, a case where the risk is dosing accuracy rather than "
        "missed pathology."
    ),
}

RULES["sc_teething"] = {
    "unsafeRecommendations": [
        {
            "choices": ["NSAID"],
            "requiresFacts": ["erin_given"],
            "title": "Second agent added without establishing what was already given",
            "what": (
                "You added ibuprofen without first establishing how much paracetamol had already "
                "been given, or how it was measured."
            ),
            "why": (
                "A dose given with a kitchen spoon is an unknown dose. Quantifying what has already "
                "been taken comes before adding anything, and the parent needs an oral syringe "
                "either way. Sequencing matters here: establish, then dose, then safety-net."
            ),
        },
    ],
    "preferredRecommendations": ["Paracetamol", "Non-drug management"],
    "expectedReferrals": ["No referral", "Routine physician referral"],
    "criticalFactIds": ["erin_redflags", "erin_infant_weight", "erin_given", "erin_products"],
    "betterApproach": [
        "Screen for paediatric red flags before accepting teething as the cause.",
        "Establish the child's current weight.",
        "Establish exactly what has already been given, and how it was measured.",
        "Calculate the weight-based dose and state the maximum in 24 hours.",
        "Advise against amber necklaces explicitly: strangulation and choking risk.",
        "Supply an oral syringe and demonstrate how to measure the dose.",
        "Safety-net: say precisely what would mean seeking urgent help.",
    ],
    "nextScenarioId": "sc_interaction",
    "nextScenarioReason": (
        "Careful paediatric counselling. Next, stress-test your interaction knowledge."
    ),
}


DEFAULT_RULE = {
    "unsafeRecommendations": [],
    "preferredRecommendations": ["Paracetamol", "Non-drug management"],
    "expectedReferrals": ["No referral", "Routine physician referral"],
    "criticalFactIds": [],
    "betterApproach": RULES["sc_headache"]["betterApproach"],
    "nextScenarioId": "sc_headache",
    "nextScenarioReason": "A good all-round case to consolidate what you practised.",
}


def rule_for(slug: str) -> dict:
    return RULES.get(slug, DEFAULT_RULE)
