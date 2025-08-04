import { db } from '@/lib/db';

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'regulatory' | 'standard' | 'guideline' | 'internal';
  industry: string[];
  geography: string[];
  mandatory: boolean;
  domains: ComplianceDomain[];
  requirements: ComplianceRequirement[];
  controlObjectives: ControlObjective[];
  mappings: FrameworkMapping[];
  lastUpdated: Date;
  isActive: boolean;
  source: string;
  website?: string;
}

export interface ComplianceDomain {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  requirements: string[];
}

export interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  domainId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  mandatory: boolean;
  testable: boolean;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'continuous';
  evidenceTypes: string[];
  controlObjectives: string[];
  relatedRequirements: string[];
  tags: string[];
}

export interface ControlObjective {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  riskCategory: string[];
  maturityLevels: MaturityLevel[];
  implementationGuidance: string;
  evidenceRequirements: string[];
  testingProcedures: string[];
  relatedControls: string[];
}

export interface MaturityLevel {
  level: number;
  name: string;
  description: string;
  criteria: string[];
  evidenceTypes: string[];
}

export interface FrameworkMapping {
  id: string;
  sourceFramework: string;
  targetFramework: string;
  sourceRequirement: string;
  targetRequirement: string;
  mappingType: 'exact' | 'partial' | 'conceptual' | 'none';
  confidence: number;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export class ComplianceFrameworkManager {
  // Get all available frameworks
  async getFrameworks(filters?: {
    type?: string;
    industry?: string[];
    geography?: string[];
    mandatory?: boolean;
  }): Promise<ComplianceFramework[]> {
    const where: any = { isActive: true };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.industry) {
      where.industry = { hasSome: filters.industry };
    }

    if (filters?.geography) {
      where.geography = { hasSome: filters.geography };
    }

    if (filters?.mandatory !== undefined) {
      where.mandatory = filters.mandatory;
    }

    return await db.client.complianceFramework.findMany({
      where,
      include: {
        domains: true,
        requirements: true,
        controlObjectives: true,
        mappings: true,
      },
      orderBy: [{ mandatory: 'desc' }, { name: 'asc' }],
    });
  }

  // Get specific framework by ID
  async getFramework(frameworkId: string): Promise<ComplianceFramework | null> {
    return await db.client.complianceFramework.findUnique({
      where: { id: frameworkId },
      include: {
        domains: true,
        requirements: true,
        controlObjectives: true,
        mappings: true,
      },
    });
  }

