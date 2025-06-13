import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { riskAnalysisAIService } from '@/services/RiskAnalysisAIService';
import { controlEffectivenessService } from '@/services/ControlEffectivenessService';
import { cosoFrameworkService } from '@/lib/compliance/coso-framework';
import { iso31000FrameworkService } from '@/lib/compliance/iso31000-framework';
import { nistFrameworkService } from '@/lib/compliance/nist-framework';

interface ExecuteAssessmentRequest {
  includeQuantitative?: boolean;
  includeCorrelation?: boolean;
  targetMaturity?: number;
  analysisOptions?: {
    riskScoring?: boolean;
    controlEffectiveness?: boolean;
    complianceGaps?: boolean;
    recommendations?: boolean;
  };
}

interface AssessmentResults {
  riskAssessment: {
    totalRisks: number;
    risksByLevel: Record<string, number>;
    topRisks: any[];
    riskScores: any[];
    inherentVsResidual: any;
  };
  controlEffectiveness: {
    totalControls: number;
    averageEffectiveness: number;
    controlsByEffectiveness: Record<string, number>;
    topControls: any[];
    gaps: any[];
  };
  complianceAssessment: {
    framework: string;
    overallScore: number;
    overallRating: string;
    componentScores: any[];
    gaps: any[];
    materialWeaknesses: any[];
  };
  recommendations: any[];
  actionPlan: any[];
  executiveSummary: string;
}

// POST /api/assessments/[id]/execute - Execute assessment analysis
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assessmentId = params.id;
    const body: ExecuteAssessmentRequest = await request.json();

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get assessment with related data
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        organizationId: user.organizationId
      },
      include: {
        documents: true,
        risks: {
          include: {
            controls: {
              include: {
                control: true
              }
            }
          }
        },
        controls: true,
        organization: true
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Update assessment status to IN_PROGRESS
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'IN_PROGRESS',
        progress: 10
      }
    });

    try {
      // Execute assessment analysis
      const results = await executeAssessmentAnalysis(
        assessment,
        body,
        session.user.id
      );

      // Update assessment with results
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          results: results as any,
          completedAt: new Date()
        }
      });

      // Create audit trail entry
      await prisma.activity.create({
        data: {
          type: 'ASSESSMENT_EXECUTED',
          description: `Assessment "${assessment.name}" analysis completed`,
          userId: session.user.id,
          organizationId: user.organizationId,
          metadata: {
            assessmentId: assessmentId,
            framework: assessment.framework,
            resultsGenerated: true
          }
        }
      });

      return NextResponse.json({
        message: 'Assessment executed successfully',
        results
      });

    } catch (analysisError) {
      console.error('Assessment analysis failed:', analysisError);
      
      // Update assessment status to FAILED
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'FAILED',
          progress: 0
        }
      });

      return NextResponse.json(
        { error: 'Assessment analysis failed', details: analysisError },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error executing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to execute assessment' },
      { status: 500 }
    );
  }
}

async function executeAssessmentAnalysis(
  assessment: any,
  options: ExecuteAssessmentRequest,
  assessorId: string
): Promise<AssessmentResults> {
  
  const risks = assessment.risks || [];
  const controls = assessment.controls || [];
  const framework = assessment.framework;

  // 1. Risk Assessment Analysis
  const riskAssessment = await performRiskAssessment(
    risks,
    controls,
    framework,
    options
  );

  // 2. Control Effectiveness Analysis
  const controlEffectiveness = await performControlEffectivenessAnalysis(
    controls,
    risks
  );

  // 3. Compliance Framework Assessment
  const complianceAssessment = await performComplianceAssessment(
    framework,
    risks,
    controls,
    assessment.organizationId,
    assessorId
  );

  // 4. Generate Recommendations
  const recommendations = await generateRecommendations(
    riskAssessment,
    controlEffectiveness,
    complianceAssessment,
    framework
  );

  // 5. Create Action Plan
  const actionPlan = await createActionPlan(
    recommendations,
    complianceAssessment.materialWeaknesses || []
  );

  // 6. Generate Executive Summary
  const executiveSummary = generateExecutiveSummary(
    riskAssessment,
    controlEffectiveness,
    complianceAssessment,
    recommendations
  );

  return {
    riskAssessment,
    controlEffectiveness,
    complianceAssessment,
    recommendations,
    actionPlan,
    executiveSummary
  };
}

