import { OpenAI } from 'openai';
import { RCSARowData, COLUMN_MAPPINGS } from '@/lib/rcsa/parser';
// import {
  RiskCategory,
  RiskStatus,;
  ControlType,;
  ControlCategory,;
  AutomationLevel,;
} from '@/types/rcsa.types';
;
// Validate OpenAI API key at module initialization
if (!process.env.OPENAI_API_KEY) {
  // console.error(
    '[RCSA Analysis] OpenAI API key is not configured. AI analysis features will be unavailable.';
  );
}

// Create OpenAI instance only if API key is available
const openai = process.env.OPENAI_API_KEY;
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,;
    });
  : null;
;
export interface RCSAGapAnalysis {
  overallAssessment: string;
  completenessScore: number;
  riskGaps: RiskGap[];
  controlGaps: ControlGap[];
  recommendations: Recommendation[];
  mappedRisks: MappedRisk[];
  mappedControls: MappedControl[];
}

export interface RiskGap {
  riskId?: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  missingFields: string[];
}

export interface ControlGap {
  controlId: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  missingFields: string[];
}

export interface Recommendation {
  type: 'risk' | 'control' | 'process' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action: string;
}

export interface MappedRisk {
  externalId: string;
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: number;
  impact: number;
  status: RiskStatus;
  owner?: string;
  rationale?: string;
  sourceRow: number;
}

export interface MappedControl {
  externalId: string;
  title: string;
  description: string;
  type: ControlType;
  category: ControlCategory;
  frequency: string;
  automationLevel: AutomationLevel;
  owner?: string;
  evidence?: string;
  designEffectiveness?: string;
  operatingEffectiveness?: string;
  riskIds: string[];
  sourceRow: number;
}

const SYSTEM_PROMPT = `You are an expert risk and compliance analyst specializing in RCSA (Risk and Control Self-Assessment) gap analysis.;
Your task is to analyze RCSA data and provide:;
1. Comprehensive gap analysis identifying missing or incomplete information;
2. Risk assessment quality evaluation;
3. Control effectiveness analysis;
4. Compliance and regulatory alignment check;
5. Recommendations for improvement;
6. Properly mapped and structured risk and control data;
Focus on:;
- Data completeness and quality;
- Risk assessment methodology correctness;
- Control design and operating effectiveness;
- Regulatory compliance requirements;
- Industry best practices;
- Clear risk-control relationships;
Provide actionable recommendations with specific priorities.`;
;
const mapLikelihoodRating = (rating?: string): number {
  if (!rating) return 3;
  const lower = rating.toLowerCase();
  if (lower.includes('unlikely') || lower.includes('rare')) return 1;
  if (lower.includes('possible')) return 3;
  if (lower.includes('likely') || lower.includes('probable')) return 4;
  if (lower.includes('almost certain') || lower.includes('very likely')) return 5;
  return 3;
}

const mapImpactRating = (rating?: string): number {
  if (!rating) return 3;
  const lower = rating.toLowerCase();
  if (lower.includes('low') || lower.includes('negligible')) return 1;
  if (lower.includes('moderate') || lower.includes('medium')) return 3;
  if (lower.includes('high') || lower.includes('significant')) return 4;
  if (lower.includes('critical') || lower.includes('severe')) return 5;
  return 3;
}

const mapRiskCategory = (category?: string): RiskCategory {
  if (!category) return RiskCategory.OPERATIONAL;
  const lower = category.toLowerCase();
;
  if (lower.includes('credit')) return RiskCategory.CREDIT;
  if (lower.includes('market')) return RiskCategory.MARKET;
  if (lower.includes('liquidity')) return RiskCategory.LIQUIDITY;
  if (lower.includes('operational')) return RiskCategory.OPERATIONAL;
  if (lower.includes('compliance') || lower.includes('regulatory')) return RiskCategory.COMPLIANCE;
  if (lower.includes('strategic')) return RiskCategory.STRATEGIC;
  if (lower.includes('reputation')) return RiskCategory.REPUTATIONAL;
  if (lower.includes('cyber') || lower.includes('it') || lower.includes('technology'));
    return RiskCategory.IT_CYBER;
;
  return RiskCategory.OPERATIONAL;
}

