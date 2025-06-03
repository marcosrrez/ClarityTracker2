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