async function performRiskAssessment(
  risks: any[],
  controls: any[],
  framework: string,
  options: ExecuteAssessmentRequest
) {
  const riskScores = [];
  const risksByLevel = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  let totalInherentRisk = 0;
  let totalResidualRisk = 0;

  for (const risk of risks) {
    try {
      // Perform AI-powered risk assessment
      const riskReport = await riskAnalysisAIService.assessRisk(
        risk,
        framework as any,
        {
          includeQuantitative: options.includeQuantitative,
          includeCorrelation: options.includeCorrelation,
          controls: controls,
          assessor: 'ARIA Assessment Engine'
        }
      );

      // Calculate inherent vs residual risk
      const inherentVsResidual = await riskAnalysisAIService.calculateInherentVsResidualRisk(
        risk,
        controls.filter(c => risk.linkedRisks?.includes(c.id))
      );

      const riskLevel = riskAnalysisAIService.categorizeRiskLevel(risk.riskScore);
      risksByLevel[riskLevel]++;

      totalInherentRisk += inherentVsResidual.inherentRisk;
      totalResidualRisk += inherentVsResidual.residualRisk;

      riskScores.push({
        riskId: risk.id,
        title: risk.title,
        category: risk.category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel,
        inherentRisk: inherentVsResidual.inherentRisk,
        residualRisk: inherentVsResidual.residualRisk,
        controlEffectiveness: inherentVsResidual.controlEffectiveness,
        riskReduction: inherentVsResidual.riskReduction,
        aiConfidence: riskReport.metadata.dataQuality,
        recommendations: riskReport.recommendations.slice(0, 3)
      });

    } catch (error) {
      console.error(`Error assessing risk ${risk.id}:`, error);
      // Continue with basic assessment
      const riskLevel = riskAnalysisAIService.categorizeRiskLevel(risk.riskScore);
      risksByLevel[riskLevel]++;
      
      riskScores.push({
        riskId: risk.id,
        title: risk.title,
        category: risk.category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel,
        inherentRisk: risk.riskScore,
        residualRisk: risk.riskScore,
        controlEffectiveness: 0,
        riskReduction: 0,
        aiConfidence: 0.5,
        recommendations: []
      });
    }
  }

  // Sort risks by score (highest first)
  const topRisks = riskScores
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  return {
    totalRisks: risks.length,
    risksByLevel,
    topRisks,
    riskScores,
    inherentVsResidual: {
      totalInherentRisk,
      totalResidualRisk,
      overallRiskReduction: totalInherentRisk > 0 
        ? Math.round(((totalInherentRisk - totalResidualRisk) / totalInherentRisk) * 100)
        : 0,
      averageControlEffectiveness: riskScores.length > 0
        ? Math.round(riskScores.reduce((sum, r) => sum + r.controlEffectiveness, 0) / riskScores.length)
        : 0
    }
  };
}

async function performControlEffectivenessAnalysis(
  controls: any[],
  risks: any[]
) {
  const controlAssessments = [];
  const controlsByEffectiveness = { high: 0, medium: 0, low: 0 };
  let totalEffectiveness = 0;
  const gaps = [];

  for (const control of controls) {
    try {
      // Get related risks for this control
      const relatedRisks = risks.filter(risk => 
        control.linkedRisks?.includes(risk.id)
      );

      // Assess control effectiveness
      const effectiveness = await controlEffectivenessService.assessControlEffectiveness(
        control,
        relatedRisks
      );

      const effectivenessCategory = effectiveness.effectivenessScore >= 80 ? 'high' :
                                   effectiveness.effectivenessScore >= 60 ? 'medium' : 'low';
      
      controlsByEffectiveness[effectivenessCategory]++;
      totalEffectiveness += effectiveness.effectivenessScore;

      controlAssessments.push({
        controlId: control.id,
        title: control.title,
        type: control.type,
        effectivenessScore: effectiveness.effectivenessScore,
        effectivenessCategory,
        coveragePercentage: effectiveness.coverageAnalysis.coveragePercentage,
        gapCount: effectiveness.gapAnalysis.identifiedGaps.length,
        recommendations: effectiveness.recommendations.slice(0, 3),
        nextAssessment: effectiveness.nextAssessment,
        confidence: effectiveness.confidence
      });

      // Add significant gaps to overall gaps list
      effectiveness.gapAnalysis.priorityGaps.forEach(gap => {
        gaps.push({
          controlId: control.id,
          controlTitle: control.title,
          gapType: gap.gapType,
          description: gap.description,
          severity: gap.severity,
          impact: gap.impact,
          effort: gap.effort,
          cost: gap.cost
        });
      });

    } catch (error) {
      console.error(`Error assessing control ${control.id}:`, error);
      // Continue with basic assessment
      const basicEffectiveness = typeof control.effectiveness === 'number' 
        ? control.effectiveness 
        : control.effectiveness === 'high' ? 80 : control.effectiveness === 'medium' ? 60 : 40;

      const effectivenessCategory = basicEffectiveness >= 80 ? 'high' :
                                   basicEffectiveness >= 60 ? 'medium' : 'low';
      
      controlsByEffectiveness[effectivenessCategory]++;
      totalEffectiveness += basicEffectiveness;

      controlAssessments.push({
        controlId: control.id,
        title: control.title,
        type: control.type,
        effectivenessScore: basicEffectiveness,
        effectivenessCategory,
        coveragePercentage: 50,
        gapCount: 0,
        recommendations: [],
        nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        confidence: 0.5
      });
    }
  }

  // Sort controls by effectiveness (highest first)
  const topControls = controlAssessments
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    .slice(0, 10);

  return {
    totalControls: controls.length,
    averageEffectiveness: controls.length > 0 ? Math.round(totalEffectiveness / controls.length) : 0,
    controlsByEffectiveness,
    topControls,
    gaps: gaps.sort((a, b) => b.impact - a.impact).slice(0, 20),
    controlAssessments
  };
}