const mapControlType = (description?: string, frequency?: string): ControlType {
  if (!description && !frequency) return ControlType.DETECTIVE;
;
  const text = `${description || ''} ${frequency || ''}`.toLowerCase();
;
  if (text.includes('prevent') || text.includes('before') || text.includes('prior to')) {
    return ControlType.PREVENTIVE;
  }
  if (text.includes('detect') || text.includes('monitor') || text.includes('review')) {
    return ControlType.DETECTIVE;
  }
  if (text.includes('correct') || text.includes('remediat') || text.includes('fix')) {
    return ControlType.CORRECTIVE;
  }

  return ControlType.DETECTIVE;
}

const mapAutomationLevel = (automation?: string): AutomationLevel {
  if (!automation) return AutomationLevel.MANUAL;
  const lower = automation.toLowerCase();
;
  if (lower.includes('automat') && !lower.includes('semi')) return AutomationLevel.AUTOMATED;
  if (lower.includes('semi')) return AutomationLevel.SEMI_AUTOMATED;
  return AutomationLevel.MANUAL;
}

export async function analyzeRCSAData(rows: RCSARowData[]): Promise<RCSAGapAnalysis> {
  try {
    // Check if OpenAI is available
    if (!openai) {
      // console.warn('[RCSA Analysis] OpenAI not configured, falling back to basic analysis')
      return performBasicAnalysis(rows);
    }

    // Prepare data for AI analysis
    const analysisData = {
      rowCount: rows.length,;
      rows: rows.map((row, index) => ({
        rowNumber: index + 1,;
        ...row,;
      })),;
    }
;
    // Call OpenAI for gap analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',;
      messages: [;
        { role: 'system', content: SYSTEM_PROMPT },;
        {
          role: 'user',;
          content: `Analyze this RCSA data and provide a comprehensive gap analysis:\n\n${JSON.stringify(analysisData, null, 2)}`,;
        },;
      ],;
      response_format: { type: 'json_object' },;
      temperature: 0.3,;
    });
;
    // Track token usage
    if (completion.usage) {
      // console.log('[RCSA Analysis] Token usage:', {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,;
        total_tokens: completion.usage.total_tokens,;
        estimated_cost: (completion.usage.total_tokens / 1000) * 0.01, // Rough estimate for GPT-4;
      });
      // TODO: Store token usage in database or monitoring system
    }

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
;
    // Map risks from the data
    const mappedRisks: MappedRisk[] = [];
    const riskMap = new Map<string, MappedRisk>();
;
    rows.forEach((row, index) => {
      if (row.riskStatement || row.riskEvent) {
        const riskId = `RISK-${index + 1}`;
        const risk: MappedRisk = {
          externalId: riskId,;
          title: row.riskStatement || row.riskEvent || 'Untitled Risk',;
          description: [;
            row.riskDriver && `Driver: ${row.riskDriver}`,;
            row.riskEvent && `Event: ${row.riskEvent}`,;
            row.riskImpact && `Impact: ${row.riskImpact}`,;
            row.riskStatement,;
          ];
            .filter(Boolean);
            .join('\n'),;
          category: mapRiskCategory(row.level1RiskCategory),;
          likelihood: mapLikelihoodRating(row.likelihoodRating),;
          impact: mapImpactRating(row.impactRating),;
          status: RiskStatus.IDENTIFIED,;
          owner: row.riskOwner,;
          rationale: [;
            row.likelihoodRationale && `Likelihood: ${row.likelihoodRationale}`,;
            row.impactRationale && `Impact: ${row.impactRationale}`,;
          ];
            .filter(Boolean);
            .join('\n'),;
          sourceRow: index + 1,;
        }
;
        mappedRisks.push(risk);
        riskMap.set(riskId, risk);
      }
    });
;
    // Map controls from the data
    const mappedControls: MappedControl[] = [];
