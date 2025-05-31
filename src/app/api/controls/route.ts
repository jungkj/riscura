import { NextRequest, NextResponse } from 'next/server';

// Mock data for development
const mockControls = [
  {
    id: '1',
    title: 'Access Control Policy',
    description: 'Comprehensive access control procedures',
    type: 'preventive',
    effectiveness: 85,
    status: 'active',
    owner: 'Security Team',
    lastTested: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    let filteredControls = mockControls;
    
    if (type) {
      filteredControls = filteredControls.filter(control => control.type === type);
    }
    
    if (status) {
      filteredControls = filteredControls.filter(control => control.status === status);
    }
    
    return NextResponse.json({
      controls: filteredControls,
      total: filteredControls.length,
    });
  } catch (error) {
    console.error('Control API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, effectiveness, owner } = body;
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title and description' },
        { status: 400 }
      );
    }
    
    const newControl = {
      id: Date.now().toString(),
      title,
      description,
      type: type || 'preventive',
      effectiveness: effectiveness || 0,
      status: 'active',
      owner: owner || 'Unassigned',
      lastTested: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockControls.push(newControl);
    
    return NextResponse.json(newControl, { status: 201 });
  } catch (error) {
    console.error('Control Creation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 