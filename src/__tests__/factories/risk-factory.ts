// import { Risk, RiskCategory, RiskStatus, RiskLevel } from '@prisma/client'

export interface CreateRiskOptions {
  id?: string;
  title?: string;
  description?: string;
  category?: RiskCategory;
  likelihood?: number;
  impact?: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
  owner?: string;
  status?: RiskStatus;
  organizationId?: string;
  createdBy?: string;
  dateIdentified?: Date;
  lastAssessed?: Date;
  nextReview?: Date;
  aiConfidence?: number;
}

export class RiskFactory {
  private static counter = 1;

  static create(_options: CreateRiskOptions = {}): Risk {
    const id = options.id || `risk-${this.counter++}`;
    const likelihood = options.likelihood || Math.floor(Math.random() * 5) + 1;
    const impact = options.impact || Math.floor(Math.random() * 5) + 1;
    const riskScore = options.riskScore || likelihood * impact;

    return {
      id,
      title: options.title || `Test Risk ${this.counter}`,
      description: options.description || `Description for test risk ${this.counter}`,
      category: options.category || RiskCategory.OPERATIONAL,
      likelihood,
      impact,
      riskScore,
      riskLevel: options.riskLevel || this.calculateRiskLevel(riskScore),
      owner: options.owner || null,
      status: options.status || RiskStatus.IDENTIFIED,
      organizationId: options.organizationId || 'org-1',
      createdBy: options.createdBy || 'user-1',
      dateIdentified: options.dateIdentified || new Date(),
      lastAssessed: options.lastAssessed || new Date(),
      nextReview: options.nextReview || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      aiConfidence: options.aiConfidence || Math.random() * 0.5 + 0.5, // 0.5-1.0
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Risk;
  }

  static createHighRisk(_options: CreateRiskOptions = {}): Risk {
    return this.create({
      ...options,
      likelihood: options.likelihood || 5,
      impact: options.impact || 5,
      riskLevel: RiskLevel.HIGH,
      title: options.title || `High Risk ${this.counter}`,
    });
  }

  static createMediumRisk(_options: CreateRiskOptions = {}): Risk {
    return this.create({
      ...options,
      likelihood: options.likelihood || 3,
      impact: options.impact || 3,
      riskLevel: RiskLevel.MEDIUM,
      title: options.title || `Medium Risk ${this.counter}`,
    });
  }

  static createLowRisk(_options: CreateRiskOptions = {}): Risk {
    return this.create({
      ...options,
      likelihood: options.likelihood || 1,
      impact: options.impact || 2,
      riskLevel: RiskLevel.LOW,
      title: options.title || `Low Risk ${this.counter}`,
    });
  }

  static createByCategory(category: RiskCategory, count: number = 1): Risk[] {
    return Array.from({ length: count }, () => this.create({ category }));
  }

  static createBatch(_count: number, options: CreateRiskOptions = {}): Risk[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createForOrganization(_organizationId: string, count: number = 1): Risk[] {
    return this.createBatch(count, { organizationId });
  }

  static createWithControls(controlCount: number = 2): Risk {
    // This would be used in integration tests where we also create controls
    return this.create({
      title: `Risk with ${controlCount} controls`,
    })
  }

  private static calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 20) return RiskLevel.CRITICAL;
    if (riskScore >= 15) return RiskLevel.HIGH;
    if (riskScore >= 10) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  static reset(): void {
    this.counter = 1;
  }
}

// Export commonly used test risks
export const testRisks = {
  operational: RiskFactory.create({
    id: 'risk-1',
    title: 'Operational Risk Test',
    category: RiskCategory.OPERATIONAL,
    likelihood: 3,
    impact: 4,
  }),

  financial: RiskFactory.create({
    id: 'risk-2',
    title: 'Financial Risk Test',
    category: RiskCategory.FINANCIAL,
    likelihood: 2,
    impact: 5,
  }),

  compliance: RiskFactory.create({
    id: 'risk-3',
    title: 'Compliance Risk Test',
    category: RiskCategory.COMPLIANCE,
    likelihood: 4,
    impact: 3,
  }),

  technology: RiskFactory.create({
    id: 'risk-4',
    title: 'Technology Risk Test',
    category: RiskCategory.TECHNOLOGY,
    likelihood: 5,
    impact: 4,
  }),

  strategic: RiskFactory.create({
    id: 'risk-5',
    title: 'Strategic Risk Test',
    category: RiskCategory.STRATEGIC,
    likelihood: 2,
    impact: 4,
  }),
}