;
    rows.forEach((row, index) => {
      if (row.controlId && row.controlDescription) {
        const associatedRiskId = mappedRisks.find((r) => r.sourceRow === index + 1)?.externalId;
;
        const control: MappedControl = {
          externalId: row.controlId,;
          title: `Control ${row.controlId}`,;
          description: row.controlDescription,;
          type: mapControlType(row.controlDescription, row.controlFrequency),;
          category: ControlCategory.OPERATIONAL,;
          frequency: row.controlFrequency || 'As needed',;
          automationLevel: mapAutomationLevel(row.controlAutomation),;
          owner: row.controlOwner,;
          evidence: row.controlEvidence,;
          designEffectiveness: row.controlDesignEffectiveness,;
          operatingEffectiveness: row.controlOperatingEffectiveness,;
          riskIds: associatedRiskId ? [associatedRiskId] : [],;
          sourceRow: index + 1,;
        }
;
        mappedControls.push(control);
      }
    });
;
    // Generate gap analysis
    const riskGaps: RiskGap[] = [];
    const controlGaps: ControlGap[] = [];
;
    // Check for risk gaps
    mappedRisks.forEach((risk, index) => {
      const row = rows[risk.sourceRow - 1];
      const missingFields: string[] = [];
;
      if (!row.likelihoodRationale) missingFields.push('Likelihood Rationale');
      if (!row.impactRationale) missingFields.push('Impact Rationale');
      if (!row.riskOwner) missingFields.push('Risk Owner');
      if (!row.riskMateriality) missingFields.push('Risk Materiality Classification');
;
      if (missingFields.length > 0) {
        riskGaps.push({
          riskId: risk.externalId,;
          issue: `Missing critical risk assessment fields`,;
          severity: missingFields.includes('Risk Owner') ? 'high' : 'medium',;
          recommendation: `Complete missing fields: ${missingFields.join(', ')}`,;
          missingFields,;
        });
      }
    });
;
    // Check for control gaps
    mappedControls.forEach((control) => {
      const row = rows[control.sourceRow - 1];
      const missingFields: string[] = [];
;
      if (!row.controlOwner) missingFields.push('Control Owner');
      if (!row.controlFrequency) missingFields.push('Control Frequency');
      if (!row.controlEvidence) missingFields.push('Control Evidence');
      if (!row.controlDesignEffectiveness) missingFields.push('Design Effectiveness Rating');
      if (!row.controlOperatingEffectiveness) missingFields.push('Operating Effectiveness Rating');
;
      if (missingFields.length > 0) {
        controlGaps.push({
          controlId: control.externalId,;
          issue: `Incomplete control documentation`,;
          // severity: // Fixed expression expected error
            missingFields.includes('Control Owner') || missingFields.includes('Control Evidence');
              ? 'high';
              : 'medium',;
          recommendation: `Document missing control attributes: ${missingFields.join(', ')}`,;
          missingFields,;
        });
      }
    });
;
    // Calculate completeness score
    const totalFields = rows.length * Object.keys(COLUMN_MAPPINGS).length;
    const filledFields = rows.reduce((sum, row) => {
      return sum + Object.values(row).filter((v) => v && v.toString().trim()).length;
    }, 0);
    const completenessScore = Math.round((filledFields / totalFields) * 100);
;
    // Generate recommendations
    const recommendations: Recommendation[] = [;
      ...(aiResponse.recommendations || []),;
      {
        type: 'process',;
        priority: 'high',;
        description: 'Establish clear risk and control ownership',;
        action: 'Assign responsible owners to all risks and controls lacking ownership',;
      },;
      {
        type: 'compliance',;
        priority: 'medium',;
        description: 'Enhance control testing documentation',;
        action: 'Document control testing procedures and maintain evidence of testing',;
      },;
    ];
