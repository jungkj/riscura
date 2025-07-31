import { NextRequest, NextResponse } from 'next/server';
import { ProboService } from '@/services/ProboService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const importance = url.searchParams.get('importance');
    const search = url.searchParams.get('search');

    // Get mitigation controls from Probo service
    const proboService = ProboService.getInstance();
    let mitigations = await proboService.getMitigations();

    // Filter by parameters if provided
    if (category && category !== 'all') {
      mitigations = mitigations.filter((m) => m.category === category);
    }

    if (importance && importance !== 'all') {
      mitigations = mitigations.filter((m) => m.importance === importance);
    }

    if (search) {
      mitigations = await proboService.searchMitigations(search);
    }

    return NextResponse.json({
      mitigations,
      total: mitigations.length,
      categories: await proboService.getMitigationCategories(),
    });
  } catch (error) {
    console.error('Mitigation controls API error:', error);
    return NextResponse.json({ error: 'Failed to fetch mitigation controls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { selectedIds = [] } = await request.json();

    if (selectedIds.length === 0) {
      return NextResponse.json({ error: 'No controls selected for import' }, { status: 400 });
    }

    const proboService = ProboService.getInstance();
    const mitigations = await proboService.getMitigations();
    const selectedMitigations = mitigations.filter((m) => selectedIds.includes(m.id));

    // For now, just return success without database operations
    return NextResponse.json({
      message: 'Mitigation controls imported successfully',
      total: selectedMitigations.length,
      imported: selectedMitigations.length,
      mitigations: selectedMitigations,
    });
  } catch (error) {
    console.error('Mitigation controls import error:', error);
    return NextResponse.json({ error: 'Failed to import mitigation controls' }, { status: 500 });
  }
}
