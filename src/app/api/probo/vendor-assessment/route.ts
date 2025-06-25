import { NextRequest, NextResponse } from 'next/server';
import { ProboService, VendorAssessment } from '@/services/ProboService';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteUrl, organizationId } = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const proboService = new ProboService();
    const assessment: VendorAssessment = await proboService.assessVendor(websiteUrl);
    
    // Check if vendor already exists
    let vendor = await db.client.vendor.findFirst({
      where: {
        organizationId,
        OR: [
          { name: assessment.vendorInfo.name },
          { websiteUrl: websiteUrl }
        ]
      }
    });

    // Create vendor if it doesn't exist
    if (!vendor) {
      vendor = await db.client.vendor.create({
        data: {
          name: assessment.vendorInfo.name,
          legalName: assessment.vendorInfo.legalName,
          description: assessment.vendorInfo.description,
          category: assessment.vendorInfo.category as any,
          websiteUrl: websiteUrl,
          email: assessment.vendorInfo.privacyPolicyURL ? 'contact@' + new URL(websiteUrl).hostname : undefined,
          address: assessment.vendorInfo.headquarterAddress,
          certifications: assessment.vendorInfo.certifications,
          riskTier: assessment.riskScore <= 25 ? 'LOW' : 
                   assessment.riskScore <= 50 ? 'MEDIUM' : 
                   assessment.riskScore <= 75 ? 'HIGH' : 'CRITICAL',
          criticality: 'MEDIUM',
          dataAccess: [],
          organizationId,
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      });
    }

    // Create vendor assessment record
    const vendorAssessment = await db.client.vendorAssessment.create({
      data: {
        vendorId: vendor.id,
        assessmentType: 'INITIAL',
        riskScore: assessment.riskScore,
        complianceStatus: assessment.complianceStatus as any,
        assessedBy: (session.user as any).id || 'system',
        vendorSnapshot: assessment.vendorInfo as any,
        securityScore: Math.max(0, 100 - assessment.riskScore),
        privacyScore: assessment.vendorInfo.privacyPolicyURL ? 85 : 40,
        complianceScore: assessment.vendorInfo.certifications.length > 0 ? 80 : 50,
        organizationId
      }
    });

    // Create vendor findings
    for (const finding of assessment.findings) {
      await db.client.vendorFinding.create({
        data: {
          assessmentId: vendorAssessment.id,
          category: finding.category,
          severity: finding.severity,
          title: finding.description.substring(0, 100),
          description: finding.description,
          remediation: finding.remediation,
          status: finding.status,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
    }

    // Get complete assessment with relationships
    const completeAssessment = await db.client.vendorAssessment.findUnique({
      where: { id: vendorAssessment.id },
      include: {
        vendor: true,
        findings: true,
        assessor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(completeAssessment);
  } catch (error) {
    console.error('Vendor assessment API error:', error);
    return NextResponse.json(
      { error: 'Failed to assess vendor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const vendorId = url.searchParams.get('vendorId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { organizationId };
    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    const assessments = await db.client.vendorAssessment.findMany({
      where: whereClause,
      include: {
        vendor: true,
        findings: true,
        assessor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        assessmentDate: 'desc'
      }
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Vendor assessments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor assessments' },
      { status: 500 }
    );
  }
} 