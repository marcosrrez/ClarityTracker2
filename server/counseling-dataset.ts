/**
 * Comprehensive Counseling Knowledge Dataset
 * For use when AI APIs are unavailable or as supplementary knowledge
 */

export interface CounselingEntry {
  id: string;
  topic: string;
  category: string;
  description: string;
  example: string;
  reflectivePrompt: string;
  references: string[];
  keywords: string[];
  responseTemplate: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  relatedTopics: string[];
}

export const counselingDataset: CounselingEntry[] = [
  // Counseling Theories
  {
    id: 'cbt-001',
    topic: 'Cognitive-Behavioral Therapy',
    category: 'Counseling Theories',
    description: 'CBT targets dysfunctional thoughts and behaviors using techniques like cognitive restructuring, behavioral activation, and exposure therapy. Research shows CBT is effective for anxiety, depression, and PTSD.',
    example: 'Ask a client, "What evidence supports your thought that you\'re a failure?" to challenge negative beliefs. Practice this technique in role-play sessions.',
    reflectivePrompt: 'How might CBT align with your personal counseling style and values?',
    references: ['Beck, A. T. (1979). Cognitive Therapy of Depression', 'Butler, A. C. (2006). The empirical status of cognitive-behavioral therapy'],
    keywords: ['CBT', 'cognitive', 'behavioral', 'therapy', 'restructuring', 'thoughts'],
    responseTemplate: 'CBT helps clients modify thoughts like "{user_input}". Try cognitive restructuring: examine evidence for and against the thought. Reflect: {reflective_prompt}',
    skillLevel: 'Beginner',
    relatedTopics: ['Therapeutic Alliance', 'Skill Development', 'Depression Treatment']
  },
  {
    id: 'humanistic-001',
    topic: 'Humanistic Therapy',
    category: 'Counseling Theories',
    description: 'Person-centered approach focusing on self-actualization, unconditional positive regard, empathy, and genuineness. Developed by Carl Rogers.',
    example: 'Reflect feelings: "You sound frustrated about your relationship" and provide unconditional acceptance of the client\'s experience.',
    reflectivePrompt: 'How do you naturally show empathy and acceptance in your daily interactions?',
    references: ['Rogers, C. (1951). Client-Centered Therapy', 'Rogers, C. (1961). On Becoming a Person'],
    keywords: ['humanistic', 'person-centered', 'empathy', 'genuineness', 'unconditional positive regard'],
    responseTemplate: 'In humanistic therapy, focus on {user_input} through empathy and acceptance. Practice active listening and reflect the client\'s feelings.',
    skillLevel: 'Beginner',
    relatedTopics: ['Therapeutic Alliance', 'Core Skills', 'Active Listening']
  },
  {
    id: 'solution-focused-001',
    topic: 'Solution-Focused Brief Therapy',
    category: 'Counseling Theories',
    description: 'SFBT emphasizes solutions over problems, using techniques like the miracle question and scaling questions to identify client strengths and goals.',
    example: 'Ask the miracle question: "If a miracle happened overnight and your problem was solved, what would be different tomorrow?" Focus on small, achievable changes.',
    reflectivePrompt: 'How comfortable are you with focusing on solutions rather than exploring problems in depth?',
    references: ['de Shazer, S. (1985). Keys to Solution in Brief Therapy', 'Berg, I. K. (1994). Family Based Services'],
    keywords: ['SFBT', 'solution-focused', 'miracle question', 'scaling', 'brief therapy'],
    responseTemplate: 'For {user_input}, use SFBT techniques like the miracle question or scaling (1-10). Focus on what\'s working and small steps forward.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Goal Setting', 'Strengths-Based Approach', 'Brief Therapy']
  },
  {
    id: 'gestalt-001',
    topic: 'Gestalt Therapy',
    category: 'Counseling Theories',
    description: 'Gestalt therapy, developed by Fritz Perls, focuses on present-moment awareness, personal responsibility, and the integration of fragmented parts of the self. Key concepts include figure/ground, contact and resistance, and the "here and now" approach. Emphasizes experiential techniques over interpretation.',
    example: 'Use the "empty chair" technique: Have the client speak to an absent person or part of themselves in an empty chair, then switch chairs to respond. Ask "What are you experiencing right now in your body?" to increase present-moment awareness.',
    reflectivePrompt: 'How comfortable are you with experiential techniques that focus on present-moment awareness rather than past exploration?',
    references: ['Perls, F. (1973). The Gestalt Approach and Eye Witness to Therapy', 'Yontef, G. (1993). Awareness, Dialogue, and Process'],
    keywords: ['gestalt', 'fritz perls', 'present moment', 'awareness', 'empty chair', 'figure ground', 'here and now'],
    responseTemplate: 'For {user_input}, use Gestalt techniques focusing on present awareness. Try asking "What are you experiencing right now?" or use empty chair work for internal conflicts.',
    skillLevel: 'Advanced',
    relatedTopics: ['Experiential Therapy', 'Body Awareness', 'Present-Moment Focus']
  },
  {
    id: 'psychodynamic-001',
    topic: 'Psychodynamic Therapy',
    category: 'Counseling Theories',
    description: 'Based on psychoanalytic theory, psychodynamic therapy explores unconscious processes, early life experiences, and relationship patterns. Focuses on insight, transference, countertransference, and defense mechanisms. Modern approaches are more interactive than classical psychoanalysis.',
    example: 'Notice transference patterns: "I notice you relate to me similarly to how you described your relationship with your father. What do you think about that?" Explore defense mechanisms like projection or denial.',
    reflectivePrompt: 'How do you notice your own unconscious reactions (countertransference) with clients, and how might this inform the therapy?',
    references: ['Freud, S. (1912). The Dynamics of Transference', 'Shedler, J. (2010). The efficacy of psychodynamic psychotherapy'],
    keywords: ['psychodynamic', 'unconscious', 'transference', 'countertransference', 'defense mechanisms', 'insight'],
    responseTemplate: 'In psychodynamic work with {user_input}, explore unconscious patterns, examine transference dynamics, and help the client gain insight into recurring themes.',
    skillLevel: 'Advanced',
    relatedTopics: ['Transference', 'Defense Mechanisms', 'Insight-Oriented Therapy']
  },
  {
    id: 'dbt-001',
    topic: 'Dialectical Behavior Therapy',
    category: 'Counseling Theories',
    description: 'DBT, developed by Marsha Linehan, combines CBT techniques with mindfulness and distress tolerance skills. Originally for borderline personality disorder, now used for emotion regulation issues. Four modules: mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness.',
    example: 'Teach the TIPP skill for crisis survival: Temperature (cold water on face), Intense exercise, Paced breathing, Progressive muscle relaxation. Practice radical acceptance: "I cannot change this situation right now, but I can accept it."',
    reflectivePrompt: 'How do you model distress tolerance and emotional regulation in your own life and therapeutic practice?',
    references: ['Linehan, M. M. (1993). Cognitive-Behavioral Treatment of Borderline Personality Disorder', 'Linehan, M. M. (2014). DBT Skills Training Manual'],
    keywords: ['DBT', 'dialectical behavior therapy', 'marsha linehan', 'mindfulness', 'distress tolerance', 'emotion regulation', 'interpersonal effectiveness'],
    responseTemplate: 'For {user_input}, use DBT skills like mindfulness, distress tolerance (TIPP), emotion regulation, or interpersonal effectiveness depending on the client\'s needs.',
    skillLevel: 'Advanced',
    relatedTopics: ['Mindfulness', 'Emotion Regulation', 'Crisis Management']
  },
  {
    id: 'acceptance-commitment-001',
    topic: 'Acceptance and Commitment Therapy',
    category: 'Counseling Theories',
    description: 'ACT focuses on psychological flexibility through six core processes: acceptance, cognitive defusion, present-moment awareness, self-as-context, values clarification, and committed action. Based on Relational Frame Theory and functional contextualism.',
    example: 'Use metaphors like "thoughts are like clouds passing in the sky - you can observe them without being controlled by them." Help clients identify values: "What matters most to you in life, regardless of your anxiety?"',
    reflectivePrompt: 'How do you practice psychological flexibility in your own life, and how does this inform your therapeutic work?',
    references: ['Hayes, S. C. (1999). Acceptance and Commitment Therapy', 'Luoma, J. B. (2007). Learning ACT'],
    keywords: ['ACT', 'acceptance commitment therapy', 'psychological flexibility', 'values', 'mindfulness', 'cognitive defusion'],
    responseTemplate: 'For {user_input}, use ACT principles: help identify values, practice acceptance of difficult emotions, and commit to value-based actions despite discomfort.',
    skillLevel: 'Advanced',
    relatedTopics: ['Mindfulness', 'Values Clarification', 'Behavioral Change']
  },
  {
    id: 'family-systems-001',
    topic: 'Family Systems Therapy',
    category: 'Counseling Theories',
    description: 'Family systems approaches view problems within the context of family relationships and patterns. Key concepts include boundaries, subsystems, triangulation, and homeostasis. Includes structural (Minuchin), strategic (Haley), and Bowenian approaches.',
    example: 'Map family structure: "Who makes decisions in your family? How are boundaries maintained between parents and children?" Look for triangulation: "When your parents fight, what role do you typically play?"',
    reflectivePrompt: 'How does your own family-of-origin experience influence your understanding of family dynamics in therapy?',
    references: ['Minuchin, S. (1974). Families and Family Therapy', 'Bowen, M. (1978). Family Therapy in Clinical Practice'],
    keywords: ['family systems', 'structural therapy', 'strategic therapy', 'bowen', 'minuchin', 'boundaries', 'triangulation'],
    responseTemplate: 'For family issues in {user_input}, examine family structure, boundaries, communication patterns, and roles. Consider how the individual\'s symptoms serve the family system.',
    skillLevel: 'Advanced',
    relatedTopics: ['Family Therapy', 'Systems Theory', 'Relationship Dynamics']
  },
  {
    id: 'narrative-therapy-001',
    topic: 'Narrative Therapy',
    category: 'Counseling Theories',
    description: 'Developed by Michael White and David Epston, narrative therapy views people as separate from their problems. Uses externalization, unique outcomes, and re-authoring conversations to help clients rewrite their life stories and reclaim personal agency.',
    example: 'Externalize the problem: "How long has Depression been convincing you that you\'re worthless?" Find unique outcomes: "Tell me about a time when you didn\'t let Anxiety make decisions for you." Use scaling: "On a scale of 1-10, how much influence does the problem have today?"',
    reflectivePrompt: 'What dominant stories from your own life might influence how you understand and work with clients\' narratives?',
    references: ['White, M. (1990). Narrative Means to Therapeutic Ends', 'Freedman, J. (1996). Narrative Therapy'],
    keywords: ['narrative therapy', 'michael white', 'david epston', 'externalization', 'unique outcomes', 're-authoring'],
    responseTemplate: 'For {user_input}, use narrative techniques: externalize the problem, explore unique outcomes when the problem didn\'t dominate, and help re-author a preferred life story.',
    skillLevel: 'Advanced',
    relatedTopics: ['Externalization', 'Strength-Based Approach', 'Social Construction']
  },

  // LAC/LPC Exam Knowledge Base
  {
    id: 'lac-exam-001',
    topic: 'DSM-5-TR Diagnostic Criteria',
    category: 'LAC Exam Preparation',
    description: 'Understanding diagnostic criteria for major mental health disorders including mood disorders, anxiety disorders, trauma-related disorders, substance use disorders, and personality disorders. Includes differential diagnosis and cultural considerations.',
    example: 'Major Depressive Episode requires 5+ symptoms for 2+ weeks including depressed mood or anhedonia, plus significant impairment. Anxiety disorders differentiate by trigger (GAD=excessive worry, Social Anxiety=social situations, Panic Disorder=unexpected panic attacks).',
    reflectivePrompt: 'How do you ensure cultural factors are considered in your diagnostic assessments?',
    references: ['DSM-5-TR (2022)', 'Sue, D.W. (2019). Counseling the Culturally Diverse'],
    keywords: ['DSM-5', 'diagnosis', 'differential diagnosis', 'mood disorders', 'anxiety disorders', 'trauma', 'substance use', 'personality disorders'],
    responseTemplate: 'For diagnostic questions about {user_input}, consider DSM-5-TR criteria, differential diagnosis, cultural factors, and functional impairment.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Cultural Competence', 'Assessment', 'Mental Status Exam']
  },
  {
    id: 'lac-exam-002',
    topic: 'Developmental Psychology Across Lifespan',
    category: 'LAC Exam Preparation',
    description: 'Major developmental theories including Erikson\'s psychosocial stages, Piaget\'s cognitive development, attachment theory, and developmental tasks across infancy, childhood, adolescence, adulthood, and aging.',
    example: 'Erikson\'s stages: Trust vs Mistrust (infancy), Autonomy vs Shame (early childhood), Initiative vs Guilt (preschool), Industry vs Inferiority (school age), Identity vs Role Confusion (adolescence), Intimacy vs Isolation (young adult), Generativity vs Stagnation (middle age), Integrity vs Despair (late life).',
    reflectivePrompt: 'How do you assess whether a client is successfully navigating their current developmental stage?',
    references: ['Erikson, E. (1950). Childhood and Society', 'Bowlby, J. (1988). A Secure Base'],
    keywords: ['erikson', 'piaget', 'attachment theory', 'developmental stages', 'lifespan development', 'cognitive development'],
    responseTemplate: 'For developmental concerns in {user_input}, consider age-appropriate tasks, Erikson\'s stages, attachment patterns, and cognitive capacity.',
    skillLevel: 'Beginner',
    relatedTopics: ['Child Development', 'Attachment', 'Family Systems']
  },
  {
    id: 'lac-exam-003',
    topic: 'Group Counseling Theory and Practice',
    category: 'LAC Exam Preparation',
    description: 'Group dynamics, stages of group development (forming, storming, norming, performing, adjourning), therapeutic factors (universality, instillation of hope, imparting information), leadership styles, and group intervention techniques.',
    example: 'Yalom\'s therapeutic factors: Universality (not alone in struggles), Catharsis (emotional release), Interpersonal learning (feedback from others), Group cohesiveness (belonging). Tuckman\'s stages help predict group challenges and interventions.',
    reflectivePrompt: 'How do you handle resistance or conflict during the storming stage of group development?',
    references: ['Yalom, I. (2005). The Theory and Practice of Group Psychotherapy', 'Tuckman, B. (1965). Developmental Sequence in Small Groups'],
    keywords: ['group therapy', 'group dynamics', 'yalom', 'therapeutic factors', 'group stages', 'tuckman', 'group leadership'],
    responseTemplate: 'For group work with {user_input}, consider current group stage, therapeutic factors, member dynamics, and appropriate leadership interventions.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Group Leadership', 'Interpersonal Process', 'Conflict Resolution']
  },
  {
    id: 'lac-exam-004',
    topic: 'Research Methods and Statistics',
    category: 'LAC Exam Preparation',
    description: 'Understanding research designs (experimental, quasi-experimental, correlational, qualitative), statistical concepts (reliability, validity, significance testing, effect size), and evidence-based practice principles.',
    example: 'Reliability = consistency of measurement. Validity = measures what it claims to measure. Statistical significance (p < .05) indicates results unlikely due to chance. Effect size shows practical significance. RCTs provide strongest evidence for treatment efficacy.',
    reflectivePrompt: 'How do you evaluate the quality and applicability of research studies to your clinical practice?',
    references: ['Heppner, P.P. (2016). Research Design in Counseling', 'Lambert, M.J. (2013). Bergin and Garfield\'s Handbook of Psychotherapy'],
    keywords: ['research methods', 'statistics', 'evidence-based practice', 'reliability', 'validity', 'randomized controlled trial'],
    responseTemplate: 'For research questions about {user_input}, consider study design, statistical measures, clinical significance, and practice implications.',
    skillLevel: 'Advanced',
    relatedTopics: ['Evidence-Based Practice', 'Treatment Planning', 'Outcome Measurement']
  },
  {
    id: 'lac-exam-005',
    topic: 'Substance Use Disorders Assessment and Treatment',
    category: 'LAC Exam Preparation',
    description: 'DSM-5-TR substance use disorder criteria, stages of change model, motivational interviewing, twelve-step facilitation, cognitive-behavioral relapse prevention, and co-occurring disorders.',
    example: 'SUD severity: Mild (2-3 criteria), Moderate (4-5 criteria), Severe (6+ criteria). Stages of Change: Precontemplation, Contemplation, Preparation, Action, Maintenance. MI techniques: Open questions, Affirmations, Reflections, Summaries (OARS).',
    reflectivePrompt: 'How do you assess a client\'s readiness for change when working with substance use issues?',
    references: ['Miller, W.R. (2012). Motivational Interviewing', 'Marlatt, G.A. (2005). Relapse Prevention'],
    keywords: ['substance use disorders', 'motivational interviewing', 'stages of change', 'relapse prevention', 'co-occurring disorders'],
    responseTemplate: 'For substance use concerns in {user_input}, assess stage of change, use MI techniques, plan relapse prevention, and screen for co-occurring disorders.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Motivational Interviewing', 'Addiction Counseling', 'Dual Diagnosis']
  },

  // LPC Exam Advanced Knowledge
  {
    id: 'lpc-exam-001',
    topic: 'Advanced Psychopathology and Complex Cases',
    category: 'LPC Exam Preparation',
    description: 'Complex diagnostic presentations, comorbidity patterns, personality disorder assessment, severe mental illness, treatment-resistant cases, and risk assessment for self-harm and violence.',
    example: 'Borderline PD often co-occurs with mood disorders, PTSD, and substance use. Treatment requires specialized approaches like DBT. Assess for chronic suicidality vs acute risk. Consider trauma history, attachment disruption, and emotional dysregulation patterns.',
    reflectivePrompt: 'How do you balance validation and limits when working with clients with personality disorders?',
    references: ['Linehan, M.M. (2014). DBT Skills Training Manual', 'Paris, J. (2020). Treatment of Borderline Personality Disorder'],
    keywords: ['complex cases', 'comorbidity', 'personality disorders', 'treatment resistance', 'risk assessment', 'severe mental illness'],
    responseTemplate: 'For complex presentations like {user_input}, consider multiple diagnoses, trauma history, treatment adherence, and specialized interventions.',
    skillLevel: 'Advanced',
    relatedTopics: ['Risk Assessment', 'Complex Trauma', 'Treatment Planning']
  },
  {
    id: 'lpc-exam-002',
    topic: 'Supervision and Professional Development',
    category: 'LPC Exam Preparation',
    description: 'Supervision models (developmental, psychotherapy-based, social role), supervisory relationship dynamics, evaluation methods, professional identity development, and ethical issues in supervision.',
    example: 'Developmental model: Level 1 supervisees need structure and support, Level 2 need autonomy with guidance, Level 3 are autonomous with consultation. Address parallel process, countertransference, and professional growth.',
    reflectivePrompt: 'How do you balance support and challenge in your supervisory relationships?',
    references: ['Stoltenberg, C. (2016). Integrated Developmental Model', 'Bernard, J.M. (2018). Fundamentals of Clinical Supervision'],
    keywords: ['supervision models', 'professional development', 'supervisory relationship', 'parallel process', 'evaluation'],
    responseTemplate: 'For supervision issues with {user_input}, consider developmental level, supervisory model, relationship dynamics, and growth objectives.',
    skillLevel: 'Advanced',
    relatedTopics: ['Professional Identity', 'Clinical Skills Development', 'Ethical Decision Making']
  },
  {
    id: 'lpc-exam-003',
    topic: 'Program Evaluation and Quality Assurance',
    category: 'LPC Exam Preparation',
    description: 'Treatment outcome measurement, program evaluation methods, quality improvement initiatives, accreditation standards, and data-driven practice decisions.',
    example: 'Use validated outcome measures (PHQ-9, GAD-7, OQ-45) to track progress. Implement PDSA cycles (Plan-Do-Study-Act) for quality improvement. Monitor treatment fidelity and client satisfaction.',
    reflectivePrompt: 'How do you use outcome data to inform your treatment decisions and program improvements?',
    references: ['Lambert, M.J. (2010). Prevention of Treatment Failure', 'Chen, H.T. (2014). Practical Program Evaluation'],
    keywords: ['outcome measurement', 'program evaluation', 'quality improvement', 'data-driven practice', 'treatment fidelity'],
    responseTemplate: 'For evaluation questions about {user_input}, consider outcome measures, evaluation design, stakeholder needs, and improvement strategies.',
    skillLevel: 'Advanced',
    relatedTopics: ['Evidence-Based Practice', 'Outcome Research', 'Program Development']
  },
  {
    id: 'lpc-exam-004',
    topic: 'Advanced Ethical Decision Making',
    category: 'LPC Exam Preparation',
    description: 'Complex ethical dilemmas, decision-making models, multiple relationships, technology and social media issues, cultural considerations in ethics, and legal consultation processes.',
    example: 'Use ACA decision-making model: Identify problem, apply code, determine nature of dilemma, generate potential actions, consider consequences, choose course of action, implement and monitor. Consider stakeholders, cultural factors, and legal requirements.',
    reflectivePrompt: 'How do you navigate ethical dilemmas when professional codes conflict with client needs or cultural values?',
    references: ['ACA Code of Ethics (2014)', 'Welfel, E.R. (2015). Ethics in Counseling & Psychotherapy'],
    keywords: ['ethical decision making', 'multiple relationships', 'technology ethics', 'cultural ethics', 'legal consultation'],
    responseTemplate: 'For ethical concerns about {user_input}, apply decision-making model, consult codes and colleagues, consider cultural factors and legal requirements.',
    skillLevel: 'Advanced',
    relatedTopics: ['Professional Ethics', 'Cultural Competence', 'Legal Issues']
  },
  {
    id: 'lpc-exam-005',
    topic: 'Neurobiological Foundations of Mental Health',
    category: 'LPC Exam Preparation',
    description: 'Brain anatomy and function, neurotransmitter systems, neuroplasticity, trauma effects on brain development, psychopharmacology basics, and integration with psychotherapy.',
    example: 'Prefrontal cortex manages executive functions and emotional regulation. Amygdala processes threat and fear. Trauma can dysregulate HPA axis and affect memory consolidation. SSRIs increase serotonin availability, supporting mood regulation.',
    reflectivePrompt: 'How does understanding neurobiology enhance your therapeutic interventions and client psychoeducation?',
    references: ['Siegel, D.J. (2012). The Developing Mind', 'van der Kolk, B. (2014). The Body Keeps the Score'],
    keywords: ['neurobiology', 'brain anatomy', 'neurotransmitters', 'neuroplasticity', 'trauma and brain', 'psychopharmacology'],
    responseTemplate: 'For neurobiological aspects of {user_input}, consider brain regions involved, neurotransmitter systems, trauma effects, and medication interactions.',
    skillLevel: 'Advanced',
    relatedTopics: ['Trauma-Informed Care', 'Psychopharmacology', 'Mind-Body Integration']
  },

  // Professional Competencies
  {
    id: 'competency-001',
    topic: 'Clinical Assessment and Diagnosis',
    category: 'Professional Competencies',
    description: 'Comprehensive intake procedures, mental status examination, risk assessment protocols, diagnostic formulation, treatment planning integration, and ongoing assessment strategies.',
    example: 'Conduct structured intake covering presenting problem, history, mental status, risk factors, strengths, and cultural factors. Use multiple assessment methods (interview, observation, standardized measures) for comprehensive understanding.',
    reflectivePrompt: 'How do you ensure your assessments are culturally responsive and strengths-based?',
    references: ['Morrison, J. (2014). The First Interview', 'Hersen, M. (2004). Comprehensive Handbook of Psychological Assessment'],
    keywords: ['clinical assessment', 'intake procedures', 'mental status exam', 'diagnostic formulation', 'risk assessment'],
    responseTemplate: 'For assessment of {user_input}, use structured interview, mental status exam, risk screening, and cultural considerations.',
    skillLevel: 'Intermediate',
    relatedTopics: ['DSM-5 Diagnosis', 'Risk Assessment', 'Treatment Planning']
  },
  {
    id: 'lac-exam-006',
    topic: 'Psychological Testing and Assessment',
    category: 'LAC Exam Preparation',
    description: 'Psychological test administration, interpretation principles, psychometric properties, cognitive assessments (WAIS, WISC), personality tests (MMPI, PAI), and test selection criteria.',
    example: 'WAIS-IV measures four cognitive domains: Verbal Comprehension, Perceptual Reasoning, Working Memory, Processing Speed. MMPI-2 validity scales detect response patterns. Consider cultural bias, reading level, and appropriate norms when selecting tests.',
    reflectivePrompt: 'How do you ensure psychological assessments are culturally appropriate and accurately interpreted?',
    references: ['Groth-Marnat, G. (2016). Handbook of Psychological Assessment', 'Cohen, R.J. (2018). Psychological Testing and Assessment'],
    keywords: ['psychological testing', 'assessment', 'WAIS', 'WISC', 'MMPI', 'psychometrics', 'test interpretation'],
    responseTemplate: 'For assessment of {user_input}, select appropriate tests, consider cultural factors, examine validity scales, and integrate findings with clinical observations.',
    skillLevel: 'Advanced',
    relatedTopics: ['Cognitive Assessment', 'Personality Testing', 'Cultural Assessment']
  },
  {
    id: 'lac-exam-007',
    topic: 'Crisis Intervention and Suicide Assessment',
    category: 'LAC Exam Preparation',
    description: 'Crisis intervention models, suicide risk assessment protocols, safety planning, involuntary commitment procedures, trauma-informed crisis response, and postvention strategies.',
    example: 'Assess suicide risk using SAD PERSONS scale: Sex, Age, Depression, Previous attempts, Ethanol use, Rational thinking loss, Social support, Organized plan, No spouse, Serious illness. Develop safety plan with coping strategies, support contacts, and crisis resources.',
    reflectivePrompt: 'How do you balance client autonomy with duty to protect when assessing suicide risk?',
    references: ['Jobes, D.A. (2016). Managing Suicidal Risk', 'Roberts, A.R. (2005). Crisis Intervention Handbook'],
    keywords: ['crisis intervention', 'suicide assessment', 'risk factors', 'safety planning', 'involuntary commitment', 'postvention'],
    responseTemplate: 'For crisis situations involving {user_input}, assess immediate risk, develop safety plan, utilize support systems, and follow legal/ethical protocols.',
    skillLevel: 'Advanced',
    relatedTopics: ['Risk Assessment', 'Safety Planning', 'Legal Issues']
  },
  {
    id: 'lac-exam-008',
    topic: 'Child and Adolescent Development and Therapy',
    category: 'LAC Exam Preparation',
    description: 'Developmental milestones, attachment patterns, child psychopathology, play therapy techniques, family involvement, school consultation, and trauma-informed care for minors.',
    example: 'Use play therapy for ages 3-12: toys as language, process through play rather than talking. Adolescents need autonomy balance with structure. Consider family dynamics, peer influence, and academic functioning in treatment planning.',
    reflectivePrompt: 'How do you adapt therapeutic techniques to be developmentally appropriate for different age groups?',
    references: ['Landreth, G.L. (2012). Play Therapy: The Art of the Relationship', 'Barkley, R.A. (2013). Taking Charge of ADHD'],
    keywords: ['child therapy', 'adolescent therapy', 'play therapy', 'developmental milestones', 'family involvement', 'school consultation'],
    responseTemplate: 'For work with {user_input} age clients, use developmentally appropriate interventions, involve family/school, and consider attachment and trauma history.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Developmental Psychology', 'Family Systems', 'Trauma-Informed Care']
  },
  {
    id: 'lpc-exam-006',
    topic: 'Advanced Trauma and PTSD Treatment',
    category: 'LPC Exam Preparation',
    description: 'Complex trauma presentations, evidence-based trauma treatments (EMDR, CPT, PE), trauma-informed care principles, vicarious trauma prevention, and cultural considerations in trauma work.',
    example: 'Complex PTSD includes emotional dysregulation, negative self-concept, and interpersonal difficulties beyond PTSD criteria. EMDR uses bilateral stimulation for memory processing. Trauma-informed care emphasizes safety, trustworthiness, collaboration, and choice.',
    reflectivePrompt: 'How do you maintain your own emotional well-being when working intensively with trauma survivors?',
    references: ['van der Kolk, B. (2014). The Body Keeps the Score', 'Shapiro, F. (2001). Eye Movement Desensitization and Reprocessing'],
    keywords: ['complex trauma', 'PTSD', 'EMDR', 'trauma-informed care', 'vicarious trauma', 'evidence-based trauma treatment'],
    responseTemplate: 'For trauma presentations like {user_input}, use trauma-informed approach, consider evidence-based treatments, assess for complex trauma, and monitor your own well-being.',
    skillLevel: 'Advanced',
    relatedTopics: ['PTSD Treatment', 'Self-Care', 'Evidence-Based Practice']
  },
  {
    id: 'lpc-exam-007',
    topic: 'Multicultural Counseling Competencies',
    category: 'LPC Exam Preparation',
    description: 'Cultural identity development models, microaggressions, privilege and oppression dynamics, culturally adapted interventions, language considerations, and social justice advocacy.',
    example: 'Sue\'s tripartite model: awareness of own cultural values/biases, understanding client\'s worldview, developing culturally appropriate strategies. Address microaggressions, power dynamics, and systemic barriers affecting client functioning.',
    reflectivePrompt: 'How do you continuously develop your cultural competence and address your own biases in therapy?',
    references: ['Sue, D.W. (2019). Counseling the Culturally Diverse', 'Ratts, M.J. (2016). ACA Multicultural and Social Justice Counseling Competencies'],
    keywords: ['multicultural counseling', 'cultural competence', 'microaggressions', 'privilege', 'oppression', 'social justice', 'advocacy'],
    responseTemplate: 'For culturally diverse clients like {user_input}, examine cultural factors, address power dynamics, adapt interventions culturally, and consider advocacy needs.',
    skillLevel: 'Advanced',
    relatedTopics: ['Cultural Identity', 'Social Justice', 'Advocacy']
  },
  {
    id: 'lpc-exam-008',
    topic: 'Couples and Family Therapy Advanced Techniques',
    category: 'LPC Exam Preparation',
    description: 'Gottman Method, Emotionally Focused Therapy (EFT), structural family therapy techniques, intergenerational patterns, affair recovery, and divorce/separation counseling.',
    example: 'Gottman\'s Four Horsemen: criticism, contempt, defensiveness, stonewalling predict relationship failure. EFT focuses on attachment bonds and emotional accessibility. Structural therapy examines boundaries, hierarchies, and subsystems.',
    reflectivePrompt: 'How do you maintain neutrality while addressing individual needs within couple and family systems?',
    references: ['Gottman, J. (1999). The Marriage Clinic', 'Johnson, S. (2019). Attachment in Psychotherapy'],
    keywords: ['couples therapy', 'family therapy', 'gottman method', 'EFT', 'structural therapy', 'relationship dynamics'],
    responseTemplate: 'For relationship issues in {user_input}, assess attachment patterns, communication dynamics, family structure, and appropriate therapeutic approach.',
    skillLevel: 'Advanced',
    relatedTopics: ['Attachment Theory', 'Communication Skills', 'Family Systems']
  },
  {
    id: 'professional-development-001',
    topic: 'Continuing Education and Lifelong Learning',
    category: 'Professional Development',
    description: 'CE requirements, professional development planning, specialty certifications, conference participation, professional writing, and staying current with research.',
    example: 'Most states require 20-40 CE hours annually. Develop learning plans targeting skill gaps. Consider specialized training in trauma, addiction, or specific populations. Engage in professional organizations and peer consultation.',
    reflectivePrompt: 'How do you identify and address your professional development needs throughout your career?',
    references: ['ACA (2014). Code of Ethics Section C', 'Falender, C.A. (2004). Clinical Supervision'],
    keywords: ['continuing education', 'professional development', 'certification', 'lifelong learning', 'specialization'],
    responseTemplate: 'For professional growth in {user_input}, assess current competencies, identify learning needs, plan CE activities, and seek supervision/consultation.',
    skillLevel: 'Beginner',
    relatedTopics: ['Professional Identity', 'Specialization', 'Career Development']
  },
  {
    id: 'lac-exam-009',
    topic: 'Legal and Ethical Foundations',
    category: 'LAC Exam Preparation',
    description: 'ACA Code of Ethics, state licensing laws, confidentiality and privilege, informed consent, duty to warn, mandated reporting, documentation requirements, and malpractice prevention.',
    example: 'Tarasoff duty requires warning identifiable victims of serious threats. Mandated reporting applies to child/elder abuse, dependent adult abuse. Confidentiality has exceptions: danger to self/others, court orders, client waives privilege.',
    reflectivePrompt: 'How do you balance client confidentiality with legal and ethical obligations to protect others?',
    references: ['ACA Code of Ethics (2014)', 'Wheeler, A.M. (2018). The Licensed Professional Counselor\'s Guide to Law and Ethics'],
    keywords: ['ethics', 'legal issues', 'confidentiality', 'duty to warn', 'mandated reporting', 'informed consent', 'documentation'],
    responseTemplate: 'For ethical/legal concerns about {user_input}, consult ACA Code, state laws, consider confidentiality limits, document decisions, and seek consultation.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Professional Ethics', 'Legal Compliance', 'Risk Management']
  },
  {
    id: 'lac-exam-010',
    topic: 'Career Development and Vocational Psychology',
    category: 'LAC Exam Preparation',
    description: 'Career development theories (Super, Holland, Krumboltz), career assessment tools, work-life balance, career transitions, unemployment counseling, and vocational rehabilitation.',
    example: 'Holland\'s RIASEC model: Realistic, Investigative, Artistic, Social, Enterprising, Conventional. Super\'s lifespan theory includes growth, exploration, establishment, maintenance, decline stages. Use Strong Interest Inventory, Myers-Briggs for assessment.',
    reflectivePrompt: 'How do you help clients navigate career decisions that align with their values, interests, and life circumstances?',
    references: ['Zunker, V.G. (2016). Career Counseling: A Holistic Approach', 'Brown, D. (2016). Career Information, Career Counseling, and Career Development'],
    keywords: ['career development', 'holland theory', 'super theory', 'career assessment', 'vocational counseling', 'work-life balance'],
    responseTemplate: 'For career issues in {user_input}, assess interests/values, explore career theories, use appropriate assessments, and consider life stage factors.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Assessment', 'Life Transitions', 'Decision Making']
  },
  {
    id: 'lpc-exam-009',
    topic: 'Advanced Psychopharmacology for Counselors',
    category: 'LPC Exam Preparation',
    description: 'Medication classes, side effects, drug interactions, collaboration with prescribers, medication compliance issues, and psychotherapy integration with pharmacotherapy.',
    example: 'SSRIs (sertraline, fluoxetine) for depression/anxiety, may cause sexual side effects, weight gain. Benzodiazepines for acute anxiety but risk dependence. Mood stabilizers (lithium, lamotrigine) for bipolar disorder require monitoring.',
    reflectivePrompt: 'How do you collaborate effectively with psychiatrists and monitor medication effects in your therapeutic work?',
    references: ['Preston, J.D. (2017). Handbook of Clinical Psychopharmacology for Therapists', 'Gitlin, M.J. (2014). The Psychiatrist\'s Guide to Psychopharmacology'],
    keywords: ['psychopharmacology', 'medication', 'SSRIs', 'antipsychotics', 'mood stabilizers', 'side effects', 'collaboration'],
    responseTemplate: 'For medication-related concerns in {user_input}, assess current medications, monitor side effects, coordinate with prescriber, and integrate with therapy.',
    skillLevel: 'Advanced',
    relatedTopics: ['Medical Collaboration', 'Treatment Integration', 'Medication Compliance']
  },
  {
    id: 'lpc-exam-010',
    topic: 'Eating Disorders and Body Image',
    category: 'LPC Exam Preparation',
    description: 'Anorexia nervosa, bulimia nervosa, binge eating disorder, ARFID, treatment approaches, medical complications, family-based treatment, and recovery-oriented care.',
    example: 'Anorexia has highest mortality rate of mental health disorders. Treatment requires medical stabilization, nutritional rehabilitation, therapy addressing underlying issues. Family-Based Treatment (FBT) effective for adolescents.',
    reflectivePrompt: 'How do you address the complex medical, psychological, and family dynamics in eating disorder treatment?',
    references: ['Fairburn, C.G. (2008). Cognitive Behavior Therapy and Eating Disorders', 'Lock, J. (2015). Family-Based Treatment of Eating Disorders'],
    keywords: ['eating disorders', 'anorexia', 'bulimia', 'binge eating', 'body image', 'family-based treatment', 'medical complications'],
    responseTemplate: 'For eating disorder presentations like {user_input}, assess medical stability, coordinate care team, address underlying issues, and involve family when appropriate.',
    skillLevel: 'Advanced',
    relatedTopics: ['Medical Collaboration', 'Family Therapy', 'Body Image']
  },
  {
    id: 'specialized-001',
    topic: 'LGBTQ+ Affirmative Therapy',
    category: 'Specialized Populations',
    description: 'Sexual orientation and gender identity development, minority stress theory, affirmative therapy principles, transition-related care, family acceptance, and advocacy considerations.',
    example: 'Minority stress includes distal stressors (discrimination, violence) and proximal stressors (internalized homophobia, concealment). Affirmative therapy validates identity, addresses minority stress, and supports authentic living.',
    reflectivePrompt: 'How do you create an inclusive therapeutic environment for LGBTQ+ clients and address your own biases?',
    references: ['APA (2015). Guidelines for Psychological Practice with Transgender and Gender Nonconforming People', 'Pachankis, J.E. (2015). The Scientific Pursuit of Sexual and Gender Minority Mental Health'],
    keywords: ['LGBTQ+', 'affirmative therapy', 'minority stress', 'gender identity', 'sexual orientation', 'discrimination', 'advocacy'],
    responseTemplate: 'For LGBTQ+ clients like {user_input}, use affirmative approach, address minority stress, validate identity, and consider family/social support needs.',
    skillLevel: 'Advanced',
    relatedTopics: ['Minority Stress', 'Identity Development', 'Social Justice']
  },
  {
    id: 'specialized-002',
    topic: 'Geriatric Mental Health',
    category: 'Specialized Populations',
    description: 'Late-life depression, anxiety, dementia-related behavioral changes, grief and loss, end-of-life issues, family caregiver support, and adaptation to aging.',
    example: 'Late-life depression often presents with somatic complaints, cognitive symptoms. Grief in aging includes multiple losses: health, independence, friends. Dementia creates unique family dynamics and ethical considerations.',
    reflectivePrompt: 'How do you adapt therapeutic approaches for older adults while maintaining dignity and autonomy?',
    references: ['Knight, B.G. (2004). Psychotherapy with Older Adults', 'Laidlaw, K. (2015). CBT for Older People'],
    keywords: ['geriatric', 'aging', 'late-life depression', 'dementia', 'grief and loss', 'caregiver support', 'end-of-life'],
    responseTemplate: 'For older adult concerns like {user_input}, consider age-related factors, multiple losses, family dynamics, and adaptation challenges.',
    skillLevel: 'Advanced',
    relatedTopics: ['Life Transitions', 'Grief Counseling', 'Family Support']
  },

  // Best Counseling Practices
  {
    id: 'alliance-001',
    topic: 'Therapeutic Alliance',
    category: 'Best Practices',
    description: 'The collaborative relationship between counselor and client, involving mutual respect, trust, and shared goals. Meta-analyses show alliance strength predicts therapeutic outcomes.',
    example: 'Build alliance by asking "How does it feel to talk about this?" and validating emotions: "That sounds really difficult to experience."',
    reflectivePrompt: 'What personal qualities help you build trust with others in your everyday relationships?',
    references: ['Horvath, A. O. (1991). The alliance in adult psychotherapy', 'Bordin, E. S. (1979). The generalizability of the psychoanalytic concept'],
    keywords: ['therapeutic alliance', 'rapport', 'trust', 'collaboration', 'relationship'],
    responseTemplate: 'To strengthen alliance around {user_input}, validate emotions and collaborate on goals. Ask how the client feels about discussing this topic.',
    skillLevel: 'Beginner',
    relatedTopics: ['Core Skills', 'Empathy', 'Active Listening']
  },
  {
    id: 'core-skills-001',
    topic: 'Core Counseling Skills',
    category: 'Best Practices',
    description: 'Essential skills include active listening, paraphrasing, reflection of feelings, open-ended questions, and summarization. These form the foundation of effective counseling.',
    example: 'Use reflection: "You feel overwhelmed by work demands" followed by open-ended question: "What would help you feel more in control?"',
    reflectivePrompt: 'Which core skill comes most naturally to you, and which needs more practice?',
    references: ['Ivey, A. E. (2010). Intentional Interviewing and Counseling', 'Egan, G. (2014). The Skilled Helper'],
    keywords: ['active listening', 'paraphrasing', 'reflection', 'open-ended questions', 'summarization'],
    responseTemplate: 'For {user_input}, practice active listening and reflection. Try paraphrasing what you heard and asking an open-ended follow-up question.',
    skillLevel: 'Beginner',
    relatedTopics: ['Therapeutic Alliance', 'Communication', 'Microskills']
  },
  {
    id: 'session-structure-001',
    topic: 'Session Structure',
    category: 'Best Practices',
    description: 'Effective sessions have clear beginning (check-in, agenda), middle (exploration, intervention), and end (summary, homework, scheduling). Maintain consistent 50-minute format.',
    example: 'Start with "How has your week been since we last met?" and end with "What stood out most from today\'s session?" and assign specific homework.',
    reflectivePrompt: 'How do you naturally structure conversations to make them productive and meaningful?',
    references: ['Sommers-Flanagan, J. (2018). Counseling and Psychotherapy Theories', 'Young, M. E. (2017). Learning the Art of Helping'],
    keywords: ['session structure', 'agenda', 'homework', 'check-in', 'summary'],
    responseTemplate: 'Structure sessions around {user_input} with clear opening, focused middle work, and summarizing closure. Assign relevant between-session tasks.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Time Management', 'Goal Setting', 'Treatment Planning']
  },

  // Cultural Competence
  {
    id: 'cultural-humility-001',
    topic: 'Cultural Humility',
    category: 'Cultural Competence',
    description: 'Lifelong commitment to self-evaluation, learning about others\' cultures, and addressing power imbalances. Goes beyond cultural competence to ongoing growth.',
    example: 'Ask "How does your cultural background influence your perspective on this issue?" and reflect on your own cultural assumptions in supervision.',
    reflectivePrompt: 'What assumptions about other cultures do you need to examine in yourself?',
    references: ['Hook, J. N. (2013). Cultural humility', 'Tervalon, M. (1998). Cultural humility versus cultural competence'],
    keywords: ['cultural humility', 'diversity', 'power dynamics', 'self-evaluation', 'lifelong learning'],
    responseTemplate: 'Approach {user_input} with cultural humility by asking about cultural influences and examining your own assumptions. Seek consultation if needed.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Multicultural Counseling', 'Self-Awareness', 'Supervision']
  },
  {
    id: 'microaggressions-001',
    topic: 'Microaggressions',
    category: 'Cultural Competence',
    description: 'Subtle, often unintentional discriminatory comments or actions toward marginalized groups. Important to recognize, address, and prevent in therapeutic relationships.',
    example: 'Avoid assumptions like "You\'re so articulate" to a person of color. If you make a mistake, acknowledge it: "I realize that comment was insensitive. I\'m sorry."',
    reflectivePrompt: 'What microaggressions might you unconsciously commit, and how can you become more aware?',
    references: ['Sue, D. W. (2007). Racial microaggressions in everyday life', 'Pierce, C. (1970). Offensive mechanisms'],
    keywords: ['microaggressions', 'discrimination', 'bias', 'marginalized groups', 'awareness'],
    responseTemplate: 'Address {user_input} by recognizing potential microaggressions, taking responsibility for mistakes, and creating safer spaces for marginalized clients.',
    skillLevel: 'Advanced',
    relatedTopics: ['Cultural Humility', 'Social Justice', 'Therapeutic Alliance']
  },

  // Ethics and Legal
  {
    id: 'confidentiality-001',
    topic: 'Confidentiality',
    category: 'Ethics and Legal',
    description: 'Fundamental ethical principle protecting client information. Exceptions include harm to self/others, child/elder abuse, court orders. Must be explained in informed consent.',
    example: 'Explain limits: "What we discuss is confidential, except if you\'re in danger of harming yourself or others, or if there\'s abuse of a minor or elderly person."',
    reflectivePrompt: 'How do you balance respecting client privacy with legal and ethical obligations?',
    references: ['ACA Code of Ethics (2014)', 'HIPAA Privacy Rule', 'Tarasoff v. Regents (1976)'],
    keywords: ['confidentiality', 'privacy', 'duty to warn', 'informed consent', 'limits'],
    responseTemplate: 'For {user_input}, maintain confidentiality while recognizing legal exceptions. Document any mandatory reporting and consult supervision.',
    skillLevel: 'Beginner',
    relatedTopics: ['Informed Consent', 'Crisis Intervention', 'Documentation']
  },
  {
    id: 'dual-relationships-001',
    topic: 'Dual Relationships',
    category: 'Ethics and Legal',
    description: 'Avoid multiple relationships that could impair professional judgment or exploit clients. Includes romantic, business, or close personal relationships.',
    example: 'Decline social media friend requests from clients and refer them elsewhere if you have pre-existing relationships. Maintain clear boundaries.',
    reflectivePrompt: 'How do you maintain appropriate boundaries while still being warm and genuine?',
    references: ['ACA Code of Ethics A.5', 'Zur, O. (2007). Boundaries in Psychotherapy'],
    keywords: ['dual relationships', 'boundaries', 'exploitation', 'professional judgment', 'ethics'],
    responseTemplate: 'Avoid dual relationships in {user_input} by maintaining clear boundaries, referring when conflicts exist, and consulting supervision about gray areas.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Professional Boundaries', 'Ethics', 'Supervision']
  },

  // Crisis Intervention
  {
    id: 'suicide-assessment-001',
    topic: 'Suicide Risk Assessment',
    category: 'Crisis Intervention',
    description: 'Systematic evaluation of suicide risk using direct questions about ideation, plan, means, and intent. Essential skill for all counselors.',
    example: 'Ask directly: "Are you having thoughts of ending your life?" Follow up with "Do you have a plan?" and "Do you have access to means?" Assess timeline and intent.',
    reflectivePrompt: 'How comfortable are you asking direct questions about suicide? What support do you need?',
    references: ['SAMHSA TIP 57 (2014)', 'Jobes, D. A. (2006). Managing Suicidal Risk', 'Columbia Suicide Severity Rating Scale'],
    keywords: ['suicide', 'risk assessment', 'ideation', 'plan', 'means', 'intent'],
    responseTemplate: 'For suicide risk in {user_input}, ask direct questions about ideation, plan, and means. Assess immediate safety and follow protocols for high-risk situations.',
    skillLevel: 'Advanced',
    relatedTopics: ['Crisis Intervention', 'Safety Planning', 'Documentation']
  },
  {
    id: 'safety-planning-001',
    topic: 'Safety Planning',
    category: 'Crisis Intervention',
    description: 'Collaborative development of personalized plan to help clients stay safe during suicidal crises. Includes coping strategies, support people, and emergency contacts.',
    example: 'Create written plan: "When I feel suicidal, I will: 1) Use breathing exercises, 2) Call my sister, 3) Go to ER if needed. Remove guns from home."',
    reflectivePrompt: 'How can you help clients identify their unique warning signs and coping strategies?',
    references: ['Stanley, B. (2012). Safety Plan Treatment Manual', 'Bryan, C. J. (2017). Rethinking suicide'],
    keywords: ['safety planning', 'coping strategies', 'support system', 'warning signs', 'crisis'],
    responseTemplate: 'Develop safety plan for {user_input} including warning signs, coping strategies, support people, and emergency contacts. Make it specific and actionable.',
    skillLevel: 'Advanced',
    relatedTopics: ['Suicide Assessment', 'Crisis Intervention', 'Support Systems']
  },

  // Self-Care and Professional Development
  {
    id: 'burnout-prevention-001',
    topic: 'Burnout Prevention',
    category: 'Self-Care',
    description: 'Burnout involves emotional exhaustion, depersonalization, and reduced sense of accomplishment. Prevention includes self-care, supervision, and workload management.',
    example: 'Set boundaries: "I will not check work email after 7 PM." Practice self-care: "I will exercise 30 minutes daily and attend monthly supervision."',
    reflectivePrompt: 'What early warning signs of burnout do you notice in yourself, and what helps you recharge?',
    references: ['Maslach, C. (1982). Burnout: The Cost of Caring', 'Skovholt, T. M. (2016). The Resilient Practitioner'],
    keywords: ['burnout', 'self-care', 'boundaries', 'emotional exhaustion', 'prevention'],
    responseTemplate: 'Address burnout in {user_input} by setting boundaries, practicing regular self-care, and seeking supervision. Monitor warning signs consistently.',
    skillLevel: 'Beginner',
    relatedTopics: ['Self-Care', 'Professional Boundaries', 'Supervision']
  },
  {
    id: 'supervision-best-practices-001',
    topic: 'Clinical Supervision',
    category: 'Professional Development',
    description: 'Regular supervision essential for skill development, ethical practice, and client welfare. Should include case review, skill building, and personal/professional growth.',
    example: 'Prepare for supervision: "I want to discuss my anxiety client, my use of CBT techniques, and my countertransference feelings with difficult clients."',
    reflectivePrompt: 'How do you make the most of supervision time to grow as a counselor?',
    references: ['Borders, L. D. (2014). Best practices in clinical supervision', 'Bernard, J. M. (2014). Fundamentals of Clinical Supervision'],
    keywords: ['supervision', 'professional development', 'skill building', 'ethics', 'growth'],
    responseTemplate: 'Use supervision for {user_input} by preparing specific cases, identifying learning goals, and being open to feedback. Take notes and follow up.',
    skillLevel: 'Beginner',
    relatedTopics: ['Professional Development', 'Skill Development', 'Ethics']
  },

  // Technology and Telehealth
  {
    id: 'telehealth-best-practices-001',
    topic: 'Telehealth Best Practices',
    category: 'Technology',
    description: 'Remote counseling requires HIPAA-compliant platforms, informed consent about technology risks, and attention to therapeutic relationship nuances.',
    example: 'Use secure platforms like Doxy.me, test technology beforehand, ensure private space, and address how to handle technical difficulties during sessions.',
    reflectivePrompt: 'How does providing therapy via technology affect your ability to connect with clients?',
    references: ['APA Guidelines for Telepsychology (2013)', 'ACES Guidelines for Online Learning (2011)'],
    keywords: ['telehealth', 'technology', 'HIPAA', 'remote therapy', 'online counseling'],
    responseTemplate: 'For telehealth in {user_input}, ensure HIPAA compliance, test technology, obtain specific consent, and adapt techniques for virtual format.',
    skillLevel: 'Intermediate',
    relatedTopics: ['Ethics', 'Technology', 'Therapeutic Alliance']
  }
];

