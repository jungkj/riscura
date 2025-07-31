/**
 * AI Service Integration Tests
 * Tests document processing pipeline, risk analysis accuracy, and error handling
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import fs from 'fs';
import path from 'path';

// Mock AI service responses
const aiServiceHandlers = [
  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', ({ request }: { request: Request }) => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              risks: [{ title: 'Test Risk', severity: 'HIGH' }],
              summary: 'Mock AI analysis',
            }),
          },
        },
      ],
    });
  }),

  // Document analysis API mock
  http.post('/api/ai/analyze', ({ request }: { request: Request }) => {
    return HttpResponse.json({
      analysis: 'Mock analysis result',
      confidence: 0.95,
    });
  }),
];

const server = setupServer(...aiServiceHandlers);

// Test utilities
class AIServiceTestUtils {
  static createTestDocument(type: 'policy' | 'procedure' | 'guideline' = 'policy') {
    const documents = {
      policy: `
        PRIVACY POLICY
        
        1. Data Collection
        We collect personal information including names, email addresses, and usage data.
        
        2. Data Processing
        Personal data is processed for legitimate business purposes only.
        
        3. Data Protection
        All data is encrypted using AES-256 encryption.
        Access is restricted to authorized personnel only.
        
        4. Data Retention
        Personal data is retained for no longer than necessary.
        
        5. Data Subject Rights
        Individuals have the right to access, rectify, and delete their personal data.
      `,
      procedure: `
        ACCESS CONTROL PROCEDURE
        
        1. User Account Management
        - All user accounts must be approved by department manager
        - Default access is read-only
        - Privileged access requires additional approval
        
        2. Password Requirements
        - Minimum 12 characters
        - Must include uppercase, lowercase, numbers, and symbols
        - Changed every 90 days
        
        3. Multi-Factor Authentication
        - Required for all privileged accounts
        - SMS or app-based authentication
        
        4. Access Reviews
        - Quarterly access reviews for all users
        - Annual privileged access reviews
      `,
      guideline: `
        RISK MANAGEMENT GUIDELINES
        
        1. Risk Identification
        Risks should be identified through regular assessments and incident analysis.
        
        2. Risk Assessment
        All risks must be assessed for likelihood and impact on a 1-5 scale.
        
        3. Risk Treatment
        Options include accept, mitigate, transfer, or avoid.
        
        4. Risk Monitoring
        Risks should be monitored monthly and reported quarterly.
      `,
    };

    return documents[type];
  }

  static async uploadTestDocument(documentContent: string, filename: string) {
    // Simulate file upload
    const buffer = Buffer.from(documentContent, 'utf-8');

    // Mock FormData for file upload
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, filename);
    formData.append('documentType', 'policy');

    return formData;
  }

  static validateRiskAnalysis(analysis: any) {
    expect(analysis).toHaveProperty('risks');
    expect(analysis).toHaveProperty('controls');
    expect(analysis).toHaveProperty('compliance');

    if (analysis.risks && Array.isArray(analysis.risks)) {
      analysis.risks.forEach((risk: any) => {
        expect(risk).toHaveProperty('title');
        expect(risk).toHaveProperty('description');
        expect(risk).toHaveProperty('category');
        expect(risk).toHaveProperty('likelihood');
        expect(risk).toHaveProperty('impact');

        expect(risk.likelihood).toBeGreaterThanOrEqual(1);
        expect(risk.likelihood).toBeLessThanOrEqual(5);

        expect(risk.impact).toHaveProperty('financial');
        expect(risk.impact).toHaveProperty('operational');
        expect(risk.impact).toHaveProperty('reputational');
        expect(risk.impact).toHaveProperty('regulatory');
      });
    }
  }

  static validateControlAnalysis(analysis: any) {
    if (analysis.controls && Array.isArray(analysis.controls)) {
      analysis.controls.forEach((control: any) => {
        expect(control).toHaveProperty('name');
        expect(control).toHaveProperty('description');
        expect(control).toHaveProperty('type');
        expect(['preventive', 'detective', 'corrective']).toContain(control.type);

        if (control.effectiveness) {
          expect(control.effectiveness).toBeGreaterThanOrEqual(1);
          expect(control.effectiveness).toBeLessThanOrEqual(5);
        }
      });
    }
  }

  static measureProcessingTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    return fn().then((result) => ({
      result,
      duration: performance.now() - start,
    }));
  }
}

describe('AI Service Integration Tests', () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Document Processing Pipeline', () => {
    test('should process policy document and extract risks', async () => {
      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'privacy-policy.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('analysis');

      AIServiceTestUtils.validateRiskAnalysis(result.data.analysis);
    });

    test('should handle different document types correctly', async () => {
      const documentTypes = ['policy', 'procedure', 'guideline'] as const;

      for (const docType of documentTypes) {
        const documentContent = AIServiceTestUtils.createTestDocument(docType);
        const formData = await AIServiceTestUtils.uploadTestDocument(
          documentContent,
          `test-${docType}.pdf`
        );

        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          body: formData,
        });

        expect(response.ok).toBe(true);

        const result = await response.json();
        expect(result.data.documentType).toBeTruthy();
      }
    });

    test('should extract compliance requirements accurately', async () => {
      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'compliance-policy.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const compliance = result.data.analysis?.compliance;

      if (compliance) {
        expect(compliance).toHaveProperty('frameworks');
        expect(compliance).toHaveProperty('requirements');

        if (compliance.frameworks) {
          expect(Array.isArray(compliance.frameworks)).toBe(true);
          compliance.frameworks.forEach((framework: string) => {
            expect(typeof framework).toBe('string');
            expect(framework.length).toBeGreaterThan(0);
          });
        }
      }
    });

    test('should process documents within performance thresholds', async () => {
      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'performance-test.pdf'
      );

      const { result, duration } = await AIServiceTestUtils.measureProcessingTime(async () => {
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          body: formData,
        });
        return response.json();
      });

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Risk Analysis Accuracy', () => {
    test('should identify risks with appropriate severity levels', async () => {
      // Test with high-risk document content
      const highRiskContent = `
        CRITICAL SECURITY INCIDENT
        
        Unauthorized access to customer database detected.
        Potential exposure of 100,000 customer records including:
        - Social Security Numbers
        - Credit Card Information
        - Personal Addresses
        
        No encryption was in place.
        No access controls were functioning.
        Backup systems failed.
      `;

      const formData = await AIServiceTestUtils.uploadTestDocument(
        highRiskContent,
        'security-incident.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const risks = result.data.analysis?.risks;

      if (risks && risks.length > 0) {
        // Should identify high-impact risks
        const hasHighImpactRisk = risks.some(
          (risk: any) =>
            risk.impact.financial >= 4 ||
            risk.impact.reputational >= 4 ||
            risk.impact.regulatory >= 4
        );

        expect(hasHighImpactRisk).toBe(true);
      }
    });

    test('should suggest appropriate controls for identified risks', async () => {
      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'control-analysis.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      AIServiceTestUtils.validateControlAnalysis(result.data.analysis);

      const controls = result.data.analysis?.controls;
      if (controls && controls.length > 0) {
        // Controls should be relevant to the document content
        const hasRelevantControls = controls.some(
          (control: any) =>
            control.name.toLowerCase().includes('data') ||
            control.name.toLowerCase().includes('access') ||
            control.name.toLowerCase().includes('encryption')
        );

        expect(hasRelevantControls).toBe(true);
      }
    });

    test('should provide accurate compliance gap analysis', async () => {
      const gapAnalysisContent = `
        INCOMPLETE PRIVACY POLICY
        
        1. Data Collection
        We collect some data but don't specify what kind.
        
        2. Data Use
        Data is used for business purposes.
        
        Note: This policy is missing:
        - Data retention periods
        - Individual rights
        - Contact information for data protection officer
        - Legal basis for processing
      `;

      const formData = await AIServiceTestUtils.uploadTestDocument(
        gapAnalysisContent,
        'incomplete-policy.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const analysis = result.data.analysis;

      expect(analysis.complianceGaps).toBeGreaterThan(0);

      if (analysis.insights) {
        const hasGapInsights = analysis.insights.some(
          (insight: string) =>
            insight.toLowerCase().includes('missing') ||
            insight.toLowerCase().includes('gap') ||
            insight.toLowerCase().includes('incomplete')
        );
        expect(hasGapInsights).toBe(true);
      }
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('should handle AI service timeout gracefully', async () => {
      // Mock a timeout scenario
      server.use(
        http.post(
          'https://api.openai.com/v1/chat/completions',
          ({ request }: { request: Request }) => {
            return HttpResponse.json(
              {
                choices: [
                  {
                    message: { content: 'Mock response' },
                  },
                ],
              },
              { status: 408 }
            );
          }
        )
      );

      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'timeout-test.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      // Should handle timeout gracefully
      expect(response.status).toBe(408);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    test('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;

      server.use(
        http.post(
          'https://api.openai.com/v1/chat/completions',
          ({ request }: { request: Request }) => {
            attemptCount++;

            if (attemptCount < 3) {
              return HttpResponse.json(
                {
                  choices: [
                    {
                      message: { content: 'Mock response' },
                    },
                  ],
                },
                { status: 500 }
              );
            }

            // Succeed on third attempt
            return HttpResponse.json({
              choices: [
                {
                  message: { content: 'Mock response with higher confidence' },
                },
              ],
            });
          }
        )
      );

      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'retry-test.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      expect(response.ok).toBe(true);
      expect(attemptCount).toBe(3); // Should have retried twice
    });

    test('should handle malformed AI responses', async () => {
      server.use(
        http.post(
          'https://api.openai.com/v1/chat/completions',
          ({ request }: { request: Request }) => {
            return HttpResponse.json(
              {
                choices: [
                  {
                    message: { content: 'Mock batch analysis response' },
                  },
                ],
              },
              { status: 500 }
            );
          }
        )
      );

      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'malformed-test.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      // Should handle malformed response gracefully
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('parsing');
    });

    test('should handle rate limiting from AI service', async () => {
      server.use(
        http.post(
          'https://api.openai.com/v1/chat/completions',
          ({ request }: { request: Request }) => {
            return HttpResponse.json(
              {
                error: { message: 'Mock API error' },
              },
              { status: 429 }
            );
          }
        )
      );

      const documentContent = AIServiceTestUtils.createTestDocument('policy');
      const formData = await AIServiceTestUtils.uploadTestDocument(
        documentContent,
        'rate-limit-test.pdf'
      );

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(429);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });
  });

  describe('Performance Under Various Document Types', () => {
    test('should process small documents quickly', async () => {
      const smallDoc = 'Short policy document with minimal content.';
      const formData = await AIServiceTestUtils.uploadTestDocument(smallDoc, 'small-doc.pdf');

      const { duration } = await AIServiceTestUtils.measureProcessingTime(async () => {
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          body: formData,
        });
        return response.json();
      });

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle large documents within acceptable time', async () => {
      // Create a large document
      const largeContent = Array(1000)
        .fill(AIServiceTestUtils.createTestDocument('policy'))
        .join('\n\n');

      const formData = await AIServiceTestUtils.uploadTestDocument(largeContent, 'large-doc.pdf');

      const { duration } = await AIServiceTestUtils.measureProcessingTime(async () => {
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          body: formData,
        });
        return response.json();
      });

      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
    });

    test('should process multiple documents concurrently', async () => {
      const documentCount = 5;
      const documents = Array(documentCount)
        .fill(null)
        .map((_, index) => ({
          content: AIServiceTestUtils.createTestDocument('policy'),
          filename: `concurrent-doc-${index}.pdf`,
        }));

      const { duration } = await AIServiceTestUtils.measureProcessingTime(async () => {
        const promises = documents.map(async (doc) => {
          const formData = await AIServiceTestUtils.uploadTestDocument(doc.content, doc.filename);
          const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            body: formData,
          });
          return response.json();
        });

        return Promise.all(promises);
      });

      // Concurrent processing should be faster than sequential
      expect(duration).toBeLessThan(documentCount * 10000); // Less than 10s per document
    });
  });
});

export { AIServiceTestUtils };
