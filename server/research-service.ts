import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  domain: string;
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

  /**
   * Search for research content using multiple sources
   */
  async searchResearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Search PubMed first for medical/psychological research
      const pubmedResults = await this.searchPubMed(query, Math.ceil(limit / 2));
      results.push(...pubmedResults);

      // If we need more results, search Google Scholar
      if (results.length < limit) {
        const scholarResults = await this.searchGoogleScholar(query, limit - results.length);
        results.push(...scholarResults);
      }

      return results.slice(0, limit);
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

  /**
   * Summarize scraped content using AI
   */
  async summarizeContent(content: ScrapedContent, userContext?: string): Promise<string> {
    const prompt = `
Summarize this research article for a Licensed Associate Counselor. Focus on:
- Key findings and conclusions
- Practical applications for therapy
- Important insights for professional practice
- Relevant therapeutic techniques or approaches

${userContext ? `User context: ${userContext}` : ''}

Article: ${content.title}
Source: ${content.source}

Content: ${content.content}

Provide a clear, professional summary in 3-4 paragraphs.`;

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