async function performComplianceAssessment(
  framework: string,
  risks: any[],
  controls: any[],
  organizationId: string,
  assessorId: string
) {
  try {
    switch (framework) {
      case 'coso':
        const cosoAssessment = await cosoFrameworkService.performCOSOAssessment(
          organizationId,
          risks,
          controls,
          assessorId
        );
        
        return {
          framework: 'COSO',
          overallScore: cosoAssessment.overallScore,
          overallRating: cosoAssessment.overallRating,
          componentScores: cosoAssessment.componentAssessments.map(comp => ({
            componentId: comp.componentId,
            componentName: comp.componentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            score: comp.componentScore,
            rating: comp.componentRating,
            strengths: comp.strengths,
            deficiencies: comp.deficiencies,
            recommendations: comp.recommendations
          })),
          gaps: cosoAssessment.deficiencies.map(def => ({
            type: def.type,
            severity: def.severity,
            component: def.component,
            description: def.description,
            recommendation: def.recommendation,
            timeline: def.timeline,
            owner: def.owner
          })),
          materialWeaknesses: cosoAssessment.materialWeaknesses,
          recommendations: cosoAssessment.recommendations,
          actionPlan: cosoAssessment.actionPlan
        };

      case 'iso31000':
        const iso31000Assessment = await iso31000FrameworkService.performISO31000Assessment(
          organizationId,
          risks,
          controls,
          assessorId
        );
        
        return {
          framework: 'ISO 31000',
          overallScore: iso31000Assessment.overallMaturity * 25, // Convert to percentage
          overallRating: iso31000Assessment.overallMaturity >= 4 ? 'effective' : 
                        iso31000Assessment.overallMaturity >= 3 ? 'largely_effective' :
                        iso31000Assessment.overallMaturity >= 2 ? 'partially_effective' : 'ineffective',
          componentScores: iso31000Assessment.processAssessments.map(proc => ({
            componentId: proc.processId,
            componentName: proc.processId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            score: proc.score,
            rating: proc.maturityLevel >= 4 ? 'effective' : 
                   proc.maturityLevel >= 3 ? 'largely_effective' :
                   proc.maturityLevel >= 2 ? 'partially_effective' : 'ineffective',
            strengths: proc.strengths,
            deficiencies: proc.weaknesses,
            recommendations: proc.recommendations
          })),
          gaps: iso31000Assessment.gaps.map(gap => ({
            type: 'process',
            severity: gap.impact === 'high' ? 'material' : 'significant',
            component: gap.processId,
            description: `Process maturity gap: ${gap.gap} levels`,
            recommendation: `Improve ${gap.processId} maturity`,
            timeline: '90 days',
            owner: 'Process Owner'
          })),
          materialWeaknesses: [],
          recommendations: iso31000Assessment.recommendations,
          actionPlan: iso31000Assessment.improvementPlan.phases.map(phase => ({
            id: `phase-${phase.phase}`,
            title: phase.name,
            description: phase.activities.join(', '),
            owner: 'Process Owner',
            dueDate: new Date(Date.now() + phase.duration * 24 * 60 * 60 * 1000),
            priority: 'medium',
            status: 'not_started',
            dependencies: [],
            progress: 0
          }))
        };

      case 'nist':
        const nistAssessment = await nistFrameworkService.performNISTAssessment(
          organizationId,
          risks,
          controls,
          assessorId
        );
        
        return {
          framework: 'NIST CSF',
          overallScore: nistAssessment.overallTier * 25, // Convert to percentage
          overallRating: nistAssessment.overallTier >= 4 ? 'adaptive' : 
                        nistAssessment.overallTier >= 3 ? 'repeatable' :
                        nistAssessment.overallTier >= 2 ? 'risk_informed' : 'partial',
          componentScores: nistAssessment.functionAssessments.map(func => ({
            componentId: func.functionId,
            componentName: func.functionId.toUpperCase(),
            score: func.score,
            rating: func.tier >= 4 ? 'adaptive' : 
                   func.tier >= 3 ? 'repeatable' :
                   func.tier >= 2 ? 'risk_informed' : 'partial',
            strengths: func.strengths,
            deficiencies: func.weaknesses,
            recommendations: func.recommendations
          })),
          gaps: nistAssessment.gaps.map(gap => ({
            type: 'function',
            severity: gap.impact === 'high' ? 'material' : 'significant',
            component: gap.functionId,
            description: gap.description,
            recommendation: `Improve ${gap.functionId} from tier ${gap.currentTier} to ${gap.targetTier}`,
            timeline: '120 days',
            owner: 'Function Owner'
          })),
          materialWeaknesses: [],
          recommendations: nistAssessment.recommendations,
          actionPlan: nistAssessment.implementationPlan.phases.map(phase => ({
            id: `phase-${phase.phase}`,
            title: phase.name,
            description: phase.activities.join(', '),
            owner: 'Implementation Team',
            dueDate: new Date(Date.now() + phase.duration * 24 * 60 * 60 * 1000),
            priority: 'medium',
            status: 'not_started',
            dependencies: [],
            progress: 0
          }))
        };

      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }

  } catch (error) {
    console.error(`Error performing ${framework} assessment:`, error);
    
    // Return basic assessment if framework-specific assessment fails
    return {
      framework: framework.toUpperCase(),
      overallScore: 50,
      overallRating: 'partially_effective',
      componentScores: [],
      gaps: [],
      materialWeaknesses: [],
      recommendations: [],
      actionPlan: []
    };
  }
}

