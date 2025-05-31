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

    switch (type) {
      case 'risk':
        const riskAnalysisService = new RiskAnalysisAIService();
        result = await riskAnalysisService.analyzeRisk(data);
        break;
      
      case 'content':
        const aiService = new AIService();
        result = await aiService.analyzeContent(data, options);
        break;
      
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

export async function GET() {
  return NextResponse.json({
    message: 'AI Analysis API is running',
    supportedTypes: ['risk', 'content'],
  });
} 