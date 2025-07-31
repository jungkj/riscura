'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { 
  ArrowUpDown, 
  Sparkles, 
  Search, 
  Filter, 
  Eye, 
  Edit3,
  AlertTriangle,
  Shield,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  Calendar,
  Target,
  Activity,
  Lightbulb
} from 'lucide-react';
import Image from 'next/image';

// Realistic RCSA data
const RCSA_DATA = [
  {
    id: 'R001',
    // Risk Information
    riskInfo: {
      id: 'R001',
      source: 'Internal Audit Report 2024-Q2',
      hoRiskId: 'HO-CR-2024-001',
      branchRiskId: 'BR-CR-001',
      readiness: 'Yes',
      driver: 'Inadequate credit assessment procedures for commercial lending',
      event: 'Approval of loans without proper due diligence',
      impact: 'Financial losses due to loan defaults and regulatory penalties',
      statement: 'Risk of approving commercial loans without adequate credit assessment leading to increased default rates and potential regulatory violations.',
      function: 'Commercial Lending',
      owner: 'Sarah Chen, Credit Manager',
      applicability: 'Yes',
      comments: 'High priority - recent audit findings require immediate attention'
    },
    // Risk Taxonomy
    taxonomy: {
      level1: 'Credit Risk',
      level2: 'Underwriting Risk'
    },
    // Risk Assessment
    assessment: {
      likelihood: 'Likely',
      likelihoodReason: 'Recent audit identified 15% of commercial loans lacked proper documentation',
      impact: 'High',
      impactReason: 'Average commercial loan size $2.5M, potential losses could exceed $10M annually',
      inherent: 'High',
      materiality: 'Material'
    },
    // Key Controls
    controls: [
      {
        id: 'C001-A',
        owner: 'Credit Review Committee',
        description: 'Monthly review of all commercial loan applications above $1M threshold with mandatory documentation checklist and dual approval process',
        frequency: 'Monthly',
        evidence: 'Credit committee meeting minutes, loan approval documentation, checklist completion records',
        automation: 'Semi-Automated',
        designEffectiveness: 'Effective',
        operatingEffectiveness: 'Partially Effective',
        residualRisk: 'Moderate'
      }
    ],
    lastUpdated: '2024-01-15'
  },
  {
    id: 'R002',
    riskInfo: {
      id: 'R002',
      source: 'Regulatory Examination Findings',
      hoRiskId: 'HO-OP-2024-005',
      branchRiskId: 'BR-OP-002',
      readiness: 'Yes',
      driver: 'Manual data entry processes for customer onboarding',
      event: 'Incorrect customer information entered into core banking system',
      impact: 'Compliance violations, customer dissatisfaction, and operational losses',
      statement: 'Risk of data entry errors during customer onboarding leading to regulatory compliance issues and customer service problems.',
      function: 'Customer Operations',
      owner: 'Michael Rodriguez, Operations Manager',
      applicability: 'Yes',
      comments: 'Automation project planned for Q2 2024'
    },
    taxonomy: {
      level1: 'Operational Risk',
      level2: 'Process Risk'
    },
    assessment: {
      likelihood: 'Possible',
      likelihoodReason: 'Current error rate is 2.5% based on monthly quality reviews',
      impact: 'Moderate',
      impactReason: 'Regulatory fines typically range $50K-$200K, plus remediation costs',
      inherent: 'Moderate',
      materiality: 'Non-Material'
    },
    controls: [
      {
        id: 'C002-A',
        owner: 'Quality Assurance Team',
        description: 'Daily sample review of 10% of new customer accounts with verification of key data fields and exception reporting',
        frequency: 'Daily',
        evidence: 'QA review reports, exception logs, corrective action tracking',
        automation: 'Manual',
        designEffectiveness: 'Effective',
        operatingEffectiveness: 'Effective',
        residualRisk: 'Low'
      }
    ],
    lastUpdated: '2024-01-12'
  },
  {
    id: 'R003',
    riskInfo: {
      id: 'R003',
      source: 'Market Risk Assessment 2024',
      hoRiskId: 'HO-MR-2024-003',
      branchRiskId: 'BR-MR-001',
      readiness: 'Under Review',
      driver: 'Concentration of deposits in volatile market sectors',
      event: 'Sudden withdrawal of large deposits during market stress',
      impact: 'Liquidity strain and funding cost increases',
      statement: 'Risk of deposit concentration in technology sector clients leading to funding volatility during market downturns.',
      function: 'Treasury & Asset Liability Management',
      owner: 'Jennifer Liu, Treasurer',
      applicability: 'Yes',
      comments: 'Monitoring enhanced due to current market conditions'
    },
    taxonomy: {
      level1: 'Market Risk',
      level2: 'Liquidity Risk'
    },
    assessment: {
      likelihood: 'Possible',
      likelihoodReason: 'Tech sector represents 35% of large deposits, historically volatile',
      impact: 'High',
      impactReason: 'Potential funding gap of $500M+ during stress scenarios',
      inherent: 'High',
      materiality: 'Material'
    },
    controls: [
      {
        id: 'C003-A',
        owner: 'ALCO Committee',
        description: 'Weekly monitoring of deposit concentration by sector with stress testing and contingency funding plan activation triggers',
        frequency: 'Weekly',
        evidence: 'ALCO reports, stress test results, concentration metrics dashboard',
        automation: 'Automated',
        designEffectiveness: 'Effective',
        operatingEffectiveness: 'Effective',
        residualRisk: 'Moderate'
      }
    ],
    lastUpdated: '2024-01-18'
  },
  {
    id: 'R004',
    riskInfo: {
      id: 'R004',
      source: 'Cybersecurity Assessment Q4 2023',
      hoRiskId: 'HO-IT-2024-012',
      branchRiskId: 'BR-IT-004',
      readiness: 'Yes',
      driver: 'Increasing sophisticated phishing attacks targeting employees',
      event: 'Successful phishing attack compromising employee credentials',
      impact: 'Data breach, system compromise, and regulatory penalties',
      statement: 'Risk of successful phishing attacks on employees leading to unauthorized system access and potential data breaches.',
      function: 'Information Technology',
      owner: 'David Park, CISO',
      applicability: 'Yes',
      comments: 'Enhanced training program implemented January 2024'
    },
    taxonomy: {
      level1: 'Operational Risk',
      level2: 'Cybersecurity Risk'
    },
    assessment: {
      likelihood: 'Likely',
      likelihoodReason: 'Industry trend shows 40% increase in targeted phishing, recent simulations show 12% click rate',
      impact: 'High',
      impactReason: 'Potential regulatory fines $5M+, plus incident response and remediation costs',
      inherent: 'High',
      materiality: 'Material'
    },
    controls: [
      {
        id: 'C004-A',
        owner: 'IT Security Team',
        description: 'Multi-layered email security with AI-powered threat detection, quarterly phishing simulations, and mandatory security awareness training',
        frequency: 'Continuous/Quarterly',
        evidence: 'Security incident logs, training completion records, simulation results',
        automation: 'Automated',
        designEffectiveness: 'Effective',
        operatingEffectiveness: 'Effective',
        residualRisk: 'Moderate'
      }
    ],
    lastUpdated: '2024-01-20'
  },
  {
    id: 'R005',
    riskInfo: {
      id: 'R005',
      source: 'Compliance Monitoring Report',
      hoRiskId: 'HO-CM-2024-007',
      branchRiskId: 'BR-CM-003',
      readiness: 'Yes',
      driver: 'Complex AML transaction monitoring rules',
      event: 'Failure to detect suspicious transaction patterns',
      impact: 'Regulatory violations and potential money laundering exposure',
      statement: 'Risk of inadequate AML monitoring leading to undetected suspicious activities and regulatory non-compliance.',
      function: 'Compliance & Risk Management',
      owner: 'Amanda Foster, Chief Compliance Officer',
      applicability: 'Yes',
      comments: 'System upgrade scheduled for Q3 2024 to improve detection capabilities'
    },
    taxonomy: {
      level1: 'Compliance Risk',
      level2: 'AML/BSA Risk'
    },
    assessment: {
      likelihood: 'Possible',
      likelihoodReason: 'Current system generates high false positives, potential for missed alerts',
      impact: 'High',
      impactReason: 'Regulatory penalties can reach $100M+ for AML violations',
      inherent: 'High',
      materiality: 'Material'
    },
    controls: [
      {
        id: 'C005-A',
        owner: 'AML Compliance Team',
        description: 'Daily review of automated transaction monitoring alerts with enhanced due diligence procedures and quarterly model validation',
        frequency: 'Daily',
        evidence: 'Alert investigation reports, SAR filings, model validation documentation',
        automation: 'Semi-Automated',
        designEffectiveness: 'Partially Effective',
        operatingEffectiveness: 'Partially Effective',
        residualRisk: 'High'
      }
    ],
    lastUpdated: '2024-01-14'
  }
];

