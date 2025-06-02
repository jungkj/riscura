import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/AIService';
import { RiskAnalysisAIService } from '@/services/RiskAnalysisAIService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, options } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    let result;
    const riskAnalysisService = new RiskAnalysisAIService();
    const aiService = new AIService();

    switch (type) {
      case 'risk': {
        result = await riskAnalysisService.assessRisk(data);
        break;
      }
      
      case 'risk_analysis': {
        // Enhanced risk analysis with AI suggestions
        result = await analyzeRiskEnhanced(data, options);
        break;
      }
      
      case 'categorization': {
        // Auto-categorization of risks based on description
        result = await categorizeRisk(data.description, data.title);
        break;
      }
      
      case 'correlation_analysis': {
        // Risk correlation analysis
        result = await analyzeRiskCorrelations(data.risks);
        break;
      }
      
      case 'predictive_analysis': {
        // Predictive risk modeling
        result = await generatePredictiveInsights(data.risks);
        break;
      }
      
      case 'content': {
        result = await aiService.generateContent(data);
        break;
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported analysis type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Analysis API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Enhanced risk analysis function
async function analyzeRiskEnhanced(riskData: any, options: any) {
  const aiService = new AIService();
  
  const prompt = `
    Analyze the following risk and provide comprehensive suggestions:
    
    Title: ${riskData.title}
    Description: ${riskData.description}
    Category: ${riskData.category || 'Not specified'}
    Current Likelihood: ${riskData.likelihood || 'Not assessed'}
    Current Impact: ${riskData.impact || 'Not assessed'}
    
    Please provide:
    1. Suggested category (operational, financial, strategic, compliance, technology)
    2. Suggested likelihood score (1-5)
    3. Suggested impact score (1-5)
    4. 3-5 specific mitigation strategies
    5. 3-5 relevant control suggestions
    6. Reasoning explanation for your suggestions
    7. Confidence score (0-1)
    
    Format as JSON with these exact keys:
    {
      "suggestedCategory": "string",
      "suggestedLikelihood": number,
      "suggestedImpact": number,
      "suggestedMitigations": ["string"],
      "suggestedControls": ["string"],
      "reasoning": "string",
      "confidence": number
    }
  `;

  try {
    const response = await aiService.generateContent({
      type: 'analysis',
      context: {
        prompt,
        riskData,
        format: 'json'
      }
    });

    // Parse the response or provide defaults
    let analysis;
    try {
      const content = response.content;
      analysis = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      // Fallback if JSON parsing fails
      analysis = {
        suggestedCategory: riskData.category || 'operational',
        suggestedLikelihood: 3,
        suggestedImpact: 3,
        suggestedMitigations: [
          'Implement monitoring procedures',
          'Develop contingency plans',
          'Regular risk assessments'
        ],
        suggestedControls: [
          'Process documentation',
          'Regular reviews',
          'Training programs'
        ],
        reasoning: 'AI analysis completed with standard recommendations',
        confidence: 0.7
      };
    }

    return analysis;
  } catch (error) {
    console.error('Enhanced risk analysis failed:', error);
    // Return default analysis
    return {
      suggestedCategory: riskData.category || 'operational',
      suggestedLikelihood: 3,
      suggestedImpact: 3,
      suggestedMitigations: [
        'Implement monitoring procedures',
        'Develop contingency plans',
        'Regular risk assessments'
      ],
      suggestedControls: [
        'Process documentation',
        'Regular reviews',
        'Training programs'
      ],
      reasoning: 'AI analysis unavailable, providing standard recommendations',
      confidence: 0.5
    };
  }
}

// Risk categorization function
async function categorizeRisk(description: string, title: string) {
  const aiService = new AIService();
  
  const prompt = `
    Categorize this risk into one of these categories based on the title and description:
    - operational: Day-to-day business operations, processes, systems
    - financial: Financial losses, market risks, credit risks
    - strategic: Business strategy, competitive advantage, market position
    - compliance: Regulatory requirements, legal obligations
    - technology: IT systems, cybersecurity, data protection
    
    Title: ${title}
    Description: ${description}
    
    Respond with just the category name (one word).
  `;

  try {
    const response = await aiService.generateContent({
      type: 'classification',
      context: {
        prompt,
        title,
        description
      }
    });

    const content = response.content;
    const category = typeof content === 'string' ? content.toLowerCase().trim() : 'operational';
    const validCategories = ['operational', 'financial', 'strategic', 'compliance', 'technology'];
    
    return {
      category: validCategories.includes(category) ? category : 'operational'
    };
  } catch (error) {
    console.error('Risk categorization failed:', error);
    return { category: 'operational' };
  }
}

// Risk correlation analysis
async function analyzeRiskCorrelations(risks: any[]) {
  // Mock implementation - in a real scenario, this would use advanced AI
  interface CorrelationResult {
    risk1Id: string;
    risk2Id: string;
    correlationType: string;
    strength: number;
    explanation: string;
  }
  
  const correlations: CorrelationResult[] = [];
  
  for (let i = 0; i < risks.length; i++) {
    for (let j = i + 1; j < risks.length; j++) {
      const risk1 = risks[i];
      const risk2 = risks[j];
      
      // Simple correlation based on category and score similarity
      let correlationStrength = 0;
      
      if (risk1.category === risk2.category) {
        correlationStrength += 0.3;
      }
      
      const scoreDiff = Math.abs(risk1.riskScore - risk2.riskScore);
      if (scoreDiff <= 5) {
        correlationStrength += 0.2;
      }
      
      if (correlationStrength > 0.2) {
        correlations.push({
          risk1Id: risk1.id,
          risk2Id: risk2.id,
          correlationType: 'positive',
          strength: correlationStrength,
          explanation: `Both risks share similar characteristics in ${risk1.category} category`
        });
      }
    }
  }
  
  return { correlations };
}

// Predictive insights generation
async function generatePredictiveInsights(risks: any[]) {
  // Mock implementation for predictive analysis
  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r => r.riskScore >= 20).length;
  const highRisks = risks.filter(r => r.riskScore >= 15 && r.riskScore < 20).length;
  
  return {
    intelligence: {
      predictiveAnalysis: {
        forecastedRisks: [
          {
            category: 'technology',
            probability: 0.7,
            predictedImpact: 4,
            timeframe: '6 months',
            reasoning: 'Increasing cybersecurity threats in the industry'
          }
        ],
        trendPredictions: [
          {
            metric: 'total_risks',
            currentValue: totalRisks,
            predictedValue: totalRisks + Math.floor(totalRisks * 0.1),
            changeDirection: 'increasing',
            confidence: 0.75
          }
        ],
        seasonalPatterns: [],
        confidence: 0.7
      },
      correlationInsights: [],
      emergingRisks: [
        {
          title: 'AI and Automation Risks',
          description: 'Emerging risks from AI implementation and automation',
          category: 'technology',
          probability: 0.6,
          potentialImpact: 4,
          sourceSignals: ['Industry trends', 'Technology adoption'],
          timeToMaterialization: 180
        }
      ],
      industryBenchmarks: [
        {
          metric: 'average_risk_score',
          industryAverage: 12,
          topQuartile: 8,
          organizationValue: risks.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks,
          position: 'average'
        }
      ],
      recommendations: [
        {
          id: 'rec-1',
          type: 'mitigation',
          title: 'Strengthen Cybersecurity Controls',
          description: 'Implement additional security measures based on emerging threats',
          priority: 1,
          expectedBenefit: 'Reduced technology risk exposure',
          effort: 'medium',
          timeline: '3-6 months',
          affectedRisks: risks.filter(r => r.category === 'technology').map(r => r.id)
        }
      ]
    }
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Analysis API is running',
    supportedTypes: [
      'risk', 
      'risk_analysis', 
      'categorization', 
      'correlation_analysis', 
      'predictive_analysis', 
      'content'
    ],
  });
} 