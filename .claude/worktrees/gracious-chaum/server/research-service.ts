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
  authors?: string[];
  publishDate?: string;
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
      // Search all sources in parallel for better performance
      const [pubmedResults, scholarResults, searxResults] = await Promise.allSettled([
        this.searchPubMed(query, Math.ceil(limit * 0.6)), // PubMed gets priority (60%)
        this.searchGoogleScholar(query, Math.ceil(limit * 0.3)), // Google Scholar (30%)
        this.searchSearXNG(query, Math.ceil(limit * 0.2)) // SearXNG for broader coverage (20%)
      ]);

      // Collect results from all successful searches
      if (pubmedResults.status === 'fulfilled') {
        results.push(...pubmedResults.value);
      }
      if (scholarResults.status === 'fulfilled') {
        results.push(...scholarResults.value);
      }
      if (searxResults.status === 'fulfilled') {
        results.push(...searxResults.value);
      }

      // Remove duplicates based on title similarity
      const uniqueResults = this.removeDuplicates(results);

      // Calculate relevance scores for all results
      const scoredResults = await Promise.all(
        uniqueResults.map(async (result) => {
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
   * Remove duplicate results based on title similarity
   */
  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const uniqueResults: SearchResult[] = [];
    const seenTitles = new Set<string>();

    for (const result of results) {
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      
      // Check if we've seen a very similar title
      let isDuplicate = false;
      for (const seenTitle of seenTitles) {
        if (this.calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seenTitles.add(normalizedTitle);
        uniqueResults.push(result);
      }
    }

    return uniqueResults;
  }

  /**
   * Calculate string similarity for duplicate detection
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Search PubMed for medical and psychological research
   */
  private async searchPubMed(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // Step 1: Search for article IDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`;
      
      const response = await fetch(searchUrl);
      const data = await response.json() as any;
      
      if (!data.esearchresult?.idlist?.length) {
        return [];
      }

      // Step 2: Get detailed abstracts and metadata
      const ids = data.esearchresult.idlist.join(',');
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids}&retmode=xml`;
      
      const fetchResponse = await fetch(fetchUrl);
      const xmlText = await fetchResponse.text();
      
      // Parse XML to extract article details
      const results: SearchResult[] = [];
      const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
      
      for (let i = 0; i < articleMatches.length && i < limit; i++) {
        const articleXml = articleMatches[i];
        const pmid = data.esearchresult.idlist[i];
        
        // Extract title
        const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled';
        
        // Extract abstract
        const abstractMatch = articleXml.match(/<Abstract>([\s\S]*?)<\/Abstract>/);
        let abstract = '';
        if (abstractMatch) {
          const abstractText = abstractMatch[1];
          // Extract text from AbstractText elements
          const abstractTextMatches = abstractText.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g) || [];
          abstract = abstractTextMatches
            .map(match => match.replace(/<[^>]*>/g, '').trim())
            .join(' ')
            .trim();
        }
        
        // Extract authors
        const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
        const authors = authorMatches.slice(0, 3).map(authorXml => {
          const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
          const firstNameMatch = authorXml.match(/<(?:ForeName|FirstName)>(.*?)<\/(?:ForeName|FirstName)>/);
          const lastName = lastNameMatch ? lastNameMatch[1] : '';
          const firstName = firstNameMatch ? firstNameMatch[1] : '';
          return firstName && lastName ? `${lastName}, ${firstName.charAt(0)}.` : lastName || firstName;
        }).filter(Boolean);
        
        // Extract journal
        const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
        const journal = journalMatch ? journalMatch[1] : 'PubMed';
        
        // Extract publication date
        const dateMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
        const year = dateMatch ? dateMatch[1] : '';
        
        if (title && (abstract || title.length > 20)) {
          results.push({
            title: title,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            snippet: abstract || title,
            source: journal,
            domain: 'pubmed.ncbi.nlm.nih.gov',
            authors: authors,
            publishDate: year
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
   * Search Google Scholar using SerpAPI or direct scraping
   */
  private async searchGoogleScholar(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // Use Google Scholar search with academic focus
      const scholarQuery = `${query} therapy counseling psychology mental health`;
      const encodedQuery = encodeURIComponent(scholarQuery);
      
      // Direct Google Scholar search (simplified approach for demo)
      const searchUrl = `https://scholar.google.com/scholar?q=${encodedQuery}&hl=en&num=${limit}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log('Google Scholar search failed, skipping');
        return [];
      }
      
      const html = await response.text();
      const results: SearchResult[] = [];
      
      // Parse Google Scholar results using regex (basic approach)
      const resultPattern = /<div class="gs_ri">[\s\S]*?<\/div>/g;
      const matches = html.match(resultPattern) || [];
      
      for (let i = 0; i < Math.min(matches.length, limit); i++) {
        const match = matches[i];
        
        // Extract title
        const titleMatch = match.match(/<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a><\/h3>/);
        if (!titleMatch) continue;
        
        const url = titleMatch[1];
        const title = titleMatch[2].replace(/<[^>]*>/g, '').trim();
        
        // Extract snippet
        const snippetMatch = match.match(/<span class="gs_rs">(.*?)<\/span>/);
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : title;
        
        // Extract source info
        const sourceMatch = match.match(/<div class="gs_a">(.*?)<\/div>/);
        const sourceInfo = sourceMatch ? sourceMatch[1].replace(/<[^>]*>/g, '').trim() : 'Google Scholar';
        
        if (title && snippet && title.length > 20) {
          results.push({
            title: title,
            url: url.startsWith('http') ? url : `https://scholar.google.com${url}`,
            snippet: snippet,
            source: sourceInfo.split(' - ')[0] || 'Google Scholar',
            domain: new URL(url.startsWith('http') ? url : 'https://scholar.google.com').hostname
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Google Scholar search error:', error);
      return [];
    }
  }

  /**
   * Search SearXNG for broader academic coverage
   */
  private async searchSearXNG(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // Use public SearXNG instance with academic focus
      const searxUrl = 'https://search.bus-hit.me/search';
      const params = new URLSearchParams({
        q: `${query} site:pubmed.ncbi.nlm.nih.gov OR site:psycnet.apa.org OR site:researchgate.net OR site:arxiv.org`,
        format: 'json',
        categories: 'science',
        engines: 'google,bing,duckduckgo'
      });
      
      const response = await fetch(`${searxUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'ClarityLog Research Bot 1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        console.log('SearXNG search failed, skipping');
        return [];
      }
      
      const data = await response.json() as any;
      const results: SearchResult[] = [];
      
      if (data.results && Array.isArray(data.results)) {
        for (const result of data.results.slice(0, limit)) {
          if (result.title && result.url && result.content) {
            // Filter for academic sources
            const domain = new URL(result.url).hostname;
            const isAcademic = this.trustedDomains.some(trusted => 
              domain.includes(trusted) || trusted.includes(domain)
            );
            
            if (isAcademic || result.title.toLowerCase().includes('therapy') || 
                result.title.toLowerCase().includes('psychology') ||
                result.title.toLowerCase().includes('counseling')) {
              
              results.push({
                title: result.title,
                url: result.url,
                snippet: result.content,
                source: domain,
                domain: domain
              });
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('SearXNG search error:', error);
      return [];
    }
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