import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/AIService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, context, requirements } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    let result;
    const aiService = new AIService();

    switch (type) {
      case 'risk_description':
      case 'control_procedure':
      case 'policy_document':
      case 'training_material':
        result = await aiService.generateContent({
          type,
          context,
          requirements,
        });
        break;
      
      case 'compliance_content': {
        result = await aiService.generateContent({
          type,
          context,
          requirements,
        });
        break;
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported generation type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Generation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Generation API is running',
    supportedTypes: [
      'risk_description',
      'control_procedure', 
      'policy_document',
      'training_material',
      'compliance_content'
    ],
  });
} 