async function generateRecommendations(
  riskAssessment: any,
  controlEffectiveness: any,
  complianceAssessment: any,
  framework: string
) {
  const recommendations = [];

  // Risk-based recommendations
  riskAssessment.topRisks.slice(0, 5).forEach((risk: any) => {
    if (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'HIGH') {
      recommendations.push({
        id: `risk-rec-${risk.riskId}`,
        type: 'risk_mitigation',
        priority: risk.riskLevel === 'CRITICAL' ? 'critical' : 'high',
        title: `Mitigate ${risk.title}`,
        description: `Address high-impact risk with score ${risk.riskScore}`,
        rationale: `Risk level: ${risk.riskLevel}, Control effectiveness: ${risk.controlEffectiveness}%`,
        implementation: [
          'Review and enhance existing controls',
          'Implement additional mitigation measures',
          'Increase monitoring frequency',
          'Develop contingency plans'
        ],
        timeline: risk.riskLevel === 'CRITICAL' ? 30 : 60,
        cost: risk.riskLevel === 'CRITICAL' ? 50000 : 25000,
        expectedBenefit: `Reduce risk score by ${Math.round(risk.riskScore * 0.3)}`,
        category: risk.category
      });
    }
  });

  // Control effectiveness recommendations
  controlEffectiveness.gaps.slice(0, 5).forEach((gap: any) => {
    if (gap.severity === 'high' || gap.severity === 'critical') {
      recommendations.push({
        id: `control-rec-${gap.controlId}`,
        type: 'control_improvement',
        priority: gap.severity === 'critical' ? 'critical' : 'high',
        title: `Improve ${gap.controlTitle}`,
        description: `Address ${gap.gapType} gap: ${gap.description}`,
        rationale: `Gap severity: ${gap.severity}, Impact: ${gap.impact}%`,
        implementation: [
          'Redesign control procedures',
          'Enhance control testing',
          'Improve documentation',
          'Provide additional training'
        ],
        timeline: gap.effort === 'high' ? 90 : gap.effort === 'medium' ? 60 : 30,
        cost: gap.cost || 15000,
        expectedBenefit: `Improve control effectiveness by ${Math.round(gap.impact / 2)}%`,
        category: gap.gapType
      });
    }
  });

  // Compliance framework recommendations
  complianceAssessment.gaps.slice(0, 5).forEach((gap: any, index: number) => {
    recommendations.push({
      id: `compliance-rec-${index}`,
      type: 'compliance_improvement',
      priority: gap.severity === 'material' ? 'critical' : 'high',
      title: `Address ${framework} Gap`,
      description: gap.description,
      rationale: `Compliance gap in ${gap.component}: ${gap.severity} severity`,
      implementation: [
        gap.recommendation,
        'Update policies and procedures',
        'Implement monitoring controls',
        'Conduct regular assessments'
      ],
      timeline: 90,
      cost: 20000,
      expectedBenefit: 'Improved compliance posture',
      category: gap.component
    });
  });

  // Sort by priority and return top recommendations
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return recommendations
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 15);
}

