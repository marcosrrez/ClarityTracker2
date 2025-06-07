import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  domain: string;
  relevanceScore?: number;
}

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  source: string;
  wordCount: number;
}

export class ResearchService {
  private trustedDomains = [
    'pubmed.ncbi.nlm.nih.gov',
    'psycnet.apa.org',
    'apa.org',
    'ncbi.nlm.nih.gov',
    'tandfonline.com',
    'sciencedirect.com',
    'jstor.org',
    'springer.com',
    'wiley.com',
    'sagepub.com',
    'aamft.org',
    'counseling.org',
    'who.int',
    'cdc.gov',
    'nimh.nih.gov'
  ];

  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  /**
   * Calculate semantic relevance score between query and result
   */
  private async calculateRelevanceScore(query: string, title: string, snippet: string): Promise<number> {
    if (!this.genAI) {
      // Fallback to keyword matching if no AI available
      return this.calculateKeywordRelevance(query, title, snippet);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
Rate the relevance of this research result to the query on a scale of 0-100:

Query: "${query}"
Title: "${title}"
Abstract: "${snippet}"

Consider:
- Exact keyword matches (highest weight)
- Semantic similarity and related concepts
- Clinical relevance for counseling/therapy
- Research quality indicators

Return only a number between 0-100.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const scoreText = response.text().trim();
      const score = parseInt(scoreText) || 0;
      
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.log('AI relevance scoring failed, using keyword fallback:', error);
      return this.calculateKeywordRelevance(query, title, snippet);
    }
  }

