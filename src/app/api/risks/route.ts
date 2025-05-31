import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - replace with actual database operations
const mockRisks = [
  {
    id: '1',
    title: 'Data Breach Risk',
    description: 'Risk of unauthorized access to sensitive data',
    likelihood: 3,
    impact: 5,
    riskScore: 15,
    status: 'active',
    category: 'cybersecurity',
    owner: 'IT Security Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    let filteredRisks = mockRisks;
    
    if (category) {
      filteredRisks = filteredRisks.filter(risk => risk.category === category);
    }
    
    if (status) {
      filteredRisks = filteredRisks.filter(risk => risk.status === status);
    }
    
    return NextResponse.json({
      risks: filteredRisks,
      total: filteredRisks.length,
    });
  } catch (error) {
    console.error('Risk API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, likelihood, impact, category, owner } = body;
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title and description' },
        { status: 400 }
      );
    }
    
    const newRisk = {
      id: Date.now().toString(),
      title,
      description,
      likelihood: likelihood || 1,
      impact: impact || 1,
      riskScore: (likelihood || 1) * (impact || 1),
      status: 'active',
      category: category || 'general',
      owner: owner || 'Unassigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // In a real app, save to database
    mockRisks.push(newRisk);
    
    return NextResponse.json(newRisk, { status: 201 });
  } catch (error) {
    console.error('Risk Creation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 