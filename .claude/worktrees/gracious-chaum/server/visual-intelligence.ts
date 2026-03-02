import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VisualAnalysis {
  extractedText: string;
  objects: string[];
  colors: string[];
  brands: string[];
  categories: string[];
  description: string;
  keywords: string[];
  searchableContent: string;
  confidence: number;
}

interface ImageAnalysisRequest {
  imageBase64: string;
  filename?: string;
  analysisType?: 'comprehensive' | 'text-only' | 'objects-only';
}

export class VisualIntelligenceService {
  /**
   * Comprehensive image analysis with OCR, object detection, and content understanding
   */
  async analyzeImage(request: ImageAnalysisRequest): Promise<VisualAnalysis> {
    try {
      const systemPrompt = `You are an advanced visual intelligence system. Analyze this image thoroughly and provide detailed information in JSON format.

Extract and identify:
1. All visible text (OCR) - including handwritten text, typed text, signs, labels
2. Objects, items, and entities visible in the image
3. Dominant and accent colors (use descriptive names like "navy blue", "warm gray")
4. Brand names, logos, or commercial identifiers
5. Categories this image belongs to (e.g., "document", "product", "nature", "interface")
6. Overall description of what the image shows
7. Keywords that would help someone search for this content
8. Searchable content combining all the above

Respond with valid JSON in this exact format:
{
  "extractedText": "all text found in the image",
  "objects": ["object1", "object2"],
  "colors": ["color1", "color2"],
  "brands": ["brand1", "brand2"],
  "categories": ["category1", "category2"],
  "description": "detailed description of the image",
  "keywords": ["keyword1", "keyword2"],
  "searchableContent": "combined searchable text",
  "confidence": 0.95
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image comprehensively and provide the detailed visual intelligence data."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${request.imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        extractedText: result.extractedText || '',
        objects: Array.isArray(result.objects) ? result.objects : [],
        colors: Array.isArray(result.colors) ? result.colors : [],
        brands: Array.isArray(result.brands) ? result.brands : [],
        categories: Array.isArray(result.categories) ? result.categories : [],
        description: result.description || '',
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        searchableContent: result.searchableContent || '',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.8
      };

    } catch (error) {
      console.error('Visual analysis error:', error);
      throw new Error('Failed to analyze image: ' + (error as Error).message);
    }
  }

  /**
   * Fast text extraction from images (OCR focused)
   */
  async extractTextOnly(imageBase64: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all visible text from this image. Include handwritten text, typed text, signs, labels, and any other readable content. Return only the extracted text, nothing else."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Text extraction error:', error);
      return '';
    }
  }

  /**
   * Search through visual analysis data
   */
  searchVisualContent(analysis: VisualAnalysis, query: string): boolean {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return true;

    const searchableFields = [
      analysis.extractedText,
      analysis.description,
      analysis.searchableContent,
      ...analysis.objects,
      ...analysis.colors,
      ...analysis.brands,
      ...analysis.categories,
      ...analysis.keywords
    ];

    return searchableFields.some(field => 
      field && field.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Generate search tags from visual analysis
   */
  generateSearchTags(analysis: VisualAnalysis): string[] {
    const tags = new Set<string>();

    // Add all keywords
    analysis.keywords.forEach(keyword => tags.add(keyword.toLowerCase()));
    
    // Add objects
    analysis.objects.forEach(obj => tags.add(obj.toLowerCase()));
    
    // Add colors
    analysis.colors.forEach(color => tags.add(color.toLowerCase()));
    
    // Add brands
    analysis.brands.forEach(brand => tags.add(brand.toLowerCase()));
    
    // Add categories
    analysis.categories.forEach(cat => tags.add(cat.toLowerCase()));

    // Extract words from extracted text
    if (analysis.extractedText) {
      const words = analysis.extractedText
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !/^\d+$/.test(word));
      words.forEach(word => tags.add(word));
    }

    return Array.from(tags);
  }
}

export const visualIntelligence = new VisualIntelligenceService();