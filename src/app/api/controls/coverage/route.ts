import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';
import { getRCSADemoData } from '@/lib/demo-data-rcsa';

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Check if this is a demo user
    if (shouldServeDemoData(user.id, user.organizationId)) {
      const demoData = getRCSADemoData(user.organizationId);
      
      // Calculate coverage by domain/category
      const domains = [
        'Access Management', 'Data Protection', 'Network Security', 
        'Application Security', 'Business Continuity', 'Vendor Management',
        'Compliance Management', 'Risk Assessment', 'Incident Response'
      ];

      const coverage = domains.map(domain => {
        // Simulate coverage based on controls
        const domainControls = demoData.controls.filter(c => 
          c.description.toLowerCase().includes(domain.toLowerCase().split(' ')[0])
        );
        
        const totalRequired = Math.floor(Math.random() * 15) + 5; // 5-20 controls required
        const implemented = domainControls.length;
        const coveragePercent = Math.min(100, Math.round((implemented / totalRequired) * 100));
        
        return {
          domain,
          implemented,
          totalRequired,
          coveragePercent,
          status: coveragePercent >= 90 ? 'Complete' : 
                 coveragePercent >= 70 ? 'Good' : 
                 coveragePercent >= 50 ? 'Partial' : 'Inadequate',
          criticalGaps: coveragePercent < 70 ? Math.floor(Math.random() * 3) + 1 : 0
        };
      });

      const summary = {
        totalDomains: domains.length,
        averageCoverage: Math.round(coverage.reduce((sum, c) => sum + c.coveragePercent, 0) / coverage.length),
        completeDomains: coverage.filter(c => c.status === 'Complete').length,
        partialDomains: coverage.filter(c => c.status === 'Partial' || c.status === 'Good').length,
        inadequateDomains: coverage.filter(c => c.status === 'Inadequate').length,
        criticalGaps: coverage.reduce((sum, c) => sum + c.criticalGaps, 0)
      };

      return NextResponse.json({
        success: true,
        data: {
          summary,
          coverage
        },
        demoMode: true
      });
    }

    try {
      // Get controls and risk-control mappings from database
      const [controls, riskControls] = await Promise.all([
        db.client.control.findMany({
          where: { organizationId: user.organizationId },
          select: {
            id: true,
            name: true,
            category: true,
            type: true,
            effectiveness: true,
            status: true
          }
        }),
        db.client.riskControl?.findMany({
          where: {
            risk: {
              organizationId: user.organizationId
            }
          },
          include: {
            control: true,
            risk: {
              select: {
                category: true
              }
            }
          }
        }) || []
      ]);

      // Define control domains/categories
      const domains = [
        'Access Management', 'Data Protection', 'Network Security', 
        'Application Security', 'Business Continuity', 'Vendor Management',
        'Compliance Management', 'Risk Assessment', 'Incident Response'
      ];

      const coverage = domains.map(domain => {
        const domainControls = controls.filter(c => 
          c.category?.toLowerCase().includes(domain.toLowerCase().split(' ')[0]) ||
          c.name?.toLowerCase().includes(domain.toLowerCase().split(' ')[0])
        );
        
        const operational = domainControls.filter(c => c.status === 'OPERATIONAL' || c.status === 'IMPLEMENTED').length;
        const total = domainControls.length;
        const coveragePercent = total > 0 ? Math.round((operational / total) * 100) : 0;
        
        return {
          domain,
          implemented: operational,
          totalRequired: total,
          coveragePercent,
          status: coveragePercent >= 90 ? 'Complete' : 
                 coveragePercent >= 70 ? 'Good' : 
                 coveragePercent >= 50 ? 'Partial' : 'Inadequate',
          criticalGaps: coveragePercent < 70 ? total - operational : 0
        };
      });

      const summary = {
        totalDomains: domains.length,
        averageCoverage: coverage.length > 0 
          ? Math.round(coverage.reduce((sum, c) => sum + c.coveragePercent, 0) / coverage.length)
          : 0,
        completeDomains: coverage.filter(c => c.status === 'Complete').length,
        partialDomains: coverage.filter(c => c.status === 'Partial' || c.status === 'Good').length,
        inadequateDomains: coverage.filter(c => c.status === 'Inadequate').length,
        criticalGaps: coverage.reduce((sum, c) => sum + c.criticalGaps, 0)
      };

      return NextResponse.json({
        success: true,
        data: {
          summary,
          coverage
        }
      });
    } catch (error) {
      console.error('Control coverage API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch control coverage',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);