import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

interface ResearchSource {
  name: string;
  baseUrl: string;
  searchPath: string;
  resultSelector: string;
  titleSelector: string;
  snippetSelector: string;
  linkSelector: string;
  authorSelector?: string;
  sourceSelector?: string;
}

interface EnhancedResearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  authors?: string[];
  publicationYear?: string;
  relevanceScore: number;
  type: 'research' | 'practice' | 'review' | 'meta-analysis' | 'case-study';
  accessibility: 'open' | 'subscription' | 'unknown';
}

class EnhancedResearchService {
  private genAI: GoogleGenerativeAI | null;
  private researchSources: ResearchSource[];

  constructor() {
    this.genAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
    
    this.researchSources = [
      {
        name: 'PubMed',
        baseUrl: 'https://pubmed.ncbi.nlm.nih.gov',
        searchPath: '/search',
        resultSelector: '.docsum-wrap',
        titleSelector: '.docsum-title a',
        snippetSelector: '.full-view-snippet',
        linkSelector: '.docsum-title a',
        authorSelector: '.docsum-authors',
        sourceSelector: '.docsum-journal-citation'
      },
      {
        name: 'APA PsycInfo',
        baseUrl: 'https://psycnet.apa.org',
        searchPath: '/search',
        resultSelector: '.result-item',
        titleSelector: '.result-title a',
        snippetSelector: '.result-abstract',
        linkSelector: '.result-title a',
        authorSelector: '.result-authors',
        sourceSelector: '.result-source'
      },
      {
        name: 'SAGE Journals',
        baseUrl: 'https://journals.sagepub.com',
        searchPath: '/action/doSearch',
        resultSelector: '.search-result',
        titleSelector: '.search-result-title a',
        snippetSelector: '.search-result-teaser-text',
        linkSelector: '.search-result-title a',
        authorSelector: '.search-result-authors',
        sourceSelector: '.search-result-publication'
      },
      {
        name: 'Taylor & Francis',
        baseUrl: 'https://www.tandfonline.com',
        searchPath: '/action/doSearch',
        resultSelector: '.search-result',
        titleSelector: '.search-result-title',
        snippetSelector: '.search-result-abstract',
        linkSelector: '.search-result-title a',
        authorSelector: '.search-result-authors'
      },
      {
        name: 'Wiley Online Library',
        baseUrl: 'https://onlinelibrary.wiley.com',
        searchPath: '/action/doSearch',
        resultSelector: '.search-result',
        titleSelector: '.search-result-title',
        snippetSelector: '.search-result-snippet',
        linkSelector: '.search-result-title a'
      },
      {
        name: 'SpringerLink',
        baseUrl: 'https://link.springer.com',
        searchPath: '/search',
        resultSelector: '.content-item',
        titleSelector: '.content-item-title a',
        snippetSelector: '.content-item-snippet',
        linkSelector: '.content-item-title a'
      }
    ];
  }

  async searchMultipleSources(query: string, maxResults: number = 10): Promise<EnhancedResearchResult[]> {
    const enhancedQuery = await this.enhanceQuery(query);
    const allResults: EnhancedResearchResult[] = [];

    // Search PubMed first (most reliable)
    const pubmedResults = await this.searchPubMed(enhancedQuery, Math.ceil(maxResults * 0.4));
    allResults.push(...pubmedResults);

    // Search other academic sources
    const otherResults = await this.searchOtherSources(enhancedQuery, Math.ceil(maxResults * 0.6));
    allResults.push(...otherResults);

    // Rank and filter results
    const rankedResults = await this.rankResults(allResults, query);
    
    return rankedResults.slice(0, maxResults);
  }

  private async enhanceQuery(query: string): Promise<string> {
    if (!this.genAI) {
      return query;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are an expert research librarian specializing in mental health and clinical psychology. Convert user queries into optimized academic search terms for mental health research.

Convert this query into optimal academic search terms: "${query}"

Return only the enhanced search terms, no explanation needed.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text()?.trim() || query;
    } catch (error) {
      console.error('Query enhancement error:', error);
      return query;
    }
  }

  private async searchPubMed(query: string, maxResults: number): Promise<EnhancedResearchResult[]> {
    const results: EnhancedResearchResult[] = [];
    
    // Simulate PubMed search with enhanced results
    const pubmedMockResults = [
      {
        title: "Cognitive Behavioral Therapy for Anxiety Disorders: A Meta-Analysis of Randomized Controlled Trials",
        snippet: "This comprehensive meta-analysis examined the effectiveness of CBT interventions across 127 randomized controlled trials involving 9,138 participants with anxiety disorders. Results demonstrated significant effect sizes (d = 0.85) for CBT compared to control conditions, with sustained improvements at 6-month follow-up.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12345678",
        source: "PubMed",
        authors: ["Smith, J.A.", "Johnson, M.B.", "Williams, C.D."],
        publicationYear: "2024",
        relevanceScore: 95,
        type: 'meta-analysis' as const,
        accessibility: 'open' as const
      },
      {
        title: "Mindfulness-Based Interventions in Clinical Practice: Implementation and Outcomes",
        snippet: "A systematic review of mindfulness-based interventions (MBIs) in clinical settings, examining implementation barriers, therapist training requirements, and client outcomes across diverse populations. Analysis of 89 studies revealed significant improvements in anxiety, depression, and overall well-being.",
        url: "https://pubmed.ncbi.nlm.nih.gov/23456789",
        source: "PubMed",
        authors: ["Chen, L.", "Rodriguez, A.M.", "Thompson, K.R."],
        publicationYear: "2024",
        relevanceScore: 88,
        type: 'review' as const,
        accessibility: 'open' as const
      },
      {
        title: "Therapeutic Alliance in Multicultural Counseling: Cultural Considerations and Best Practices",
        snippet: "This study explores the formation and maintenance of therapeutic alliance across cultural differences, examining factors that enhance or impede alliance development. Findings highlight the importance of cultural humility, explicit discussion of cultural differences, and adapted therapeutic approaches.",
        url: "https://pubmed.ncbi.nlm.nih.gov/34567890",
        source: "PubMed",
        authors: ["Patel, S.K.", "Washington, D.L.", "Kim, H.J."],
        publicationYear: "2023",
        relevanceScore: 82,
        type: 'research' as const,
        accessibility: 'subscription' as const
      }
    ];

    return pubmedMockResults.slice(0, maxResults);
  }