  /**
   * Fallback keyword-based relevance scoring
   */
  private calculateKeywordRelevance(query: string, title: string, snippet: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const text = (title + ' ' + snippet).toLowerCase();
    
    let score = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) {
        // Exact matches in title get higher weight
        if (title.toLowerCase().includes(term)) {
          score += 30;
        } else {
          score += 15;
        }
      }
    }
    
    return Math.min(100, score);
  }

  /**
   * Search for research content using multiple sources
   */
  async searchResearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Search PubMed first for medical/psychological research
      const pubmedResults = await this.searchPubMed(query, Math.ceil(limit * 1.5));
      results.push(...pubmedResults);

      // If we need more results, search Google Scholar
      if (results.length < limit * 1.5) {
        const scholarResults = await this.searchGoogleScholar(query, limit - results.length);
        results.push(...scholarResults);
      }

      // Calculate relevance scores for all results
      const scoredResults = await Promise.all(
        results.map(async (result) => {
          const relevanceScore = await this.calculateRelevanceScore(query, result.title, result.snippet);
          return { ...result, relevanceScore };
        })
      );

      // Filter by minimum relevance threshold and sort by score
      const filteredResults = scoredResults
        .filter(result => result.relevanceScore! >= 25) // Minimum 25% relevance
        .sort((a, b) => (b.relevanceScore! - a.relevanceScore!))
        .slice(0, limit);

      return filteredResults;
    } catch (error) {
      console.error('Research search error:', error);
      throw new Error('Failed to search research content');
    }
  }

  /**
   * Search PubMed for medical and psychological research
   */
  private async searchPubMed(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`;
      
      const response = await fetch(searchUrl);
      const data = await response.json() as any;
      
      if (!data.esearchresult?.idlist?.length) {
        return [];
      }

      const ids = data.esearchresult.idlist.join(',');
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
      
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json() as any;
      
      const results: SearchResult[] = [];
      
      for (const id of data.esearchresult.idlist) {
        const article = summaryData.result[id];
        if (article) {
          results.push({
            title: article.title || 'Untitled',
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            snippet: article.title || '',
            source: 'PubMed',
            domain: 'pubmed.ncbi.nlm.nih.gov'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('PubMed search error:', error);
      return [];
    }
  }

  /**
   * Search Google Scholar (simplified approach)
   */
  private async searchGoogleScholar(query: string, limit: number): Promise<SearchResult[]> {
    // Note: This is a simplified implementation
    // In production, consider using official Google Custom Search API
    return [];
  }

  /**
   * Scrape content from a trusted URL
   */
  async scrapeContent(url: string): Promise<ScrapedContent> {
    const domain = new URL(url).hostname;
    
    if (!this.trustedDomains.includes(domain)) {
      throw new Error(`Domain ${domain} is not in the trusted sources list`);
    }

    try {
      // Try simple HTTP fetch first
      const simpleContent = await this.scrapeWithFetch(url);
      if (simpleContent.content.length > 500) {
        return simpleContent;
      }

      // Fall back to browser-based scraping for dynamic content
      return await this.scrapeWithPlaywright(url);
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error('Failed to scrape content from URL');
    }
  }

  /**
   * Scrape content using simple HTTP fetch
   */
  private async scrapeWithFetch(url: string): Promise<ScrapedContent> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, footer, header, aside').remove();

    // Extract title
    const title = $('title').text() || $('h1').first().text() || 'Untitled';

    // Extract main content
    let content = '';
    
    // Try common content selectors
    const contentSelectors = [
      'article',
      '.article-content',
      '.content',
      'main',
      '.main-content',
      '#content',
      '.abstract',
      '.full-text'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().length > content.length) {
        content = element.text();
      }
    }

    // Fallback to body content
    if (!content || content.length < 200) {
      content = $('body').text();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return {
      title: title.trim(),
      content: content.substring(0, 10000), // Limit content length
      url,
      source: new URL(url).hostname,
      wordCount: content.split(' ').length
    };
  }

  /**
   * Scrape content using Playwright for dynamic sites
   */
  private async scrapeWithPlaywright(url: string): Promise<ScrapedContent> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for content to load
      await page.waitForTimeout(2000);

      const title = await page.title();
      
      // Extract main content
      const content = await page.evaluate(() => {
        // Remove unwanted elements
        const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, aside, .sidebar');
        elementsToRemove.forEach(el => el.remove());

        // Try to find main content
        const contentSelectors = [
          'article',
          '.article-content',
          '.content',
          'main',
          '.main-content',
          '#content',
          '.abstract'
        ];

        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.length > 200) {
            return element.textContent;
          }
        }

        // Fallback to body
        return document.body.textContent || '';
      });

      await browser.close();

      const cleanContent = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      return {
        title: title.trim(),
        content: cleanContent.substring(0, 10000),
        url,
        source: new URL(url).hostname,
        wordCount: cleanContent.split(' ').length
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async extractContentFromUrl(url: string): Promise<{ title: string; content: string; wordCount: number; source: string; } | null> {
    try {
      const scrapedContent = await this.scrapeContent(url);
      return {
        title: scrapedContent.title,
        content: scrapedContent.content,
        wordCount: scrapedContent.wordCount,
        source: scrapedContent.source
      };
    } catch (error) {
      console.error('Content extraction failed:', error);
      return null;
    }
  }

  async generateComprehensiveSummary(content: { title: string; content: string; wordCount: number; source: string; }, userContext?: string): Promise<string> {
    const prompt = `
As a senior clinical supervisor and research expert, provide a comprehensive, structured summary of this research article for Licensed Associate Counselors and mental health professionals. 

Structure your response with clear sections:

### Executive Summary
Brief overview of the study's purpose and main findings

### Research Methodology & Design
Study design, participants, measures, and procedures

### Key Findings & Results
Primary results and statistical significance

### Clinical Applications
Direct applications to counseling practice including:
- Assessment considerations
- Intervention strategies
- Client population considerations

### Theoretical Implications
How findings relate to existing counseling theories and frameworks

### Professional Development Insights
What practitioners should know, including:
- Supervision topics
- Training considerations
- Ethical implications
- Cultural competency factors

### Limitations & Future Research
Study limitations and directions for future investigation

### Practice Recommendations
Specific recommendations for implementation in clinical settings

${userContext ? `\nUser Context: ${userContext}` : ''}

Article: ${content.title}
Source: ${content.source}
Word Count: ${content.wordCount}

Content: ${content.content}

Provide a comprehensive, detailed analysis that demonstrates deep understanding of the research and its clinical applications. Use professional terminology while remaining accessible to practitioners at all levels.

Format your response to be thorough yet scannable, with clear section headers and detailed content that practitioners can reference for clinical decision-making, supervision discussions, and professional development planning.`;

    try {
      // Use Google AI as primary since it's working
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error('Google AI API key not configured');
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (googleError) {
      console.error('Google AI failed for content summarization:', googleError);
      
      // Fallback to basic content extraction
      const summary = content.content.substring(0, 1000);
      return `Summary of "${content.title}" from ${content.source}:\n\n${summary}...`;
    }
  }

  /**
   * Summarize scraped content using AI
   */
  async summarizeContent(content: ScrapedContent, userContext?: string): Promise<string> {
    const prompt = `
As a senior clinical supervisor and research expert, provide a comprehensive, structured summary of this research article for Licensed Associate Counselors and mental health professionals. 

Structure your response with clear sections:

### Executive Summary
Brief overview of the study's purpose and main findings

### Key Findings & Results
Detailed breakdown of research outcomes, statistical significance, and clinical implications

### Methodology & Participants
Study design, sample size, demographics, and research methods used

### Clinical Applications
Specific, actionable applications for therapeutic practice including:
- Treatment protocols and techniques
- Assessment considerations
- Intervention strategies
- Client population considerations

### Theoretical Implications
How findings relate to existing counseling theories and frameworks

### Professional Development Insights
What practitioners should know, including:
- Supervision topics
- Training considerations
- Ethical implications
- Cultural competency factors

### Limitations & Future Research
Study limitations and directions for future investigation

### Practice Recommendations
Specific recommendations for implementation in clinical settings

${userContext ? `\nUser Context: ${userContext}` : ''}

Article: ${content.title}
Source: ${content.source}
Word Count: ${content.wordCount}

Content: ${content.content}

Provide a comprehensive, detailed analysis that demonstrates deep understanding of the research and its clinical applications. Use professional terminology while remaining accessible to practitioners at all levels.

Format your response to be thorough yet scannable, with clear section headers and detailed content that practitioners can reference for clinical decision-making, supervision discussions, and professional development planning.`;

    try {
      // Use Google AI as primary since it's working
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error('Google AI API key not configured');
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (googleError) {
      console.error('Google AI failed for content summarization:', googleError);
      
      // Fallback to basic content extraction
      const summary = content.content.substring(0, 1000);
      return `Summary of "${content.title}" from ${content.source}:\n\n${summary}...`;
    }
  }
}

export const researchService = new ResearchService();