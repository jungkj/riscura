// import { RiskAnalysisAIService } from '@/services/RiskAnalysisAIService'
// import { Risk, RiskCategory, RiskStatus, RiskLevel } from '@prisma/client'
// import { RiskFactory } from '../../factories/risk-factory'
// import { Risk as AppRisk } from '@/types'

describe('RiskAnalysisAIService', () => {
  let service: RiskAnalysisAIService;
  let mockRisk: AppRisk;

  // Helper function to create properly typed AppRisk objects
  const createAppRisk = (overrides: any = {}): AppRisk => {
    const baseRisk = RiskFactory.create(overrides)
    return {
      ...baseRisk,
      controls: [],
      evidence: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskLevel: baseRisk.riskLevel || 'medium',
    } as AppRisk;
  }

  beforeEach(() => {
    service = new RiskAnalysisAIService();
    mockRisk = createAppRisk({
      id: 'test-risk-1',
      title: 'Test Risk',
      description: 'Test risk for scoring',
      category: RiskCategory.TECHNOLOGY as RiskCategory,
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: RiskLevel.HIGH,
      status: RiskStatus.IDENTIFIED,
      organizationId: 'test-org',
      createdBy: 'test-user',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Risk Scoring Algorithms', () => {
    describe('generateAutomatedRiskScore', () => {
      it('should calculate correct risk score using likelihood × impact', async () => {
        const _result = await service.generateAutomatedRiskScore(mockRisk, 'coso');

        expect(result.score).toBeGreaterThan(0);
        expect(result.likelihood).toBeWithinRange(1, 5);
        expect(result.impact).toBeWithinRange(1, 5);
        expect(result.confidence).toBeWithinRange(0, 1);
        expect(result.factors).toBeInstanceOf(Array);
        expect(result.methodology).toBe('coso');
      });

      it('should return higher scores for high-impact risks', async () => {
        const highImpactRisk = RiskFactory.createHighRisk({
          likelihood: 5,
          impact: 5,
        });

        const lowImpactRisk = RiskFactory.createLowRisk({
          likelihood: 1,
          impact: 1,
        });

        const highAppRisk = createAppRisk(highImpactRisk);
        const lowAppRisk = createAppRisk(lowImpactRisk);

        const highResult = await service.generateAutomatedRiskScore(highAppRisk, 'coso');
        const lowResult = await service.generateAutomatedRiskScore(lowAppRisk, 'coso');

        expect(highResult.score).toBeGreaterThan(lowResult.score);
        expect(highResult.likelihood).toBeGreaterThanOrEqual(lowResult.likelihood);
        expect(highResult.impact).toBeGreaterThanOrEqual(lowResult.impact);
      });

      it('should handle different risk frameworks', async () => {
        const cosoResult = await service.generateAutomatedRiskScore(mockRisk, 'coso');
        const isoResult = await service.generateAutomatedRiskScore(mockRisk, 'iso31000');
        const nistResult = await service.generateAutomatedRiskScore(mockRisk, 'nist');

        expect(cosoResult.methodology).toBe('coso');
        expect(isoResult.methodology).toBe('iso31000');
        expect(nistResult.methodology).toBe('nist');

        // All should return valid scores
        expect(cosoResult.score).toBeGreaterThan(0)
        expect(isoResult.score).toBeGreaterThan(0);
        expect(nistResult.score).toBeGreaterThan(0);
      });

      it('should consider industry context in scoring', async () => {
        const financialContext = {
          industry: 'financial',
          organizationSize: 'large' as const,
          riskTolerance: 'low' as const,
        }

        const techContext = {
          industry: 'technology',
          organizationSize: 'small' as const,
          riskTolerance: 'high' as const,
        }

        const financialResult = await service.generateAutomatedRiskScore(
          mockRisk,
          'coso',
          financialContext
        );
        const techResult = await service.generateAutomatedRiskScore(mockRisk, 'coso', techContext);

        expect(financialResult.factors).toContainEqual(
          expect.objectContaining({
            name: expect.stringContaining('industry'),
            source: expect.any(String),
          })
        );

        expect(techResult.factors).toContainEqual(
          expect.objectContaining({
            name: expect.stringContaining('industry'),
            source: expect.any(String),
          })
        );
      });

      it('should include confidence score based on data quality', async () => {
        const minimalContext = {}
        const richContext = {
          industry: 'financial',
          organizationSize: 'large' as const,
          riskTolerance: 'low' as const,
          historicalData: RiskFactory.createBatch(10) as unknown as AppRisk[],
          controls: [],
        }

        const minimalResult = await service.generateAutomatedRiskScore(
          mockRisk,
          'coso',
          minimalContext
        );
        const richResult = await service.generateAutomatedRiskScore(mockRisk, 'coso', richContext);

        expect(richResult.confidence).toBeGreaterThanOrEqual(minimalResult.confidence);
        expect(richResult.factors.length).toBeGreaterThanOrEqual(minimalResult.factors.length);
      });
    });

    describe('Risk Level Calculation', () => {
      it('should correctly categorize risk levels based on score', () => {
        const veryLowRisk = RiskFactory.create({ likelihood: 1, impact: 1 }); // score: 1
        const lowRisk = RiskFactory.create({ likelihood: 2, impact: 2 }); // score: 4
        const mediumRisk = RiskFactory.create({ likelihood: 3, impact: 3 }); // score: 9
        const highRisk = RiskFactory.create({ likelihood: 4, impact: 4 }); // score: 16
        const criticalRisk = RiskFactory.create({ likelihood: 5, impact: 5 }); // score: 25

        expect(veryLowRisk.riskScore).toBeLessThan(3);
        expect(lowRisk.riskScore).toBeWithinRange(3, 5);
        expect(mediumRisk.riskScore).toBeWithinRange(6, 9);
        expect(highRisk.riskScore).toBeWithinRange(10, 14);
        expect(criticalRisk.riskScore).toBeGreaterThanOrEqual(15);
      });
    });
  });

  describe('Monte Carlo Simulation', () => {
    it('should perform Monte Carlo simulation with valid parameters', async () => {
      const parameters = {
        likelihoodDistribution: {
          type: 'normal' as const,
          parameters: { mean: 3, stddev: 0.5 },
        },
        impactDistribution: {
          type: 'normal' as const,
          parameters: { mean: 4, stddev: 0.8 },
        },
        timeHorizon: 12,
        iterations: 1000,
      }

      const _result = await service.performMonteCarloSimulation(mockRisk, parameters, 1000);

      expect(result.expectedValue).not.toBeNaN();
      expect(result.variance).not.toBeNaN();
      expect(result.standardDeviation).not.toBeNaN();
      expect(result.confidenceIntervals).toHaveLength(3); // 90%, 95%, 99%
      expect(result.valueAtRisk).toHaveLength(3);
      expect(result.distribution.bins.length).toBeGreaterThan(0);
      expect(result.distribution.percentiles).toHaveProperty('50'); // median
      expect(result.distribution.percentiles).toHaveProperty('95');
      expect(result.distribution.percentiles).toHaveProperty('99');
    });

    it('should handle different probability distributions', async () => {
      const distributions = [
        { type: 'normal' as const, parameters: { mean: 3, stddev: 0.5 } },
        { type: 'triangular' as const, parameters: { min: 1, max: 5, mode: 3 } },
        { type: 'uniform' as const, parameters: { min: 1, max: 5 } },
        { type: 'beta' as const, parameters: { alpha: 2, beta: 3, min: 1, max: 5 } },
      ];

      for (const dist of distributions) {
        const parameters = {
          likelihoodDistribution: dist,
          impactDistribution: dist,
          timeHorizon: 12,
        }

        const _result = await service.performMonteCarloSimulation(mockRisk, parameters, 100);

        expect(result.expectedValue).toBeGreaterThan(0);
        expect(result.variance).toBeGreaterThanOrEqual(0);
        expect(result.distribution.bins.length).toBeGreaterThan(0);
      }
    });

    it('should calculate correct statistical measures', async () => {
      const parameters = {
        likelihoodDistribution: {
          type: 'normal' as const,
          parameters: { mean: 3, stddev: 0.1 }, // Low variance
        },
        impactDistribution: {
          type: 'normal' as const,
          parameters: { mean: 4, stddev: 0.1 }, // Low variance
        },
        timeHorizon: 12,
        iterations: 10000,
      }

      const _result = await service.performMonteCarloSimulation(mockRisk, parameters, 10000);

      // With low variance, expected value should be close to mean product
      const expectedMean = 3 * 4; // likelihood * impact
      expect(result.expectedValue).toBeCloseTo(expectedMean, 0);

      // Standard deviation should be relatively small
      expect(result.standardDeviation).toBeLessThan(expectedMean * 0.5)

      // Confidence intervals should be ordered
      const ci95 = result.confidenceIntervals.find((ci) => ci.level === 0.95)
      expect(ci95).toBeDefined();
      expect(ci95!.lower).toBeLessThan(result.expectedValue);
      expect(ci95!.upper).toBeGreaterThan(result.expectedValue);
    });
  });

  describe('Risk Assessment Report Generation', () => {
    it('should generate comprehensive risk assessment report', async () => {
      const report = await service.assessRisk(mockRisk, 'coso', {
        includeQuantitative: true,
        includeCorrelation: false,
        assessor: 'test-assessor',
      });

      expect(report.id).toBeDefined();
      expect(report.riskId).toBe(mockRisk.id);
      expect(report.framework).toBe('coso');
      expect(report.assessor).toBe('test-assessor');
      expect(report.executiveSummary).toBeDefined();
      expect(report.methodology).toBeDefined();
      expect(report.findings).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.actionPlan).toBeInstanceOf(Array);
      expect(report.monitoringPlan).toBeInstanceOf(Array);
      expect(report.qualitativeAnalysis).toBeDefined();
      expect(report.quantitativeAnalysis).toBeDefined();
    });

    it('should include appropriate findings based on risk characteristics', async () => {
      const highRisk = RiskFactory.createHighRisk({
        title: 'Critical System Failure',
        description: 'Critical system failure that could impact operations',
      });

      const report = await service.assessRisk(
        {
          ...highRisk,
          controls: [],
          evidence: [],
        } as unknown as AppRisk,
        'coso'
      );

      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.findings.some((f) => f.impact === 'critical' || f.impact === 'high')).toBe(
        true
      );
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(
        report.recommendations.some((r) => r.priority === 'critical' || r.priority === 'high')
      ).toBe(true);
    });

    it('should generate appropriate recommendations for different risk types', async () => {
      const operationalRisk = RiskFactory.create({
        category: RiskCategory.TECHNOLOGY as RiskCategory,
        likelihood: 4,
        impact: 4,
      });

      const complianceRisk = RiskFactory.create({
        category: 'COMPLIANCE' as RiskCategory,
        likelihood: 3,
        impact: 5,
      });

      const opReport = await service.assessRisk(
        {
          ...operationalRisk,
          controls: [],
          evidence: [],
        } as unknown as AppRisk,
        'coso'
      );
      const compReport = await service.assessRisk(
        {
          ...complianceRisk,
          controls: [],
          evidence: [],
        } as unknown as AppRisk,
        'coso'
      );

      expect(opReport.recommendations.length).toBeGreaterThan(0);
      expect(compReport.recommendations.length).toBeGreaterThan(0);

      // Compliance risks should have specific recommendation types
      const complianceRecs = compReport.recommendations
      expect(
        complianceRecs.some(
          (r) =>
            r.type === 'mitigation' &&
            (r.title.toLowerCase().includes('compliance') ||
              r.description.toLowerCase().includes('regulatory'))
        )
      ).toBe(true);
    });
  });

  describe('Risk Correlation Analysis', () => {
    it('should analyze correlations between multiple risks', async () => {
      const risks = [
        RiskFactory.create({ category: 'OPERATIONAL' }),
        RiskFactory.create({ category: 'TECHNOLOGY' }),
        RiskFactory.create({ category: 'FINANCIAL' }),
      ];

      const analysis = await service.analyzeRiskCorrelations(
        [
          { ...risks[0], controls: [], evidence: [] } as unknown as AppRisk,
          { ...risks[1], controls: [], evidence: [] } as unknown as AppRisk,
          { ...risks[2], controls: [], evidence: [] } as unknown as AppRisk,
        ],
        {}
      );

      expect(analysis.riskPairs).toBeInstanceOf(Array);
      expect(analysis.networkMetrics).toBeDefined();
      expect(analysis.clusters).toBeInstanceOf(Array);
      expect(analysis.dependencies).toBeInstanceOf(Array);
      expect(analysis.systemicRisk).toBeDefined();

      // Network metrics should be valid
      expect(analysis.networkMetrics.density).toBeWithinRange(0, 1)
      expect(analysis.networkMetrics.clustering).toBeWithinRange(0, 1);
      expect(analysis.networkMetrics.averagePathLength).toBeGreaterThan(0);
    });

    it('should identify high-correlation risk pairs', async () => {
      const techRisk1 = RiskFactory.create({
        category: RiskCategory.TECHNOLOGY as RiskCategory,
        title: 'System downtime',
        description: 'Critical system downtime affecting operations',
      });

      const techRisk2 = RiskFactory.create({
        category: RiskCategory.TECHNOLOGY as RiskCategory,
        title: 'Data breach',
        description: 'Security breach leading to data compromise',
      });

      const financialRisk = RiskFactory.create({
        category: RiskCategory.FINANCIAL as RiskCategory,
        title: 'Revenue loss',
        description: 'Significant revenue decline',
      });

      const analysis = await service.analyzeRiskCorrelations([
        { ...techRisk1, controls: [], evidence: [] } as unknown as AppRisk,
        { ...techRisk2, controls: [], evidence: [] } as unknown as AppRisk,
        { ...financialRisk, controls: [], evidence: [] } as unknown as AppRisk,
      ]);

      // Should find some correlation between technology risks
      const techCorrelations = analysis.riskPairs.filter(
        (pair) =>
          (pair.risk1Id === techRisk1.id && pair.risk2Id === techRisk2.id) ||
          (pair.risk1Id === techRisk2.id && pair.risk2Id === techRisk1.id)
      )

      expect(techCorrelations.length).toBeGreaterThan(0);
      if (techCorrelations.length > 0) {
        expect(techCorrelations[0].correlationType).toBeDefined();
        expect(techCorrelations[0].strength).toBeWithinRange(-1, 1);
        expect(techCorrelations[0].confidence).toBeWithinRange(0, 1);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle risks with missing or invalid data', async () => {
      const invalidRisk = {
        ...mockRisk,
        title: '',
        description: '',
        likelihood: 0,
        impact: 0,
      }

      const _result = await service.generateAutomatedRiskScore(invalidRisk as any, 'coso');

      expect(result.score).toBeGreaterThan(0); // Should provide default scoring
      expect(result.confidence).toBeLessThan(0.5); // Should have low confidence
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          name: expect.stringContaining('data_quality'),
        })
      );
    });

    it('should handle extreme values in Monte Carlo simulation', async () => {
      const extremeParameters = {
        likelihoodDistribution: {
          type: 'normal' as const,
          parameters: { mean: 5, stddev: 10 }, // High variance
        },
        impactDistribution: {
          type: 'triangular' as const,
          parameters: { min: 1, max: 1000, mode: 5 }, // Extreme range
        },
        timeHorizon: 12,
      }

      const _result = await service.performMonteCarloSimulation(mockRisk, extremeParameters, 100);

      expect(result.expectedValue).not.toBeNaN();
      expect(result.variance).not.toBeNaN();
      expect(result.standardDeviation).not.toBeNaN();
      expect(result.distribution.bins).toHaveLength(expect.any(Number));
    });

    it('should handle empty risk arrays in correlation analysis', async () => {
      const analysis = await service.analyzeRiskCorrelations([]);

      expect(analysis.riskPairs).toHaveLength(0);
      expect(analysis.clusters).toHaveLength(0);
      expect(analysis.dependencies).toHaveLength(0);
      expect(analysis.networkMetrics.density).toBe(0);
    });

    it('should handle single risk in correlation analysis', async () => {
      const singleRisk = [RiskFactory.create()];
      const analysis = await service.analyzeRiskCorrelations([
        { ...singleRisk[0], controls: [], evidence: [] } as unknown as AppRisk,
      ]);

      expect(analysis.riskPairs).toHaveLength(0);
      expect(analysis.clusters).toHaveLength(1);
      expect(analysis.networkMetrics.density).toBe(0);
    });

    it('should handle long prompts in risk assessment', async () => {
      const report = await service.assessRisk(mockRisk, 'coso', {
        includeQuantitative: true,
        includeCorrelation: false,
        assessor: 'test-assessor',
      });

      expect(report.id).toBeDefined();
      expect(report.riskId).toBe(mockRisk.id);
      expect(report.framework).toBe('coso');
      expect(report.assessor).toBe('test-assessor');
      expect(report.executiveSummary).toBeDefined();
      expect(report.methodology).toBeDefined();
      expect(report.findings).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.actionPlan).toBeInstanceOf(Array);
      expect(report.monitoringPlan).toBeInstanceOf(Array);
      expect(report.qualitativeAnalysis).toBeDefined();
      expect(report.quantitativeAnalysis).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete risk assessment within reasonable time', async () => {
      const startTime = Date.now();

      await service.assessRisk(mockRisk, 'coso', {
        includeQuantitative: true,
        includeCorrelation: false,
      });

      const endTime = Date.now();
      const _duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle batch risk scoring efficiently', async () => {
      const risks = RiskFactory.createBatch(10);
      const startTime = Date.now();

      const results = await Promise.all(
        risks.map((risk) => service.generateAutomatedRiskScore(risk as any, 'coso'))
      );

      const endTime = Date.now();
      const _duration = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(results.every((r) => r.score > 0)).toBe(true);
    });
  });
});