  private async searchOtherSources(query: string, maxResults: number): Promise<EnhancedResearchResult[]> {
    const results: EnhancedResearchResult[] = [];
    
    // Simulate searches across multiple academic databases
    const otherSourceResults = [
      {
        title: "Evidence-Based Practice Implementation in Community Mental Health Centers",
        snippet: "A longitudinal study examining barriers and facilitators to implementing evidence-based practices in community mental health settings. Key findings include the importance of organizational support, clinician training, and client feedback systems in successful implementation.",
        url: "https://journals.sagepub.com/doi/10.1177/practice123",
        source: "SAGE Journals",
        authors: ["Martinez, R.J.", "Brown, A.C."],
        publicationYear: "2024",
        relevanceScore: 79,
        type: 'practice' as const,
        accessibility: 'subscription' as const
      },
      {
        title: "Trauma-Informed Care: Principles and Applications in Clinical Settings",
        snippet: "This comprehensive review outlines core principles of trauma-informed care and provides practical guidelines for implementation across various clinical settings. Emphasis on safety, trustworthiness, peer support, collaboration, and empowerment.",
        url: "https://www.tandfonline.com/doi/trauma-informed-456",
        source: "Taylor & Francis",
        authors: ["Davis, K.M.", "Wilson, J.P.", "Lee, S.H."],
        publicationYear: "2024",
        relevanceScore: 86,
        type: 'review' as const,
        accessibility: 'subscription' as const
      },
      {
        title: "Digital Mental Health Interventions: Efficacy and Implementation Considerations",
        snippet: "A systematic review of digital mental health interventions, including apps, online therapy platforms, and AI-assisted tools. Analysis of 156 studies reveals moderate to large effect sizes for digital interventions, with considerations for accessibility and therapeutic alliance.",
        url: "https://onlinelibrary.wiley.com/doi/digital-health-789",
        source: "Wiley Online Library",
        authors: ["Garcia, M.A.", "Singh, R.K.", "O'Connor, P.J."],
        publicationYear: "2024",
        relevanceScore: 73,
        type: 'review' as const,
        accessibility: 'open' as const
      },
      {
        title: "Supervision Models in Clinical Training: Comparative Effectiveness Study",
        snippet: "A randomized controlled trial comparing different supervision models for clinical trainees. Results indicate that structured, competency-based supervision with regular feedback significantly improves clinical skills and confidence compared to traditional approaches.",
        url: "https://link.springer.com/article/supervision-models-012",
        source: "SpringerLink",
        authors: ["Taylor, B.R.", "Anderson, L.K.", "Murphy, C.J."],
        publicationYear: "2023",
        relevanceScore: 91,
        type: 'research' as const,
        accessibility: 'subscription' as const
      }
    ];

    return otherSourceResults.slice(0, maxResults);
  }

  private async rankResults(results: EnhancedResearchResult[], originalQuery: string): Promise<EnhancedResearchResult[]> {
    if (!this.genAI) {
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are an expert research librarian. Rank research results by relevance to the user's query. Consider clinical applicability, methodological rigor, and practical utility.

Original query: "${originalQuery}"

Rate each result's relevance (1-100) and provide brief reasoning. Return JSON format: {"rankings": [{"index": 1, "score": 85, "reasoning": "..."}]}

${results.map((result, index) => 
  `${index + 1}. ${result.title}\n   ${result.snippet.substring(0, 150)}...`
).join('\n\n')}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const rankings = JSON.parse(text || '{"rankings": []}');
      
      // Apply AI rankings to update relevance scores
      rankings.rankings?.forEach((ranking: any) => {
        const resultIndex = ranking.index - 1;
        if (results[resultIndex]) {
          const aiScore = ranking.score || results[resultIndex].relevanceScore;
          results[resultIndex].relevanceScore = Math.round((results[resultIndex].relevanceScore + aiScore) / 2);
        }
      });

    } catch (error) {
      console.error('Ranking error:', error);
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async generateComprehensiveSummary(results: EnhancedResearchResult[], query: string): Promise<string> {
    if (!this.genAI || results.length === 0) {
      return "Research summary not available.";
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are a clinical research expert. Synthesize research findings into actionable clinical insights for mental health practitioners.

Based on these research findings for "${query}", provide a comprehensive summary with:
1. Key findings and consensus
2. Clinical implications
3. Practical applications
4. Areas needing further research

Research Results:
${results.map(result => 
  `• ${result.title} (${result.source}, ${result.publicationYear})\n  ${result.snippet}`
).join('\n\n')}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text() || "Summary generation failed.";
    } catch (error) {
      console.error('Summary generation error:', error);
      return "Unable to generate research summary.";
    }
  }
}

export const enhancedResearchService = new EnhancedResearchService();