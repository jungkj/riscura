/**
 * Type definitions for Test Script Generation AI Service
 * These interfaces provide comprehensive type safety for AI-generated test scripts
 */

import { TestStep, TestScriptType, TestFrequency } from './rcsa.types';

/**
 * Represents the structure of a parsed AI response for test script generation
 * This interface captures all possible properties returned by the AI
 */
export interface ParsedTestScript {
  /** The title of the test script */
  title: string;

  /** Detailed description of what the test script validates */
  description: string;

  /** The primary objective of the test */
  objective?: string;

  /** Array of test steps to be executed */
  steps: TestStep[];

  /** Expected overall results from the test execution */
  expectedResults: string;

  /** Type of test script (MANUAL, AUTOMATED, etc.) */
  testType: TestScriptType;

  /** Frequency at which the test should be executed */
  frequency: TestFrequency;

  /** Estimated duration in minutes */
  estimatedDuration?: number;

  /** Whether the test can be automated */
  automationCapable: boolean;

  /** Script for automated testing if applicable */
  automationScript?: string;

  /** Tags for categorization and search */
  tags: string[];

  /** Prerequisites that must be met before test execution */
  prerequisites?: string[];

  /** Assumptions made during test design */
  assumptions?: string[];

  /** Scope of the test coverage */
  scope?: string;

  /** Expected outcomes after successful test execution */
  expectedOutcomes?: string[];

  /** Criteria for determining test success */
  successCriteria?: string[];

  /** Data requirements for test execution */
  dataRequirements?: string[];

  /** Tools required for test execution */
  tools?: string[];

  /** Timeline or schedule information */
  timeline?: string;

  /** AI-generated suggestions for improvement */
  suggestions?: string[];
}

/**
 * Represents the raw step data structure from AI response
 * Used as input for the normalizeSteps method
 */
export interface RawTestStep {
  /** Step order/sequence number */
  order?: number | string;

  /** Description of the step action */
  description?: string;

  /** Expected result after step execution */
  expectedResult?: string;

  /** Data required for this step */
  dataRequired?: string | string[];

  /** Additional notes or comments */
  notes?: string;

  /** Estimated duration for this step in minutes */
  duration?: number;

  /** Person or role assigned to execute this step */
  assignee?: string;

  /** Validation criteria for this step */
  validationCriteria?: string;

  /** Risk level associated with this step */
  riskLevel?: 'low' | 'medium' | 'high';

  /** Whether this step is optional */
  isOptional?: boolean;

  /** Dependencies on other steps */
  dependencies?: number[];
}

/**
 * Probo service integration interfaces
 */

/**
 * Represents control-specific data from Probo service
 */
export interface ProboControlData {
  /** Unique identifier for the control */
  controlId: string;

  /** Control title or name */
  controlName: string;

  /** Control description */
  description: string;

  /** Control category or type */
  category: string;

  /** Compliance frameworks this control addresses */
  frameworks: string[];

  /** Risk level addressed by this control */
  riskLevel: string;

  /** Implementation guidance */
  implementationGuidance?: string;

  /** Testing frequency recommendation */
  recommendedFrequency?: string;

  /** Automation potential score (0-1) */
  automationScore?: number;
}

/**
 * Represents testing guidance from Probo service
 */
export interface ProboTestGuidance {
  /** Recommended test steps */
  testSteps?: Array<{
    description: string;
    expectedResult: string;
    dataRequired: string;
    notes?: string;
  }>;

  /** Test objectives */
  objectives?: string[];

  /** Success criteria */
  successCriteria?: string[];

  /** Common failure scenarios */
  commonFailures?: string[];

  /** Best practices for this control type */
  bestPractices?: string[];

  /** Suggested tools for testing */
  suggestedTools?: string[];

  /** Compliance requirements */
  complianceRequirements?: string[];

  /** Automation recommendations */
  automationRecommendations?: string;
}

/**
 * Complete response structure from Probo service integration
 */
export interface ProboIntegrationResponse {
  /** Whether the integration was successful */
  success: boolean;

  /** Control-specific data */
  controlData?: ProboControlData;

  /** Testing guidance information */
  testGuidance?: ProboTestGuidance;

  /** Additional metadata */
  metadata?: {
    responseTime: number;
    version: string;
    confidence: number;
  }

  /** Error information if integration failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  }
}

/**
 * Enhanced test script data with Probo integration
 */
export interface ProboEnhancedTestData {
  /** Additional test steps from Probo */
  additionalSteps: TestStep[];

  /** Suggestions from Probo service */
  suggestions: string[];

  /** Compliance mappings */
  complianceMappings?: string[];

  /** Automation recommendations */
  automationRecommendations?: string;

  /** Best practices */
  bestPractices?: string[];
}