/**
 * Search function to find relevant counseling entries based on user input
 */
export function searchCounselingDataset(query: string, category?: string): CounselingEntry[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  return counselingDataset.filter(entry => {
    // Filter by category if specified
    if (category && entry.category !== category) return false;
    
    // Search in keywords, topic, and description
    const searchableText = [
      entry.topic,
      entry.description,
      ...entry.keywords,
      ...entry.relatedTopics
    ].join(' ').toLowerCase();
    
    // Return true if any search term is found
    return searchTerms.some(term => searchableText.includes(term));
  }).slice(0, 3); // Return top 3 matches
}

/**
 * Get response template for fallback when AI API is unavailable
 */
export function getCounselingResponse(userInput: string): string {
  const matches = searchCounselingDataset(userInput);
  
  if (matches.length === 0) {
    return "I understand you're asking about counseling. While I'm having trouble accessing my full knowledge base right now, I'd recommend consulting your supervisor or reviewing the ACA Code of Ethics for guidance. Is there a specific area of counseling you'd like to explore?";
  }
  
  const bestMatch = matches[0];
  return bestMatch.responseTemplate.replace('{user_input}', userInput).replace('{reflective_prompt}', bestMatch.reflectivePrompt);
}

/**
 * Get categories for browsing
 */
export function getCounselingCategories(): string[] {
  const categories = counselingDataset.map(entry => entry.category);
  return Array.from(new Set(categories));
}