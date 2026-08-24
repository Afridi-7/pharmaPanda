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
