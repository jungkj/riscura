import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

// Helper function to get OpenAI client
const getOpenAIClient = () {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAI({
    apiKey,
    organization: process.env.OPENAI_ORG_ID,
  });
}

export interface DocumentAnalysis {
  classification: {
    category: string;
    confidence: number;
    suggestedTags: string[];
  };
  extractedContent: {
    text: string;
    risks: ExtractedRisk[];
    controls: ExtractedControl[];
    compliance: ComplianceMapping[];
  };
  summary: string;
  anomalies: DocumentAnomaly[];
  language: string;
  quality: DocumentQuality;
}

export interface ExtractedRisk {
  title: string;
  description: string;
  category: string;
  severity: string;
  likelihood: string;
  impact: string;
  confidence: number;
  sourceLocation: string;
}

export interface ExtractedControl {
  title: string;
  description: string;
  type: string;
  category: string;
  effectiveness: string;
  confidence: number;
  sourceLocation: string;
}

export interface ComplianceMapping {
  framework: string;
  requirement: string;
  description: string;
  compliance_status: string;
  confidence: number;
}

export interface DocumentAnomaly {
  type: 'inconsistency' | 'missing_info' | 'formatting' | 'content_quality';
  description: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  suggestion: string;
}

export interface DocumentQuality {
  score: number;
  factors: {
    completeness: number;
    clarity: number;
    structure: number;
    accuracy: number;
  };
  recommendations: string[];
}

export class DocumentProcessor {
  // Main document analysis function
  async analyzeDocument(documentId: string): Promise<DocumentAnalysis> {
    const document = await db.client.document.findUnique({
      where: { id: documentId },
      include: {
        files: true,
        organization: true,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    let extractedText = '';

    // Process all files attached to the document
    for (const file of document.files) {
      try {
        const fileBuffer = await storage.download(file.storageId);
        const fileText = await this.extractTextFromFile(fileBuffer, file.mimeType);
        extractedText += fileText + '\n\n';
      } catch (error) {
        // console.error(`Failed to extract text from file ${file.id}:`, error);
      }
    }

    if (!extractedText.trim()) {
      throw new Error('No text content could be extracted from document');
    }

    // Perform AI analysis
    const [classification, extractedContent, summary, anomalies, quality] = await Promise.all([
      this.classifyDocument(extractedText, document.category),
      this.extractRisksAndControls(extractedText),
      this.generateSummary(extractedText),
      this.detectAnomalies(extractedText, document),
      this.assessQuality(extractedText),
    ]);

    const language = await this.detectLanguage(extractedText);

    // Update document with extracted content
    await db.client.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        aiSummary: summary,
        aiClassification: classification.category,
        aiConfidence: classification.confidence,
        aiTags: classification.suggestedTags,
        qualityScore: quality.score,
        updatedAt: new Date(),
      },
    });

    // Log the analysis activity
    await db.client.activity.create({
      data: {
        type: 'DOCUMENT_ANALYZED',
        entityType: 'DOCUMENT',
        entityId: documentId,
        description: `AI analysis completed for document: ${document.title}`,
        userId: document.createdById || 'system',
        organizationId: document.organizationId,
        metadata: {
          classification: classification.category,
          confidence: classification.confidence,
          extractedRisks: extractedContent.risks.length,
          extractedControls: extractedContent.controls.length,
          qualityScore: quality.score,
        },
        isPublic: false,
      },
    });

    return {
      classification,
      extractedContent,
      summary,
      anomalies,
      language,
      quality,
    };
  }

  // Extract text from various file types
  private async extractTextFromFile(fileBuffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'text/plain':
        return fileBuffer.toString('utf-8');

      case 'application/pdf':
        return await this.extractPDFText(fileBuffer);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.extractDocxText(fileBuffer);

      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return await this.extractXlsxText(fileBuffer);

      case 'image/png':
      case 'image/jpeg':
      case 'image/gif':
        return await this.extractImageText(fileBuffer);

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  // OCR for images using OpenAI Vision API
  private async extractImageText(imageBuffer: Buffer): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured for image processing');
      }