;
    return {
      // overallAssessment: // Fixed expression expected error
        aiResponse.overallAssessment ||;
        `RCSA data shows ${completenessScore}% completeness with ${riskGaps.length} risk gaps and ${controlGaps.length} control gaps identified.`,;
      completenessScore,;
      riskGaps,;
      controlGaps,;
      recommendations,;
      mappedRisks,;
      mappedControls,;
    }
  } catch (error) {
    // console.error('Error analyzing RCSA data:', error)
;
    // Fallback analysis without AI
    return performBasicAnalysis(rows);
  }
}

const performBasicAnalysis = (rows: RCSARowData[]): RCSAGapAnalysis {
  const mappedRisks: MappedRisk[] = [];
  const mappedControls: MappedControl[] = [];
  const riskGaps: RiskGap[] = [];
  const controlGaps: ControlGap[] = [];
;
  // Basic mapping and gap detection
  rows.forEach((row, index) => {
    if (row.riskStatement || row.riskEvent) {
      const riskId = `RISK-${index + 1}`;
      const missingFields: string[] = [];
;
      if (!row.likelihoodRating) missingFields.push('Likelihood Rating');
      if (!row.impactRating) missingFields.push('Impact Rating');
      if (!row.riskOwner) missingFields.push('Risk Owner');
;
      mappedRisks.push({
        externalId: riskId,;
        title: row.riskStatement || row.riskEvent || 'Untitled Risk',;
        description: [row.riskDriver, row.riskEvent, row.riskImpact].filter(Boolean).join(' | '),;
        category: mapRiskCategory(row.level1RiskCategory),;
        likelihood: mapLikelihoodRating(row.likelihoodRating),;
        impact: mapImpactRating(row.impactRating),;
        status: RiskStatus.IDENTIFIED,;
        owner: row.riskOwner,;
        sourceRow: index + 1,;
      });
;
      if (missingFields.length > 0) {
        riskGaps.push({
          riskId,;
          issue: 'Missing essential risk fields',;
          severity: 'medium',;
          recommendation: `Complete: ${missingFields.join(', ')}`,;
          missingFields,;
        });
      }
    }

    if (row.controlId && row.controlDescription) {
      const missingFields: string[] = [];
;
      if (!row.controlOwner) missingFields.push('Control Owner');
      if (!row.controlFrequency) missingFields.push('Control Frequency');
      if (!row.controlEvidence) missingFields.push('Control Evidence');
;
      mappedControls.push({
        externalId: row.controlId,;
        title: `Control ${row.controlId}`,;
        description: row.controlDescription,;
        type: mapControlType(row.controlDescription),;
        category: ControlCategory.OPERATIONAL,;
        frequency: row.controlFrequency || 'As needed',;
        automationLevel: mapAutomationLevel(row.controlAutomation),;
        owner: row.controlOwner,;
        evidence: row.controlEvidence,;
        riskIds: [],;
        sourceRow: index + 1,;
      });
;
      if (missingFields.length > 0) {
        controlGaps.push({
          controlId: row.controlId,;
          issue: 'Incomplete control documentation',;
          severity: 'medium',;
          recommendation: `Document: ${missingFields.join(', ')}`,;
          missingFields,;
        });
      }
    }
  });
;
  const totalFields = rows.length * 20; // Approximate fields per row;
  const filledFields = rows.reduce((sum, row) => {
    return sum + Object.values(row).filter((v) => v && v.toString().trim()).length;
  }, 0);
  const completenessScore = Math.round((filledFields / totalFields) * 100);
;
  return {
    overallAssessment: `Basic analysis complete. Found ${mappedRisks.length} risks and ${mappedControls.length} controls with ${completenessScore}% data completeness.`,;
    completenessScore,;
    riskGaps,;
    controlGaps,;
    recommendations: [;
      {
        type: 'process',;
        priority: 'high',;
        description: 'Complete missing risk assessments',;
        action: 'Fill in all likelihood and impact ratings with supporting rationales',;
      },;
      {
        type: 'control',;
        priority: 'high',;
        description: 'Document control effectiveness',;
        action: 'Assess and document design and operating effectiveness for all controls',;
      },;
    ],;
    mappedRisks,;
    mappedControls,;
  }
}