  // Get framework requirements
  async getFrameworkRequirements(
    frameworkId: string,
    filters?: {
      category?: string;
      priority?: string[];
      mandatory?: boolean;
      testable?: boolean;
    }
  ): Promise<ComplianceRequirement[]> {
    const where: any = { frameworkId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.priority) {
      where.priority = { in: filters.priority };
    }

    if (filters?.mandatory !== undefined) {
      where.mandatory = filters.mandatory;
    }

    if (filters?.testable !== undefined) {
      where.testable = filters.testable;
    }

    return await db.client.complianceRequirement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { code: 'asc' }],
    });
  }

  // Create framework mapping
  async createFrameworkMapping(mapping: Omit<FrameworkMapping, 'id'>): Promise<FrameworkMapping> {
    return await db.client.frameworkMapping.create({
      data: mapping,
    });
  }

  // Get framework mappings
  async getFrameworkMappings(
    sourceFramework: string,
    targetFramework?: string
  ): Promise<FrameworkMapping[]> {
    const where: any = { sourceFramework };

    if (targetFramework) {
      where.targetFramework = targetFramework;
    }

    return await db.client.frameworkMapping.findMany({
      where,
      include: {
        sourceRequirement: true,
        targetRequirement: true,
      },
      orderBy: {
        confidence: 'desc',
      },
    });
  }

  // Initialize pre-built frameworks
  async initializeFrameworks(): Promise<void> {
    const frameworks = [
      this.createSOXFramework(),
      this.createISO27001Framework(),
      this.createNISTFramework(),
      this.createGDPRFramework(),
      this.createCOSOFramework(),
      this.createSOC2Framework(),
      this.createPCIDSSFramework(),
      this.createHIPAAFramework(),
    ];

    for (const framework of frameworks) {
      await this.upsertFramework(framework);
    }

    // Create cross-framework mappings
    await this.initializeFrameworkMappings();
  }

  // Upsert framework
  private async upsertFramework(_framework: ComplianceFramework): Promise<void> {
    await db.client.complianceFramework.upsert({
      where: { id: framework.id },
      update: framework,
      create: framework,
    });
  }

  // Create SOX framework
  private createSOXFramework(): ComplianceFramework {
    return {
      id: 'sox-2002',
      name: 'Sarbanes-Oxley Act',
      description:
        'U.S. federal law that establishes auditing and financial regulations for public companies',
      version: '2002',
      type: 'regulatory',
      industry: ['financial', 'public-companies'],
      geography: ['US'],
      mandatory: true,
      domains: [
        {
          id: 'sox-mgmt-assessment',
          name: 'Management Assessment',
          description: 'Management assessment of internal controls',
          category: 'governance',
          weight: 0.4,
          requirements: ['sox-302', 'sox-404'],
        },
        {
          id: 'sox-auditor-attestation',
          name: 'Auditor Attestation',
          description: 'External auditor attestation of internal controls',
          category: 'audit',
          weight: 0.3,
          requirements: ['sox-404b'],
        },
        {
          id: 'sox-disclosure',
          name: 'Disclosure Controls',
          description: 'Disclosure controls and procedures',
          category: 'reporting',
          weight: 0.3,
          requirements: ['sox-302', 'sox-906'],
        },
      ],
      requirements: [
        {
          id: 'sox-302',
          code: 'SOX 302',
          title: 'Corporate Responsibility for Financial Reports',
          description: 'CEO and CFO certification of financial reports and internal controls',
          category: 'certification',
          domainId: 'sox-mgmt-assessment',
          priority: 'critical',
          mandatory: true,
          testable: true,
          frequency: 'quarterly',
          evidenceTypes: ['certification', 'documentation', 'testing-results'],
          controlObjectives: ['sox-co-1', 'sox-co-2'],
          relatedRequirements: ['sox-404'],
          tags: ['certification', 'financial-reporting'],
        },
        {
          id: 'sox-404',
          code: 'SOX 404',
          title: 'Management Assessment of Internal Controls',
          description: 'Annual management assessment of internal control over financial reporting',
          category: 'internal-controls',
          domainId: 'sox-mgmt-assessment',
          priority: 'critical',
          mandatory: true,
          testable: true,
          frequency: 'annual',
          evidenceTypes: ['assessment-report', 'testing-results', 'documentation'],
          controlObjectives: ['sox-co-1', 'sox-co-3'],
          relatedRequirements: ['sox-302'],
          tags: ['internal-controls', 'assessment'],
        },
      ],
      controlObjectives: [
        {
          id: 'sox-co-1',
          code: 'SOX-CO-1',
          title: 'Financial Reporting Accuracy',
          description: 'Ensure accuracy and completeness of financial reporting',
          category: 'financial-reporting',
          riskCategory: ['financial', 'reporting'],
          maturityLevels: [
            {
              level: 1,
              name: 'Basic',
              description: 'Manual processes with basic controls',
              criteria: ['Manual review processes', 'Basic documentation'],
              evidenceTypes: ['manual-reviews', 'basic-documentation'],
            },
            {
              level: 3,
              name: 'Managed',
              description: 'Systematic controls with regular testing',
              criteria: ['Systematic control testing', 'Regular monitoring'],
              evidenceTypes: ['testing-reports', 'monitoring-reports'],
            },
            {
              level: 5,
              name: 'Optimized',
              description: 'Automated controls with continuous monitoring',
              criteria: ['Automated controls', 'Continuous monitoring'],
              evidenceTypes: ['automated-reports', 'continuous-monitoring'],
            },
          ],
          implementationGuidance:
            'Implement systematic controls over financial reporting processes',
          evidenceRequirements: ['Control documentation', 'Testing results', 'Management review'],
          testingProcedures: ['Walkthrough testing', 'Control testing', 'Substantive testing'],
          relatedControls: ['financial-close', 'journal-entries', 'account-reconciliation'],
        },
      ],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'U.S. Congress',
      website: 'https://www.congress.gov/bill/107th-congress/house-bill/3763',
    };
  }

  // Create ISO 27001 framework
  private createISO27001Framework(): ComplianceFramework {
    return {
      id: 'iso-27001-2022',
      name: 'ISO/IEC 27001:2022',
      description: 'Information security management systems requirements',
      version: '2022',
      type: 'standard',
      industry: ['technology', 'financial', 'healthcare', 'all'],
      geography: ['global'],
      mandatory: false,
      domains: [
        {
          id: 'iso27001-context',
          name: 'Context of Organization',
          description: 'Understanding organizational context and stakeholder needs',
          category: 'governance',
          weight: 0.1,
          requirements: ['iso27001-4.1', 'iso27001-4.2', 'iso27001-4.3'],
        },
        {
          id: 'iso27001-leadership',
          name: 'Leadership',
          description: 'Leadership commitment and information security policy',
          category: 'governance',
          weight: 0.2,
          requirements: ['iso27001-5.1', 'iso27001-5.2', 'iso27001-5.3'],
        },
        {
          id: 'iso27001-planning',
          name: 'Planning',
          description: 'Risk assessment, treatment, and objective setting',
          category: 'risk-management',
          weight: 0.2,
          requirements: ['iso27001-6.1', 'iso27001-6.2', 'iso27001-6.3'],
        },
        {
          id: 'iso27001-support',
          name: 'Support',
          description: 'Resources, competence, awareness, and communication',
          category: 'operations',
          weight: 0.15,
          requirements: ['iso27001-7.1', 'iso27001-7.2', 'iso27001-7.3'],
        },
        {
          id: 'iso27001-operation',
          name: 'Operation',
          description: 'Operational planning and control',
          category: 'operations',
          weight: 0.15,
          requirements: ['iso27001-8.1', 'iso27001-8.2', 'iso27001-8.3'],
        },
        {
          id: 'iso27001-evaluation',
          name: 'Performance Evaluation',
          description: 'Monitoring, measurement, analysis, and evaluation',
          category: 'monitoring',
          weight: 0.1,
          requirements: ['iso27001-9.1', 'iso27001-9.2', 'iso27001-9.3'],
        },
        {
          id: 'iso27001-improvement',
          name: 'Improvement',
          description: 'Nonconformity, corrective action, and continual improvement',
          category: 'improvement',
          weight: 0.08,
          requirements: ['iso27001-10.1', 'iso27001-10.2'],
        },
      ],
      requirements: [
        {
          id: 'iso27001-6.1.2',
          code: 'ISO 27001:6.1.2',
          title: 'Information Security Risk Assessment',
          description: 'Establish and maintain an information security risk assessment process',
          category: 'risk-assessment',
          domainId: 'iso27001-planning',
          priority: 'critical',
          mandatory: true,
          testable: true,
          frequency: 'annual',
          evidenceTypes: ['risk-assessment', 'methodology', 'results'],
          controlObjectives: ['iso27001-co-1'],
          relatedRequirements: ['iso27001-6.1.3'],
          tags: ['risk-assessment', 'methodology'],
        },
        {
          id: 'iso27001-a.5.1',
          code: 'A.5.1',
          title: 'Information Security Policies',
          description: 'Information security policy and topic-specific policies',
          category: 'policy',
          domainId: 'iso27001-leadership',
          priority: 'high',
          mandatory: true,
          testable: true,
          frequency: 'annual',
          evidenceTypes: ['policies', 'approval', 'communication'],
          controlObjectives: ['iso27001-co-2'],
          relatedRequirements: ['iso27001-5.2'],
          tags: ['policy', 'governance'],
        },
      ],
      controlObjectives: [
        {
          id: 'iso27001-co-1',
          code: 'ISO27001-CO-1',
          title: 'Information Security Risk Management',
          description: 'Systematic approach to managing information security risks',
          category: 'risk-management',
          riskCategory: ['cybersecurity', 'information'],
          maturityLevels: [
            {
              level: 1,
              name: 'Initial',
              description: 'Ad-hoc risk identification',
              criteria: ['Basic risk awareness', 'Informal processes'],
              evidenceTypes: ['informal-assessments'],
            },
            {
              level: 3,
              name: 'Defined',
              description: 'Systematic risk assessment process',
              criteria: ['Formal methodology', 'Regular assessments'],
              evidenceTypes: ['risk-assessments', 'methodology-docs'],
            },
            {
              level: 5,
              name: 'Optimizing',
              description: 'Continuous risk monitoring and improvement',
              criteria: ['Real-time monitoring', 'Predictive analytics'],
              evidenceTypes: ['monitoring-systems', 'analytics-reports'],
            },
          ],
          implementationGuidance: 'Implement systematic information security risk management',
          evidenceRequirements: ['Risk assessment methodology', 'Risk register', 'Treatment plans'],
          testingProcedures: ['Process review', 'Documentation review', 'Effectiveness testing'],
          relatedControls: ['risk-assessment', 'risk-treatment', 'risk-monitoring'],
        },
      ],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'ISO/IEC',
      website: 'https://www.iso.org/standard/27001',
    };
  }

  // Create NIST Cybersecurity Framework
  private createNISTFramework(): ComplianceFramework {
    return {
      id: 'nist-csf-2.0',
      name: 'NIST Cybersecurity Framework',
      description: 'Framework for improving critical infrastructure cybersecurity',
      version: '2.0',
      type: 'guideline',
      industry: ['critical-infrastructure', 'technology', 'all'],
      geography: ['US', 'global'],
      mandatory: false,
      domains: [
        {
          id: 'nist-govern',
          name: 'Govern (GV)',
          description: 'Governance and oversight of cybersecurity risk',
          category: 'governance',
          weight: 0.2,
          requirements: ['nist-gv-oc', 'nist-gv-rm', 'nist-gv-sc'],
        },
        {
          id: 'nist-identify',
          name: 'Identify (ID)',
          description: 'Asset management and risk assessment',
          category: 'identification',
          weight: 0.2,
          requirements: [
            'nist-id-am',
            'nist-id-be',
            'nist-id-gv',
            'nist-id-ra',
            'nist-id-rm',
            'nist-id-sc',
          ],
        },
        {
          id: 'nist-protect',
          name: 'Protect (PR)',
          description: 'Protective safeguards and controls',
          category: 'protection',
          weight: 0.2,
          requirements: [
            'nist-pr-ac',
            'nist-pr-at',
            'nist-pr-ds',
            'nist-pr-ip',
            'nist-pr-ma',
            'nist-pr-pt',
          ],
        },
        {
          id: 'nist-detect',
          name: 'Detect (DE)',
          description: 'Detection of cybersecurity events',
          category: 'detection',
          weight: 0.2,
          requirements: ['nist-de-ae', 'nist-de-cm', 'nist-de-dp'],
        },
        {
          id: 'nist-respond',
          name: 'Respond (RS)',
          description: 'Response to cybersecurity incidents',
          category: 'response',
          weight: 0.1,
          requirements: ['nist-rs-rp', 'nist-rs-co', 'nist-rs-an', 'nist-rs-mi', 'nist-rs-im'],
        },
        {
          id: 'nist-recover',
          name: 'Recover (RC)',
          description: 'Recovery from cybersecurity incidents',
          category: 'recovery',
          weight: 0.1,
          requirements: ['nist-rc-rp', 'nist-rc-im', 'nist-rc-co'],
        },
      ],
      requirements: [
        {
          id: 'nist-id-ra-1',
          code: 'ID.RA-1',
          title: 'Asset Vulnerabilities',
          description: 'Asset vulnerabilities are identified and documented',
          category: 'risk-assessment',
          domainId: 'nist-identify',
          priority: 'high',
          mandatory: false,
          testable: true,
          frequency: 'quarterly',
          evidenceTypes: ['vulnerability-scans', 'documentation', 'remediation-plans'],
          controlObjectives: ['nist-co-1'],
          relatedRequirements: ['nist-id-am-1'],
          tags: ['vulnerability', 'asset-management'],
        },
      ],
      controlObjectives: [
        {
          id: 'nist-co-1',
          code: 'NIST-CO-1',
          title: 'Cybersecurity Risk Management',
          description: 'Comprehensive cybersecurity risk management program',
          category: 'risk-management',
          riskCategory: ['cybersecurity', 'operational'],
          maturityLevels: [
            {
              level: 1,
              name: 'Partial',
              description: 'Some cybersecurity risk management practices',
              criteria: ['Ad-hoc risk identification', 'Basic security measures'],
              evidenceTypes: ['basic-assessments'],
            },
            {
              level: 2,
              name: 'Risk Informed',
              description: 'Risk management practices approved by management',
              criteria: ['Formal risk processes', 'Management oversight'],
              evidenceTypes: ['risk-policies', 'management-reports'],
            },
            {
              level: 3,
              name: 'Repeatable',
              description: 'Consistent risk management practices',
              criteria: ['Standardized processes', 'Regular execution'],
              evidenceTypes: ['process-documentation', 'regular-reports'],
            },
            {
              level: 4,
              name: 'Adaptive',
              description: 'Adaptive risk management based on lessons learned',
              criteria: ['Continuous improvement', 'Threat intelligence'],
              evidenceTypes: ['improvement-reports', 'threat-intelligence'],
            },
          ],
          implementationGuidance: 'Implement comprehensive cybersecurity risk management',
          evidenceRequirements: [
            'Risk assessment',
            'Controls implementation',
            'Monitoring results',
          ],
          testingProcedures: ['Control testing', 'Process review', 'Maturity assessment'],
          relatedControls: ['vulnerability-management', 'incident-response', 'business-continuity'],
        },
      ],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'NIST',
      website: 'https://www.nist.gov/cyberframework',
    };
  }

  // Create GDPR framework
  private createGDPRFramework(): ComplianceFramework {
    return {
      id: 'gdpr-2018',
      name: 'General Data Protection Regulation',
      description: 'EU regulation on data protection and privacy',
      version: '2018',
      type: 'regulatory',
      industry: ['all'],
      geography: ['EU', 'global'],
      mandatory: true,
      domains: [
        {
          id: 'gdpr-principles',
          name: 'Data Protection Principles',
          description: 'Fundamental principles for processing personal data',
          category: 'governance',
          weight: 0.3,
          requirements: ['gdpr-art5'],
        },
        {
          id: 'gdpr-rights',
          name: 'Data Subject Rights',
          description: 'Rights of individuals regarding their personal data',
          category: 'rights',
          weight: 0.3,
          requirements: ['gdpr-art15-22'],
        },
        {
          id: 'gdpr-accountability',
          name: 'Accountability',
          description: 'Controller and processor obligations and accountability',
          category: 'accountability',
          weight: 0.4,
          requirements: ['gdpr-art25', 'gdpr-art32', 'gdpr-art33'],
        },
      ],
      requirements: [
        {
          id: 'gdpr-art32',
          code: 'Article 32',
          title: 'Security of Processing',
          description: 'Appropriate technical and organizational measures to ensure security',
          category: 'security',
          domainId: 'gdpr-accountability',
          priority: 'critical',
          mandatory: true,
          testable: true,
          frequency: 'continuous',
          evidenceTypes: ['security-measures', 'risk-assessments', 'incident-procedures'],
          controlObjectives: ['gdpr-co-1'],
          relatedRequirements: ['gdpr-art25'],
          tags: ['security', 'technical-measures'],
        },
      ],
      controlObjectives: [
        {
          id: 'gdpr-co-1',
          code: 'GDPR-CO-1',
          title: 'Data Protection by Design and Default',
          description: 'Implement data protection principles in system design',
          category: 'privacy',
          riskCategory: ['privacy', 'data-protection'],
          maturityLevels: [
            {
              level: 1,
              name: 'Basic',
              description: 'Basic privacy measures implemented',
              criteria: ['Basic data protection measures'],
              evidenceTypes: ['basic-privacy-controls'],
            },
            {
              level: 3,
              name: 'Systematic',
              description: 'Systematic privacy by design implementation',
              criteria: ['Privacy impact assessments', 'Design reviews'],
              evidenceTypes: ['privacy-assessments', 'design-documentation'],
            },
            {
              level: 5,
              name: 'Advanced',
              description: 'Advanced privacy engineering practices',
              criteria: ['Automated privacy controls', 'Privacy metrics'],
              evidenceTypes: ['automated-controls', 'privacy-metrics'],
            },
          ],
          implementationGuidance: 'Implement privacy by design and default principles',
          evidenceRequirements: ['Privacy policies', 'Technical measures', 'Training records'],
          testingProcedures: ['Privacy impact assessment', 'Technical testing', 'Process review'],
          relatedControls: ['data-minimization', 'pseudonymization', 'encryption'],
        },
      ],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'European Union',
      website: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
    };
  }

  // Additional frameworks (COSO, SOC 2, PCI DSS, HIPAA) would be implemented similarly...
  private createCOSOFramework(): ComplianceFramework {
    // Implementation for COSO framework
    return {
      id: 'coso-2013',
      name: 'COSO Internal Control Framework',
      description: 'Committee of Sponsoring Organizations framework for internal control',
      version: '2013',
      type: 'guideline',
      industry: ['financial', 'all'],
      geography: ['global'],
      mandatory: false,
      domains: [],
      requirements: [],
      controlObjectives: [],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'COSO',
      website: 'https://www.coso.org',
    };
  }

  private createSOC2Framework(): ComplianceFramework {
    // Implementation for SOC 2 framework
    return {
      id: 'soc2-2017',
      name: 'SOC 2 Trust Services Criteria',
      description:
        'Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy',
      version: '2017',
      type: 'standard',
      industry: ['technology', 'service-providers'],
      geography: ['US', 'global'],
      mandatory: false,
      domains: [],
      requirements: [],
      controlObjectives: [],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'AICPA',
      website: 'https://www.aicpa.org',
    };
  }

  private createPCIDSSFramework(): ComplianceFramework {
    // Implementation for PCI DSS framework
    return {
      id: 'pcidss-4.0',
      name: 'PCI Data Security Standard',
      description: 'Payment Card Industry Data Security Standard',
      version: '4.0',
      type: 'standard',
      industry: ['payment-processing', 'retail', 'financial'],
      geography: ['global'],
      mandatory: true,
      domains: [],
      requirements: [],
      controlObjectives: [],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'PCI Security Standards Council',
      website: 'https://www.pcisecuritystandards.org',
    };
  }

  private createHIPAAFramework(): ComplianceFramework {
    // Implementation for HIPAA framework
    return {
      id: 'hipaa-2013',
      name: 'Health Insurance Portability and Accountability Act',
      description: 'U.S. legislation for healthcare information protection',
      version: '2013',
      type: 'regulatory',
      industry: ['healthcare'],
      geography: ['US'],
      mandatory: true,
      domains: [],
      requirements: [],
      controlObjectives: [],
      mappings: [],
      lastUpdated: new Date(),
      isActive: true,
      source: 'U.S. Department of Health and Human Services',
      website: 'https://www.hhs.gov/hipaa',
    };
  }

  // Initialize cross-framework mappings
  private async initializeFrameworkMappings(): Promise<void> {
    const mappings = [
      // SOX to ISO 27001 mappings
      {
        sourceFramework: 'sox-2002',
        targetFramework: 'iso-27001-2022',
        sourceRequirement: 'sox-404',
        targetRequirement: 'iso27001-6.1.2',
        mappingType: 'conceptual' as const,
        confidence: 0.7,
        notes: 'Both require systematic control assessment',
      },
      // NIST to ISO 27001 mappings
      {
        sourceFramework: 'nist-csf-2.0',
        targetFramework: 'iso-27001-2022',
        sourceRequirement: 'nist-id-ra-1',
        targetRequirement: 'iso27001-6.1.2',
        mappingType: 'partial' as const,
        confidence: 0.8,
        notes: 'Both address risk assessment requirements',
      },
    ];

    for (const mapping of mappings) {
      await this.createFrameworkMapping(mapping);
    }
  }

  // Search frameworks and requirements
  async searchFrameworks(_query: string,
    filters?: {
      frameworks?: string[];
      categories?: string[];
      priorities?: string[];
    }
  ): Promise<{
    frameworks: ComplianceFramework[];
    requirements: ComplianceRequirement[];
  }> {
    const searchTerms = query.toLowerCase().split(' ');

    // Search frameworks
    const frameworkWhere: any = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters?.frameworks) {
      frameworkWhere.id = { in: filters.frameworks };
    }

    const frameworks = await db.client.complianceFramework.findMany({
      where: frameworkWhere,
      take: 10,
    });

    // Search requirements
    const requirementWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters?.frameworks) {
      requirementWhere.frameworkId = { in: filters.frameworks };
    }

    if (filters?.categories) {
      requirementWhere.category = { in: filters.categories };
    }

    if (filters?.priorities) {
      requirementWhere.priority = { in: filters.priorities };
    }

    const requirements = await db.client.complianceRequirement.findMany({
      where: requirementWhere,
      include: {
        framework: true,
      },
      take: 20,
    });

    return { frameworks, requirements };
  }
}

export const complianceFrameworkManager = new ComplianceFrameworkManager();