      const openai = getOpenAIClient();
      const base64Image = imageBuffer.toString('base64');

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text content from this image. Focus on identifying any risk management, control procedures, compliance requirements, or business process information. Return only the extracted text.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // console.error('Failed to extract text from image:', error);
      return '';
    }
  }

  // Simplified text extraction for other formats (would use libraries like pdf-parse, mammoth, etc.)
  private async extractPDFText(pdfBuffer: Buffer): Promise<string> {
    // In production, use libraries like pdf-parse
    // For now, return placeholder
    return '[PDF text extraction requires pdf-parse library]';
  }

  private async extractDocxText(docxBuffer: Buffer): Promise<string> {
    // In production, use libraries like mammoth
    // For now, return placeholder
    return '[DOCX text extraction requires mammoth library]';
  }

  private async extractXlsxText(xlsxBuffer: Buffer): Promise<string> {
    // In production, use libraries like xlsx
    // For now, return placeholder
    return '[XLSX text extraction requires xlsx library]';
  }

  // AI-powered document classification
  private async classifyDocument(
    text: string,
    currentCategory?: string
  ): Promise<{
    category: string;
    confidence: number;
    suggestedTags: string[];
  }> {
    const _prompt = `
Analyze the following document text and classify it into one of these categories:
- policy: Corporate policies and procedures
- procedure: Step-by-step operational procedures
- guideline: Best practice guidelines and recommendations
- form: Templates and forms for data collection
- report: Reports and assessments
- evidence: Evidence documents for compliance
- other: Other document types

Also suggest relevant tags for better categorization.

Document text:
${text.substring(0, 3000)}...

Return a JSON response with:
{
  "category": "category_name",
  "confidence": 0.95,
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "reasoning": "explanation of classification"
}
`;

    try {
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        return {
          category: currentCategory || 'other',
          confidence: 0.8,
          suggestedTags: ['demo', 'auto-classified'],
        };
      }

      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert document classifier for risk management and compliance systems. Analyze documents and provide accurate classifications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const _result = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        category: result.category || currentCategory || 'other',
        confidence: result.confidence || 0.5,
        suggestedTags: result.suggestedTags || [],
      };
    } catch (error) {
      // console.error('Failed to classify document:', error);
      return {
        category: currentCategory || 'other',
        confidence: 0.0,
        suggestedTags: [],
      };
    }
  }

  // Extract risks and controls from document content
  private async extractRisksAndControls(text: string): Promise<{
    text: string;
    risks: ExtractedRisk[];
    controls: ExtractedControl[];
    compliance: ComplianceMapping[];
  }> {
    const _prompt = `
Analyze the following document text and extract:
1. Risks mentioned or implied
2. Controls described or recommended
3. Compliance requirements referenced

For each risk, provide:
- Title, description, category, severity, likelihood, impact
- Confidence score (0-1)
- Source location in text

For each control, provide:
- Title, description, type, category, effectiveness
- Confidence score (0-1) 
- Source location in text

For compliance mappings, identify:
- Framework (ISO27001, SOX, GDPR, etc.)
- Specific requirement
- Compliance status
- Confidence score

Document text:
${text.substring(0, 4000)}...

Return JSON with: { "risks": [...], "controls": [...], "compliance": [...] }
`;

    try {
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        return {
          text,
          risks: [],
          controls: [],
          compliance: [],
        };
      }

      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert risk management analyst. Extract structured information about risks, controls, and compliance from documents.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      const _result = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        text,
        risks: result.risks || [],
        controls: result.controls || [],
        compliance: result.compliance || [],
      };
    } catch (error) {
      // console.error('Failed to extract risks and controls:', error);
      return {
        text,
        risks: [],
        controls: [],
        compliance: [],
      };
    }
  }

  // Generate document summary
  private async generateSummary(text: string): Promise<string> {
    const _prompt = `
Summarize the following document focusing on:
- Key objectives and purpose
- Main risks identified
- Control measures described
- Compliance requirements
- Important deadlines or milestones

Keep the summary concise but comprehensive (2-3 paragraphs max).

Document text:
${text.substring(0, 4000)}...
`;

    try {
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        return 'Document summary: This is a demo environment where AI-powered document summarization requires OpenAI API configuration.';
      }

      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert business analyst. Create clear, concise summaries of business documents.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      // console.error('Failed to generate summary:', error);
      return 'Summary could not be generated';
    }
  }

  // Detect document anomalies
  private async detectAnomalies(text: string, document: any): Promise<DocumentAnomaly[]> {
    const anomalies: DocumentAnomaly[] = [];

    // Check for basic quality issues
    if (text.length < 100) {
      anomalies.push({
        type: 'content_quality',
        description: 'Document appears to have very little content',
        severity: 'high',
        location: 'entire document',
        suggestion:
          'Consider adding more detailed content or checking if text extraction was successful',
      });
    }

    // Check for formatting issues
    if (
      text.includes('[PDF text extraction requires') ||
      text.includes('[DOCX text extraction requires')
    ) {
      anomalies.push({
        type: 'formatting',
        description: 'Text extraction incomplete due to missing libraries',
        severity: 'medium',
        location: 'file processing',
        suggestion: 'Install appropriate text extraction libraries for better content analysis',
      });
    }

    // Add more anomaly detection logic here

    return anomalies;
  }

  // Assess document quality
  private async assessQuality(text: string): Promise<DocumentQuality> {
    // Simple quality assessment
    const completeness = Math.min(text.length / 1000, 1); // Basic length check
    const clarity = text.split('.').length > 5 ? 0.8 : 0.5; // Basic sentence structure
    const structure = text.includes('\n') ? 0.8 : 0.6; // Basic paragraph structure
    const accuracy = 0.7; // Would require more sophisticated analysis

    const score = (completeness + clarity + structure + accuracy) / 4;

    return {
      score: Math.round(score * 100) / 100,
      factors: {
        completeness,
        clarity,
        structure,
        accuracy,
      },
      recommendations: [
        score < 0.6 ? 'Consider improving document structure and content' : '',
        clarity < 0.7 ? 'Improve sentence clarity and readability' : '',
        structure < 0.7 ? 'Add better paragraph structure and formatting' : '',
      ].filter(Boolean),
    };
  }

  // Detect document language
  private async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on common words
    const sample = text.substring(0, 200).toLowerCase();

    if (sample.includes('the ') && sample.includes(' and ') && sample.includes(' of ')) {
      return 'en';
    }

    return 'unknown';
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();