interface RCSASpreadsheetProps {
  spreadsheetId: string;
}

const RCSASpreadsheet: React.FC<RCSASpreadsheetProps> = ({ spreadsheetId }) => {
  const [data, setData] = useState(RCSA_DATA);
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMateriality, setFilterMateriality] = useState<string>('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [aiInsightCell, setAiInsightCell] = useState<{riskId: string, field: string, context?: any} | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Demo mode detection (you can adjust this logic based on your auth system)
  const isDemoMode = spreadsheetId === 'spreadsheet_1' || spreadsheetId === 'demo';

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(risk => {
      const matchesSearch = searchTerm === '' || 
        risk.riskInfo.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.riskInfo.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.riskInfo.owner.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMateriality = filterMateriality === 'all' || 
        risk.assessment.materiality.toLowerCase() === filterMateriality.toLowerCase();
      
      const matchesRiskLevel = filterRiskLevel === 'all' || 
        risk.assessment.inherent.toLowerCase() === filterRiskLevel.toLowerCase();
      
      return matchesSearch && matchesMateriality && matchesRiskLevel;
    });
  }, [data, searchTerm, filterMateriality, filterRiskLevel]);

  const getRiskRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'moderate': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      case 'likely': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'possible': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'unlikely': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'material': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'non-material': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'effective': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially effective': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'non-effective': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const generateAIPrompt = (riskId: string, field: string, context: any) => {
    const risk = data.find(r => r.id === riskId);
    if (!risk) return '';

    const baseContext = `
Risk ID: ${risk.id}
Function: ${risk.riskInfo.function}
Risk Statement: ${risk.riskInfo.statement}
Risk Level: ${risk.assessment.inherent}
Materiality: ${risk.assessment.materiality}
Likelihood: ${risk.assessment.likelihood}
Impact: ${risk.assessment.impact}
`;

    switch (field) {
      case 'overview':
        return `As a senior risk management consultant, analyze this risk scenario and provide strategic insights:

${baseContext}

Risk Driver: ${risk.riskInfo.driver}
Risk Event: ${risk.riskInfo.event}
Risk Impact: ${risk.riskInfo.impact}

Please provide:
1. A strategic assessment of this risk's potential business impact
2. Industry benchmarking perspective (how does this compare to similar organizations?)
3. Emerging trends or regulatory changes that could affect this risk
4. Strategic recommendations for risk appetite and tolerance levels
5. Key performance indicators (KPIs) to monitor this risk effectively

Focus on actionable insights that would be valuable for senior management and board-level discussions.`;

      case 'assessment':
        return `As a quantitative risk analyst, review this risk assessment and provide detailed analysis:

${baseContext}

Likelihood Rating: ${risk.assessment.likelihood}
Likelihood Rationale: ${risk.assessment.likelihoodReason}
Impact Rating: ${risk.assessment.impact}
Impact Rationale: ${risk.assessment.impactReason}

Please analyze:
1. Validate the likelihood and impact ratings based on industry standards
2. Suggest quantitative risk modeling approaches (VaR, Monte Carlo, etc.)
3. Identify potential correlations with other operational/financial risks
4. Recommend stress testing scenarios specific to this risk
5. Propose risk metrics and thresholds for early warning systems
6. Assess whether the inherent risk rating appropriately reflects the combined likelihood and impact

Provide specific, data-driven recommendations for improving risk measurement accuracy.`;

      case 'controls':
        return `As a controls and compliance expert, evaluate the control environment for this risk:

${baseContext}

Control Details:
${risk.controls.map(c => `
- Control ID: ${c.id}
- Description: ${c.description}
- Frequency: ${c.frequency}
- Automation Level: ${c.automation}
- Design Effectiveness: ${c.designEffectiveness}
- Operating Effectiveness: ${c.operatingEffectiveness}
- Owner: ${c.owner}
`).join('')}

Please provide:
1. Control gap analysis - are there missing controls for this risk type?
2. Control optimization recommendations (automation opportunities, frequency adjustments)
3. Three lines of defense assessment - how well do these controls align with best practices?
4. Control testing strategy and validation approaches
5. Technology solutions that could enhance control effectiveness
6. Specific improvements to achieve "Effective" ratings across all dimensions
7. Cost-benefit analysis of proposed control enhancements

Focus on practical, implementable recommendations that improve the residual risk profile.`;

      case 'details':
        return `As an enterprise risk management specialist, review the governance and operational aspects:

${baseContext}

Risk Owner: ${risk.riskInfo.owner}
Control Owner: ${risk.controls[0]?.owner}
Function: ${risk.riskInfo.function}
Source: ${risk.riskInfo.source}
Comments: ${risk.riskInfo.comments}

Please analyze:
1. Governance structure effectiveness - are roles and responsibilities clearly defined?
2. Risk ownership accountability mechanisms and escalation procedures
3. Cross-functional coordination requirements and potential conflicts
4. Risk reporting and communication strategy improvements
5. Training and awareness program recommendations for stakeholders
6. Integration with enterprise risk management framework
7. Regulatory compliance considerations and reporting requirements
8. Change management implications for risk profile evolution

Provide recommendations for strengthening risk governance and operational resilience.`;

      default:
        return `Analyze this risk scenario and provide expert insights: ${baseContext}`;
    }
  };

  const handleAIInsight = async (riskId: string, field: string, context?: any) => {
    setAiInsightCell({ riskId, field, context });
    setIsLoadingAI(true);
    
    if (isDemoMode) {
      // Demo mode - use simulated responses
      const demoInsights = {
        overview: [
          "This credit risk represents a significant strategic concern given the $2.5M average loan size and 15% documentation gap identified in recent audits. Industry benchmarks suggest similar institutions experience 8-12% documentation deficiencies, placing your organization above average risk levels. The regulatory environment is tightening with new Basel III requirements emphasizing credit risk management. Recommend establishing a 5% risk appetite threshold for documentation gaps with quarterly board reporting on compliance metrics.",
          "The concentration in commercial lending creates systemic exposure that requires immediate attention. Current market volatility and rising interest rates amplify default probability. Consider implementing real-time credit monitoring dashboards and establishing contingency reserves of 2-3% of loan portfolio value. Key metrics to track: loan-to-value ratios, debt service coverage ratios, and sector concentration limits.",
          "This operational risk profile aligns with industry transformation trends toward digital banking. The 2.5% error rate, while manageable, represents opportunity cost and regulatory exposure. Leading institutions achieve <1% error rates through robotic process automation. Recommend phased automation implementation with ROI projections showing 60-70% error reduction within 18 months."
        ],
        assessment: [
          "The likelihood rating of 'Likely' appears conservative given the 15% documentation gap. Quantitative analysis suggests probability ranges of 25-35% for material control failures. Recommend implementing Monte Carlo simulations with 10,000 iterations to model loss distributions. Key variables: loan size, documentation quality score, market conditions. Expected loss calculations should incorporate 99.9% VaR for stress testing scenarios.",
          "Impact assessment methodology should incorporate second-order effects including regulatory penalties, reputational damage, and opportunity costs. Current $10M annual loss estimate may understate true economic impact by 40-60%. Suggest comprehensive impact modeling including: direct losses, regulatory fines (typically 2-5x direct losses), remediation costs, and business disruption. Stress testing should model scenarios with 20%, 50%, and 80% portfolio impact levels.",
          "Risk correlation analysis reveals dependencies with market risk, operational risk, and compliance risk. Recommend copula-based modeling to capture tail dependencies. The inherent risk rating should reflect these correlations - current 'High' rating may be understated given interconnected nature of credit and operational risks."
        ],
        controls: [
          "Control gap analysis reveals missing preventive controls in the loan origination process. Current monthly reviews are detective controls - recommend implementing real-time validation controls at point of entry. Automation opportunities: OCR document scanning, automated credit scoring integration, and exception-based workflows. Expected control effectiveness improvement: 40-60% reduction in documentation gaps within 6 months.",
          "Three lines of defense assessment shows concentration of control ownership in Credit Review Committee. Recommend establishing independent validation in Risk Management (2nd line) and periodic Internal Audit testing (3rd line). Control testing frequency should align with risk velocity - suggest monthly for high-risk loans, quarterly for standard portfolio. Technology solutions: workflow management systems, automated control monitoring, and real-time dashboards.",
          "Cost-benefit analysis shows automation investment of $500K-$750K would generate annual savings of $1.2M-$1.8M through error reduction, efficiency gains, and regulatory compliance improvements. Payback period: 8-12 months. Recommend phased implementation starting with highest-risk loan categories."
        ],
        details: [
          "Governance structure requires enhancement in accountability mechanisms. Current risk owner (Credit Manager) needs clearer escalation procedures and decision-making authority. Recommend establishing Risk Committee with monthly reporting to Board Risk Committee. Cross-functional coordination between Credit, Operations, and Compliance should include formal SLAs and performance metrics.",
          "Risk ownership accountability should include specific KPIs tied to performance management. Suggest implementing risk-adjusted performance metrics for business line managers. Training programs should cover credit risk fundamentals, regulatory requirements, and control procedures - recommend 40-hour annual training requirement with competency testing.",
          "Integration with enterprise risk management framework requires standardized risk taxonomy, consistent measurement methodologies, and automated reporting capabilities. Regulatory compliance considerations include Basel III, CCAR stress testing, and enhanced supervision requirements. Change management should address cultural transformation toward proactive risk management."
        ]
      };
      
      const insights = demoInsights[field as keyof typeof demoInsights] || demoInsights.overview;
      
      setTimeout(() => {
        setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
        setIsLoadingAI(false);
      }, 2000 + Math.random() * 1000); // 2-3 second delay for realism
    } else {
      // Production mode - would call actual OpenAI API
      try {
        const prompt = generateAIPrompt(riskId, field, context);
        
        // This is where you'd call your OpenAI API
        // const response = await fetch('/api/ai/analyze-risk', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ prompt, riskId, field })
        // });
        // const result = await response.json();
        // setAiInsight(result.insight);
        
        // For now, show the prompt that would be sent
        setAiInsight(`[Production Mode] This would send the following prompt to OpenAI:\n\n${prompt}`);
        setIsLoadingAI(false);
      } catch (error) {
        setAiInsight('Error generating AI insight. Please try again.');
        setIsLoadingAI(false);
      }
    }
  };

  const toggleRiskExpansion = (riskId: string) => {
    setExpandedRisks(prev => ({
      ...prev,
      [riskId]: !prev[riskId]
    }));
    
    // Set default tab if not already set
    if (!activeTab[riskId]) {
      setActiveTab(prev => ({
        ...prev,
        [riskId]: 'overview'
      }));
    }
  };

  const setRiskTab = (riskId: string, tab: string) => {
    setActiveTab(prev => ({
      ...prev,
      [riskId]: tab
    }));
  };

  const getTabConfig = (tabId: string) => {
    const configs = {
      overview: {
        id: 'overview',
        label: 'Overview',
        icon: Target,
        bgColor: 'bg-white',
        borderColor: 'border-blue-200',
        activeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        iconColor: 'text-blue-600'
      },
      assessment: {
        id: 'assessment',
        label: 'Assessment',
        icon: TrendingUp,
        bgColor: 'bg-white',
        borderColor: 'border-orange-200',
        activeColor: 'bg-orange-100 text-orange-800 border-orange-300',
        iconColor: 'text-orange-600'
      },
      controls: {
        id: 'controls',
        label: 'Controls',
        icon: Shield,
        bgColor: 'bg-white',
        borderColor: 'border-green-200',
        activeColor: 'bg-green-100 text-green-800 border-green-300',
        iconColor: 'text-green-600'
      },
      details: {
        id: 'details',
        label: 'Details',
        icon: Activity,
        bgColor: 'bg-white',
        borderColor: 'border-purple-200',
        activeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        iconColor: 'text-purple-600'
      }
    };
    return configs[tabId as keyof typeof configs];
  };

  const RiskCard = ({ risk }: { risk: typeof RCSA_DATA[0] }) => {
    const isExpanded = expandedRisks[risk.id];
    const currentTab = activeTab[risk.id] || 'overview';
    const currentTabConfig = getTabConfig(currentTab);

    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md">
        {/* Card Header - Always Visible */}
        <div 
          className="p-6 cursor-pointer"
          onClick={() => toggleRiskExpansion(risk.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <DaisyBadge variant="outline" className="font-mono text-xs px-2 py-1" >
  {risk.id}
</DaisyBadge>
                </DaisyBadge>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {risk.riskInfo.function}
                  </h3>
                  <div className="flex items-center gap-2">
                    <DaisyBadge className={`${getRiskRatingColor(risk.assessment.inherent)} text-xs font-medium`}>
                      {risk.assessment.inherent}
                    </DaisyBadge>
                    <DaisyBadge className={`${getRiskRatingColor(risk.assessment.materiality)} text-xs font-medium`}>
                      {risk.assessment.materiality}
                    </DaisyBadge>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {risk.riskInfo.statement}
                </p>
                
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {risk.riskInfo.owner}
                  </span>
                  <span className="flex items-center gap-1">
                    <DaisyCalendar className="w-3 h-3" />
                    Updated {risk.lastUpdated}
                  </span>
                </div>
              </div>
            </div>
            
            <DaisyButton
              size="sm"
              variant="ghost"
              className="text-[#199BEC] hover:text-[#199BEC] hover:bg-[#199BEC]/10 ml-4"
              onClick={(e) => {
                e.stopPropagation();
                handleAIInsight(risk.id, 'overview');
              }}
            >
              <Sparkles className="w-4 h-4" />
            </DaisyCalendar>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            {/* Custom Tab Navigation with Colors */}
            <div className="px-6 py-4 bg-gray-50/30">
              <div className="flex gap-2">
                {[
                  { id: 'overview', label: 'Overview', icon: Target, color: 'blue' },
                  { id: 'assessment', label: 'Assessment', icon: TrendingUp, color: 'orange' },
                  { id: 'controls', label: 'Controls', icon: Shield, color: 'green' },
                  { id: 'details', label: 'Details', icon: Activity, color: 'purple' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  const tabConfig = getTabConfig(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRiskTab(risk.id, tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? `${tabConfig.activeColor} shadow-sm border`
                          : `text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent`
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? '' : tabConfig.iconColor}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content with Colored Backgrounds */}
            <div className={`${currentTabConfig.bgColor} ${currentTabConfig.borderColor} border-t`}>
              <div className="p-6">
                {currentTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Risk Overview
                      </h4>
                      <DaisyButton
                        size="sm"
                        variant="outline"
                        className="text-[#199BEC] border-[#199BEC]/30 hover:bg-[#199BEC]/10 hover:border-[#199BEC]/50"
                        onClick={() => handleAIInsight(risk.id, 'overview', risk)} />
                        <Image 
                          src="/images/logo/riscura.png" 
                          alt="Riscura" 
                          width={16} 
                          height={16} 
                          className="mr-2"
                        />
                        AI Analysis
                      </DaisyButton>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h5 className="font-medium text-blue-800 flex items-center gap-2">
                          <DaisyAlertTriangle className="w-4 h-4 text-amber-500" >
  Risk Driver
</DaisyAlertTriangle>
                        </h5>
                        <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                          {risk.riskInfo.driver}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="font-medium text-blue-800 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          Risk Event
                        </h5>
                        <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                          {risk.riskInfo.event}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-blue-800 flex items-center gap-2">
                        <Target className="w-4 h-4 text-red-500" />
                        Risk Impact
                      </h5>
                      <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                        {risk.riskInfo.impact}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-blue-200">
                      <div className="text-center p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <div className="text-xs text-blue-600 mb-2 font-medium">Risk Category</div>
                        <div className="font-semibold text-sm text-gray-900">{risk.taxonomy.level1}</div>
                        <div className="text-xs text-gray-600">{risk.taxonomy.level2}</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <div className="text-xs text-blue-600 mb-2 font-medium">Source</div>
                        <div className="font-semibold text-sm text-gray-900">{risk.riskInfo.source}</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <div className="text-xs text-blue-600 mb-2 font-medium">Status</div>
                        <DaisyBadge variant="outline" className="text-xs border-blue-300" >
  {risk.riskInfo.readiness}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                    </div>
                  </div>
                )}

                {currentTab === 'assessment' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        Risk Assessment
                      </h4>
                      <DaisyButton
                        size="sm"
                        variant="outline"
                        className="text-[#199BEC] border-[#199BEC]/30 hover:bg-[#199BEC]/10 hover:border-[#199BEC]/50"
                        onClick={() => handleAIInsight(risk.id, 'assessment', risk)} />
                        <Image 
                          src="/images/logo/riscura.png" 
                          alt="Riscura" 
                          width={16} 
                          height={16} 
                          className="mr-2"
                        />
                        AI Analysis
                      </DaisyButton>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-orange-800">Likelihood</h5>
                          <DaisyBadge className={getRiskRatingColor(risk.assessment.likelihood)} >
  {risk.assessment.likelihood}
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                        <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                          {risk.assessment.likelihoodReason}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-orange-800">Impact</h5>
                          <DaisyBadge className={getRiskRatingColor(risk.assessment.impact)} >
  {risk.assessment.impact}
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                        <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                          {risk.assessment.impactReason}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-orange-200">
                      <div className="text-center p-6 bg-white rounded-lg border border-orange-200 shadow-sm">
                        <div className="text-sm text-orange-600 mb-3 font-medium">Inherent Risk</div>
                        <DaisyBadge className={`${getRiskRatingColor(risk.assessment.inherent)} text-base px-4 py-2`}>
                          {risk.assessment.inherent}
                        </DaisyBadge>
                      </div>
                      <div className="text-center p-6 bg-white rounded-lg border border-orange-200 shadow-sm">
                        <div className="text-sm text-orange-600 mb-3 font-medium">Materiality</div>
                        <DaisyBadge className={`${getRiskRatingColor(risk.assessment.materiality)} text-base px-4 py-2`}>
                          {risk.assessment.materiality}
                        </DaisyBadge>
                      </div>
                    </div>
                  </div>
                )}

                {currentTab === 'controls' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Control Environment
                      </h4>
                      <DaisyButton
                        size="sm"
                        variant="outline"
                        className="text-[#199BEC] border-[#199BEC]/30 hover:bg-[#199BEC]/10 hover:border-[#199BEC]/50"
                        onClick={() => handleAIInsight(risk.id, 'controls', risk)} />
                        <Image 
                          src="/images/logo/riscura.png" 
                          alt="Riscura" 
                          width={16} 
                          height={16} 
                          className="mr-2"
                        />
                        AI Analysis
                      </DaisyButton>
                    </div>
                    
                    {risk.controls.map((control, index) => (
                      <div key={control.id} className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <DaisyBadge variant="outline" className="font-mono text-xs border-green-300" >
  {control.id}
</DaisyBadge>
                          </DaisyBadge>
                          <div className="flex items-center gap-2">
                            <DaisyBadge className={`${getRiskRatingColor(control.designEffectiveness)} text-xs`}>
                              Design: {control.designEffectiveness}
                            </DaisyBadge>
                            <DaisyBadge className={`${getRiskRatingColor(control.operatingEffectiveness)} text-xs`}>
                              Operating: {control.operatingEffectiveness}
                            </DaisyBadge>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h6 className="font-medium text-green-800 mb-2">Control Description</h6>
                            <p className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                              {control.description}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h6 className="font-medium text-green-800 mb-2">Evidence</h6>
                              <p className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                                {control.evidence}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <h6 className="font-medium text-green-800 mb-2">Control Details</h6>
                                <div className="space-y-2 bg-green-50 p-3 rounded border border-green-200">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Frequency:</span>
                                    <span className="font-medium">{control.frequency}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Automation:</span>
                                    <DaisyBadge className={`${getRiskRatingColor(control.automation)} text-xs`}>
                                      {control.automation}
                                    </DaisyBadge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Owner:</span>
                                    <span className="font-medium text-right">{control.owner}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-green-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-700">Residual Risk</span>
                              <DaisyBadge className={`${getRiskRatingColor(control.residualRisk)} text-sm px-3 py-1`}>
                                {control.residualRisk}
                              </DaisyBadge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentTab === 'details' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Risk Details & Governance
                      </h4>
                      <DaisyButton
                        size="sm"
                        variant="outline"
                        className="text-[#199BEC] border-[#199BEC]/30 hover:bg-[#199BEC]/10 hover:border-[#199BEC]/50"
                        onClick={() => handleAIInsight(risk.id, 'details', risk)} />
                        <Image 
                          src="/images/logo/riscura.png" 
                          alt="Riscura" 
                          width={16} 
                          height={16} 
                          className="mr-2"
                        />
                        AI Analysis
                      </DaisyButton>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-purple-800 mb-2">Risk Owner</h5>
                          <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                            {risk.riskInfo.owner}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium text-purple-800 mb-2">Business Function</h5>
                          <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                            {risk.riskInfo.function}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-purple-800 mb-2">Control Owner</h5>
                          <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                            {risk.controls[0]?.owner}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium text-purple-800 mb-2">Last Updated</h5>
                          <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                            {risk.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-purple-800 mb-2">Comments & Notes</h5>
                      <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        {risk.riskInfo.comments}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-purple-200">
                      <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                        <div className="text-xs text-purple-600 mb-2 font-medium">HO Risk ID</div>
                        <div className="font-mono text-sm text-gray-900">{risk.riskInfo.hoRiskId}</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                        <div className="text-xs text-purple-600 mb-2 font-medium">Branch Risk ID</div>
                        <div className="font-mono text-sm text-gray-900">{risk.riskInfo.branchRiskId}</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                        <div className="text-xs text-purple-600 mb-2 font-medium">Applicability</div>
                        <DaisyBadge variant="outline" className="text-xs border-purple-300" >
  {risk.riskInfo.applicability}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Risk Control Self-Assessment
              </h1>
              <DaisyBadge className="bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30" >
  <Sparkles className="w-3 h-3 mr-1" />
</DaisyBadge>
                {isDemoMode ? 'Demo Mode' : 'AI-Enhanced'}
              </DaisyBadge>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {filteredData.length} risks
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                {filteredData.filter(r => r.assessment.materiality === 'Material').length} material
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {filteredData.filter(r => r.assessment.inherent === 'High').length} high risk
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DaisyInput
                placeholder="Search risks, functions, or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterMateriality}
              onChange={(e) => setFilterMateriality(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Materiality</option>
              <option value="material">Material</option>
              <option value="non-material">Non-Material</option>
            </select>
            
            <select
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <DaisyAlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" >
  <h3 className="text-lg font-medium text-gray-900 mb-2">
</DaisyInput>No risks found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced AI Insight Modal */}
      <DaisyDialog open={!!aiInsightCell} onOpenChange={() => setAiInsightCell(null)} />
        <DaisyDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" >
  <DaisyDialogHeader />
</DaisyDialog>
            <DaisyDialogTitle className="flex items-center gap-2" >
  <Image 
                src="/images/logo/riscura.png" 
                alt="Riscura" 
                width={20} 
                height={20}
              />
</DaisyDialogTitle>
              AI Risk Analysis
              <DaisyBadge className="bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30 text-xs" >
  {isDemoMode ? 'Demo Mode' : '1 Credit'}
</DaisyBadge>
              </DaisyBadge>
              {aiInsightCell && (
                <DaisyBadge variant="outline" className="text-xs" >
  {aiInsightCell.field.charAt(0).toUpperCase() + aiInsightCell.field.slice(1)} Analysis
</DaisyBadge>
                </DaisyBadge>
              )}
            </DaisyDialogTitle>
          </DaisyDialogHeader>
          <div className="space-y-4">
            {isLoadingAI ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC] mx-auto mb-4"></div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Analyzing risk data...</p>
                    <p className="text-xs text-gray-500">
                      {isDemoMode ? 'Generating demo insights' : 'Processing with AI'}
                    </p>
                  </div>
                </div>
              </div>
            ) : aiInsight ? (
              <div className="p-6 bg-gradient-to-r from-[#199BEC]/5 to-[#199BEC]/10 rounded-lg border border-[#199BEC]/20">
                <div className="flex items-start gap-3">
                                      <Lightbulb className="w-5 h-5 text-[#199BEC] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                                          <h4 className="font-medium text-[#199BEC] mb-2">AI Insights</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {aiInsight}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isDemoMode && 'Demo mode - no API calls made'}
              </div>
              <DaisyButton 
                onClick={() => {
                  setAiInsightCell(null);
                  setAiInsight('');
                  setIsLoadingAI(false);
                }}
                className="bg-[#199BEC] hover:bg-[#199BEC]/90 text-white"
              >
                Close
              </DaisyButton>
            </div>
          </div>
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
};

export default RCSASpreadsheet; 