import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';

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
      // Demo compliance data
      const demoData = {
        frameworks: [
          {
            id: 'sox-2002',
            name: 'Sarbanes-Oxley Act',
            description: 'U.S. federal law for public companies',
            type: 'regulatory',
            mandatory: true,
            coverage: 85,
            maturityScore: 78,
            gaps: 12,
            status: 'in-progress',
          },
          {
            id: 'iso-27001-2022',
            name: 'ISO/IEC 27001:2022',
            description: 'Information security management systems',
            type: 'standard',
            mandatory: false,
            coverage: 92,
            maturityScore: 88,
            gaps: 3,
            status: 'compliant',
          },
          {
            id: 'gdpr-2018',
            name: 'General Data Protection Regulation',
            description: 'EU regulation on data protection',
            type: 'regulatory',
            mandatory: true,
            coverage: 76,
            maturityScore: 71,
            gaps: 8,
            status: 'in-progress',
          },
          {
            id: 'nist-csf-2.0',
            name: 'NIST Cybersecurity Framework',
            description: 'Framework for cybersecurity',
            type: 'guideline',
            mandatory: false,
            coverage: 68,
            maturityScore: 65,
            gaps: 15,
            status: 'in-progress',
          },
        ],
        gaps: [
          { 
            id: '1', 
            title: 'Access Control Testing', 
            priority: 'critical', 
            framework: 'SOX', 
            category: 'IT Controls', 
            dueDate: '2024-03-15',
            description: 'Quarterly access control testing not performed for privileged accounts'
          },
          { 
            id: '2', 
            title: 'Data Encryption Policy', 
            priority: 'high', 
            framework: 'GDPR', 
            category: 'Data Protection', 
            dueDate: '2024-03-22',
            description: 'Update data encryption policy to include cloud storage requirements'
          },
          { 
            id: '3', 
            title: 'Incident Response Plan', 
            priority: 'medium', 
            framework: 'ISO 27001', 
            category: 'Security Management', 
            dueDate: '2024-04-01',
            description: 'Incident response plan needs annual review and testing'
          },
          { 
            id: '4', 
            title: 'Risk Assessment Documentation', 
            priority: 'high', 
            framework: 'NIST', 
            category: 'Risk Management', 
            dueDate: '2024-03-30',
            description: 'Risk assessment documentation incomplete for new business processes'
          },
          { 
            id: '5', 
            title: 'Vendor Risk Assessment', 
            priority: 'medium', 
            framework: 'SOX', 
            category: 'Third Party Management', 
            dueDate: '2024-04-15',
            description: 'Critical vendors missing security assessments'
          },
        ],
        insights: [
          {
            id: '1',
            type: 'risk-based-prioritization',
            title: 'Control Prioritization Recommendations',
            description: 'Based on risk analysis, 5 controls should be prioritized for implementation to maximize compliance coverage',
            severity: 'warning',
            confidence: 0.85,
            recommendations: [
              'Implement automated access reviews for SOX compliance',
              'Deploy data loss prevention (DLP) solution for GDPR',
              'Establish continuous monitoring for NIST framework'
            ],
          },
          {
            id: '2',
            type: 'regulatory-interpretation',
            title: 'New GDPR Guidance Available',
            description: 'Updated guidance on AI systems under GDPR requires review of data processing activities',
            severity: 'info',
            confidence: 0.92,
            recommendations: [
              'Review AI/ML data processing activities',
              'Update privacy impact assessments',
              'Training on new GDPR AI requirements'
            ],
          },
          {
            id: '3',
            type: 'compliance-trends',
            title: 'ISO 27001:2022 Migration Opportunity',
            description: 'Current ISO 27001:2013 implementation well-positioned for 2022 standard upgrade',
            severity: 'info',
            confidence: 0.78,
            recommendations: [
              'Schedule ISO 27001:2022 gap analysis',
              'Plan migration timeline',
              'Update information security policies'
            ],
          },
        ],
        summary: {
          overallComplianceScore: 80,
          activeFrameworks: 4,
          criticalGaps: 1,
          highPriorityGaps: 2,
          mediumPriorityGaps: 2,
          totalGaps: 5,
          mandatoryFrameworks: 2,
          compliantFrameworks: 1,
          inProgressFrameworks: 3
        }
      };

      return NextResponse.json({
        success: true,
        data: demoData,
        demoMode: true
      });
    }

    try {
      // Get real compliance data from database
      const [frameworks, assessments, controls] = await Promise.all([
        // Get compliance frameworks
        db.client.complianceFramework?.findMany({
          where: { organizationId: user.organizationId },
          include: {
            requirements: {
              select: {
                id: true,
                status: true,
                priority: true
              }
            }
          }
        }) || [],
        
        // Get compliance assessments
        db.client.complianceAssessment?.findMany({
          where: { organizationId: user.organizationId },
          include: {
            gaps: {
              select: {
                id: true,
                title: true,
                priority: true,
                category: true,
                dueDate: true,
                status: true
              }
            }
          }
        }) || [],
        
        // Get controls for coverage calculation
        db.client.control?.findMany({
          where: { organizationId: user.organizationId },
          select: {
            id: true,
            effectiveness: true,
            complianceMapping: true
          }
        }) || []
      ]);

      // Process frameworks data
      const processedFrameworks = frameworks.map((framework: any) => {
        const totalRequirements = framework.requirements?.length || 0;
        const completedRequirements = framework.requirements?.filter((r: any) => r.status === 'IMPLEMENTED').length || 0;
        const coverage = totalRequirements > 0 ? Math.round((completedRequirements / totalRequirements) * 100) : 0;
        
        return {
          id: framework.id,
          name: framework.name,
          description: framework.description || '',
          type: framework.type || 'standard',
          mandatory: framework.mandatory || false,
          coverage,
          maturityScore: framework.maturityScore || coverage,
          gaps: framework.requirements?.filter((r: any) => r.status !== 'IMPLEMENTED').length || 0,
          status: coverage >= 90 ? 'compliant' : coverage > 50 ? 'in-progress' : 'non-compliant'
        };
      });

      // Process gaps data
      const allGaps = assessments.flatMap((assessment: any) => 
        (assessment.gaps || []).map((gap: any) => ({
          id: gap.id,
          title: gap.title,
          priority: gap.priority?.toLowerCase() || 'medium',
          framework: assessment.frameworkName || 'Unknown',
          category: gap.category || 'General',
          dueDate: gap.dueDate?.toISOString().split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: gap.description || ''
        }))
      );

      // Generate insights (simplified for now)
      const insights = [
        {
          id: '1',
          type: 'framework-coverage',
          title: 'Framework Coverage Analysis',
          description: `${processedFrameworks.length} frameworks tracked with average coverage of ${Math.round(processedFrameworks.reduce((sum, f) => sum + f.coverage, 0) / Math.max(processedFrameworks.length, 1))}%`,
          severity: processedFrameworks.some(f => f.coverage < 70) ? 'warning' : 'info',
          confidence: 0.9,
          recommendations: []
        }
      ];

      // Calculate summary statistics
      const criticalGaps = allGaps.filter(g => g.priority === 'critical').length;
      const highGaps = allGaps.filter(g => g.priority === 'high').length;
      const mediumGaps = allGaps.filter(g => g.priority === 'medium').length;
      const averageCoverage = processedFrameworks.length > 0 
        ? Math.round(processedFrameworks.reduce((sum, f) => sum + f.coverage, 0) / processedFrameworks.length)
        : 0;

      const summary = {
        overallComplianceScore: averageCoverage,
        activeFrameworks: processedFrameworks.length,
        criticalGaps,
        highPriorityGaps: highGaps,
        mediumPriorityGaps: mediumGaps,
        totalGaps: allGaps.length,
        mandatoryFrameworks: processedFrameworks.filter(f => f.mandatory).length,
        compliantFrameworks: processedFrameworks.filter(f => f.status === 'compliant').length,
        inProgressFrameworks: processedFrameworks.filter(f => f.status === 'in-progress').length
      };

      const data = {
        frameworks: processedFrameworks,
        gaps: allGaps.slice(0, 20), // Limit to recent gaps
        insights,
        summary
      };

      return NextResponse.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Compliance dashboard API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch compliance data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);