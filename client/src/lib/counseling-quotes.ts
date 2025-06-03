/**
 * Counseling Theory Quotes for Loading States
 * Educational content to display during processing times
 */

export interface CounselingQuote {
  id: string;
  quote: string;
  author: string;
  theory: string;
  context: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export const counselingQuotes: CounselingQuote[] = [
  {
    id: 'perls-001',
    quote: "I am not in this world to live up to your expectations, and you are not in this world to live up to mine.",
    author: "Fritz Perls",
    theory: "Gestalt Therapy",
    context: ['boundaries', 'self-acceptance', 'authenticity'],
    skillLevel: 'intermediate'
  },
  {
    id: 'rogers-001',
    quote: "The curious paradox is that when I accept myself just as I am, then I can change.",
    author: "Carl Rogers",
    theory: "Person-Centered Therapy",
    context: ['self-acceptance', 'therapeutic change', 'unconditional positive regard'],
    skillLevel: 'beginner'
  },
  {
    id: 'vanderkolk-001',
    quote: "The greatest sources of our suffering are the lies we tell ourselves.",
    author: "Bessel van der Kolk",
    theory: "Trauma-Informed Care",
    context: ['trauma', 'self-awareness', 'recovery'],
    skillLevel: 'intermediate'
  },
  {
    id: 'linehan-001',
    quote: "A life worth living is a life worth living even if it involves pain.",
    author: "Marsha Linehan",
    theory: "Dialectical Behavior Therapy",
    context: ['distress tolerance', 'emotional regulation', 'acceptance'],
    skillLevel: 'advanced'
  },
  {
    id: 'yalom-001',
    quote: "The relationship between therapist and patient is the crucible in which all therapeutic change occurs.",
    author: "Irvin Yalom",
    theory: "Existential Therapy",
    context: ['therapeutic alliance', 'relationship', 'process'],
    skillLevel: 'intermediate'
  },
  {
    id: 'beck-001',
    quote: "The way we think determines how we feel and behave.",
    author: "Aaron Beck",
    theory: "Cognitive Behavioral Therapy",
    context: ['cognitive restructuring', 'thoughts and feelings', 'behavioral change'],
    skillLevel: 'beginner'
  },
  {
    id: 'bowlby-001',
    quote: "What cannot be communicated to the mother cannot be communicated to the self.",
    author: "John Bowlby",
    theory: "Attachment Theory",
    context: ['attachment', 'communication', 'self-understanding'],
    skillLevel: 'advanced'
  },
  {
    id: 'frankl-001',
    quote: "Everything can be taken from a man but one thing: the last of the human freedoms—to choose one's attitude in any given set of circumstances.",
    author: "Viktor Frankl",
    theory: "Logotherapy",
    context: ['meaning', 'resilience', 'choice'],
    skillLevel: 'intermediate'
  },
  {
    id: 'miller-001',
    quote: "People are generally better persuaded by the reasons they discovered themselves than by those which have occurred to others.",
    author: "William Miller",
    theory: "Motivational Interviewing",
    context: ['motivation', 'client autonomy', 'change process'],
    skillLevel: 'intermediate'
  },
  {
    id: 'bowen-001',
    quote: "The basic building block of any emotional system is the triangle.",
    author: "Murray Bowen",
    theory: "Family Systems Theory",
    context: ['family dynamics', 'triangulation', 'systems thinking'],
    skillLevel: 'advanced'
  },
  {
    id: 'gottman-001',
    quote: "Happy couples argue, but they argue well.",
    author: "John Gottman",
    theory: "Gottman Method",
    context: ['relationship dynamics', 'conflict resolution', 'communication'],
    skillLevel: 'intermediate'
  },
  {
    id: 'white-001',
    quote: "The person is not the problem; the problem is the problem.",
    author: "Michael White",
    theory: "Narrative Therapy",
    context: ['externalization', 'problem solving', 'identity'],
    skillLevel: 'advanced'
  },
  {
    id: 'minuchin-001',
    quote: "A family is a system that operates through transactional patterns.",
    author: "Salvador Minuchin",
    theory: "Structural Family Therapy",
    context: ['family structure', 'boundaries', 'hierarchy'],
    skillLevel: 'advanced'
  },
  {
    id: 'hayes-001',
    quote: "The goal is not to feel better; the goal is to get better at feeling.",
    author: "Steven Hayes",
    theory: "Acceptance and Commitment Therapy",
    context: ['psychological flexibility', 'emotional acceptance', 'mindfulness'],
    skillLevel: 'advanced'
  },
  {
    id: 'erikson-001',
    quote: "The richest and fullest lives attempt to achieve an inner balance between three realms: work, love, and play.",
    author: "Erik Erikson",
    theory: "Psychosocial Development",
    context: ['life balance', 'development', 'well-being'],
    skillLevel: 'beginner'
  },
  {
    id: 'siegel-001',
    quote: "The mind is both embodied and relational.",
    author: "Daniel Siegel",
    theory: "Interpersonal Neurobiology",
    context: ['mind-body connection', 'relationships', 'neuroscience'],
    skillLevel: 'advanced'
  },
  {
    id: 'kabatzinn-001',
    quote: "Wherever you go, there you are.",
    author: "Jon Kabat-Zinn",
    theory: "Mindfulness-Based Interventions",
    context: ['mindfulness', 'present moment', 'awareness'],
    skillLevel: 'beginner'
  },
  {
    id: 'sue-001',
    quote: "Cultural competence is not a destination, but a lifelong journey of learning.",
    author: "Derald Wing Sue",
    theory: "Multicultural Counseling",
    context: ['cultural competence', 'diversity', 'ongoing learning'],
    skillLevel: 'intermediate'
  },
  {
    id: 'shapiro-001',
    quote: "The past is past, but if it's not processed, it's not past.",
    author: "Francine Shapiro",
    theory: "EMDR",
    context: ['trauma processing', 'memory', 'healing'],
    skillLevel: 'advanced'
  },
  {
    id: 'lambert-001',
    quote: "The therapeutic relationship accounts for more change than any specific technique.",
    author: "Michael Lambert",
    theory: "Common Factors",
    context: ['therapeutic alliance', 'evidence-based practice', 'relationship'],
    skillLevel: 'intermediate'
  },
  {
    id: 'prochaska-001',
    quote: "Change is a process, not an event.",
    author: "James Prochaska",
    theory: "Stages of Change",
    context: ['behavior change', 'motivation', 'process'],
    skillLevel: 'beginner'
  },
  {
    id: 'jung-001',
    quote: "Who looks outside, dreams; who looks inside, awakens.",
    author: "Carl Jung",
    theory: "Analytical Psychology",
    context: ['self-awareness', 'inner work', 'consciousness'],
    skillLevel: 'advanced'
  },
  {
    id: 'burns-001',
    quote: "Perfectionism is the ultimate self-defeat because the goal is unattainable.",
    author: "David Burns",
    theory: "Cognitive Behavioral Therapy",
    context: ['perfectionism', 'cognitive distortions', 'self-compassion'],
    skillLevel: 'intermediate'
  },
  {
    id: 'johnson-001',
    quote: "We are designed to lean into one another.",
    author: "Sue Johnson",
    theory: "Emotionally Focused Therapy",
    context: ['attachment', 'relationships', 'connection'],
    skillLevel: 'intermediate'
  },
  {
    id: 'koenig-001',
    quote: "Spirituality is the aspect of humanity that refers to the way individuals seek and express meaning and purpose.",
    author: "Harold Koenig",
    theory: "Spiritual Integration",
    context: ['spirituality', 'meaning', 'purpose'],
    skillLevel: 'intermediate'
  }
];

/**
 * Get a random quote, optionally filtered by context or skill level
 */
export function getRandomQuote(
  context?: string[],
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
): CounselingQuote {
  let filteredQuotes = counselingQuotes;

  if (context && context.length > 0) {
    filteredQuotes = counselingQuotes.filter(quote =>
      quote.context.some(ctx => context.includes(ctx))
    );
  }

  if (skillLevel) {
    filteredQuotes = filteredQuotes.filter(quote => quote.skillLevel === skillLevel);
  }

  // Fallback to all quotes if no matches
  if (filteredQuotes.length === 0) {
    filteredQuotes = counselingQuotes;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  return filteredQuotes[randomIndex];
}

/**
 * Get quotes by theory for educational browsing
 */
export function getQuotesByTheory(theory: string): CounselingQuote[] {
  return counselingQuotes.filter(quote => 
    quote.theory.toLowerCase().includes(theory.toLowerCase())
  );
}

/**
 * Get all unique theories represented in quotes
 */
export function getAllTheories(): string[] {
  const uniqueTheories: string[] = [];
  counselingQuotes.forEach(quote => {
    if (!uniqueTheories.includes(quote.theory)) {
      uniqueTheories.push(quote.theory);
    }
  });
  return uniqueTheories.sort();
}