async function createActionPlan(
  recommendations: any[],
  materialWeaknesses: any[]
) {
  const actionItems = [];

  // Create action items for top recommendations
  recommendations.slice(0, 10).forEach((rec, index) => {
    actionItems.push({
      id: `action-${rec.id}`,
      title: rec.title,
      description: rec.description,
      owner: 'Risk Manager',
      dueDate: new Date(Date.now() + rec.timeline * 24 * 60 * 60 * 1000),
      priority: rec.priority,
      status: 'not_started',
      dependencies: [],
      progress: 0,
      estimatedCost: rec.cost,
      expectedBenefit: rec.expectedBenefit,
      category: rec.category,
      implementation: rec.implementation
    });
  });

  // Create action items for material weaknesses
  materialWeaknesses.forEach((mw: any) => {
    actionItems.push({
      id: `action-mw-${mw.id}`,
      title: `Remediate ${mw.title}`,
      description: mw.description,
      owner: mw.remediation?.owner || 'Compliance Manager',
      dueDate: new Date(Date.now() + (mw.remediation?.timeline || 90) * 24 * 60 * 60 * 1000),
      priority: 'critical',
      status: 'not_started',
      dependencies: [],
      progress: 0,
      estimatedCost: mw.remediation?.budget || 50000,
      expectedBenefit: 'Address material weakness',
      category: 'compliance',
      implementation: ['Develop remediation plan', 'Implement controls', 'Test effectiveness']
    });
  });

  return actionItems.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function generateExecutiveSummary(
  riskAssessment: any,
  controlEffectiveness: any,
  complianceAssessment: any,
  recommendations: any[]
): string {
  const criticalRisks = riskAssessment.risksByLevel.CRITICAL || 0;
  const highRisks = riskAssessment.risksByLevel.HIGH || 0;
  const avgControlEffectiveness = controlEffectiveness.averageEffectiveness;
  const complianceScore = complianceAssessment.overallScore;
  const criticalRecommendations = recommendations.filter(r => r.priority === 'critical').length;

  return `
EXECUTIVE SUMMARY - RCSA Assessment Results

RISK PROFILE:
• Total Risks Assessed: ${riskAssessment.totalRisks}
• Critical Risks: ${criticalRisks}
• High Risks: ${highRisks}
• Overall Risk Reduction: ${riskAssessment.inherentVsResidual.overallRiskReduction}%

CONTROL EFFECTIVENESS:
• Total Controls Evaluated: ${controlEffectiveness.totalControls}
• Average Control Effectiveness: ${avgControlEffectiveness}%
• Control Gaps Identified: ${controlEffectiveness.gaps.length}

COMPLIANCE ASSESSMENT:
• Framework: ${complianceAssessment.framework}
• Overall Score: ${complianceScore}%
• Rating: ${complianceAssessment.overallRating.toUpperCase()}
• Material Weaknesses: ${complianceAssessment.materialWeaknesses.length}

KEY RECOMMENDATIONS:
• Total Recommendations: ${recommendations.length}
• Critical Priority: ${criticalRecommendations}
• Estimated Implementation Cost: $${recommendations.reduce((sum, r) => sum + (r.cost || 0), 0).toLocaleString()}

NEXT STEPS:
1. Address critical risks and material weaknesses immediately
2. Implement high-priority control improvements
3. Develop comprehensive remediation plan
4. Establish ongoing monitoring and assessment schedule

This assessment provides a comprehensive view of the organization's risk and control environment, 
highlighting areas requiring immediate attention and providing a roadmap for improvement.
  `.trim();
} 