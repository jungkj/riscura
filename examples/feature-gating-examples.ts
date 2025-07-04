/**
 * Examples of how to use the subscription enforcement and feature gating
 * in API endpoints throughout the Riscura application.
 * 
 * These examples show various ways to implement subscription-based
 * access control and usage tracking.
 */

import { NextRequest } from 'next/server';
import { 
  withAPI, 
  withFeatureGate, 
  withUsageTracking, 
  withPlanLimits,
  withSubscription,
  createAPIResponse 
} from '@/lib/api/middleware';

// ============================================================================
// EXAMPLE 1: Basic Feature Gating
// ============================================================================

// Example: AI-powered risk analysis (requires professional plan or higher)
export const POST = withFeatureGate(['advanced_analytics'])(
  async (req: NextRequest) => {
    // This endpoint will only be accessible to users with plans that include 'advanced_analytics'
    const body = await req.json();
    
    // Perform AI analysis...
    const analysis = {
      riskScore: 85,
      recommendations: ['Implement additional controls', 'Review quarterly'],
      insights: ['High correlation with regulatory changes'],
    };
    
    return createAPIResponse(analysis, {
      message: 'AI analysis completed successfully',
    });
  }
);

// ============================================================================
// EXAMPLE 2: Usage Tracking
// ============================================================================

// Example: API endpoint that tracks AI query usage
export const POST_AI_QUERY = withUsageTracking('aiQueries', 1, { feature: 'risk_analysis' })(
  async (req: NextRequest) => {
    // This will automatically track 1 AI query usage after successful request
    const { prompt } = await req.json();
    
    // Process AI query...
    const response = await processAIQuery(prompt);
    
    return createAPIResponse(response);
  }
);

// ============================================================================
// EXAMPLE 3: Plan Limits Enforcement
// ============================================================================

// Example: Creating a new risk (checks if user is within risk limits)
export const POST_CREATE_RISK = withPlanLimits({ risks: 1 })(
  async (req: NextRequest) => {
    // This will check if creating 1 more risk would exceed the plan limit
    const riskData = await req.json();
    
    // Create the risk...
    const newRisk = await createRisk(riskData);
    
    return createAPIResponse(newRisk, {
      message: 'Risk created successfully',
    });
  }
);

// ============================================================================
// EXAMPLE 4: Multiple User Creation (checks user limits)
// ============================================================================

// Example: Bulk user invite (checks if inviting users would exceed limits)
export const POST_INVITE_USERS = withPlanLimits({ users: 5 })(
  async (req: NextRequest) => {
    // This will check if adding 5 users would exceed the plan limit
    const { emails } = await req.json();
    
    if (emails.length > 5) {
      return createAPIResponse(null, {
        statusCode: 400,
        message: 'Cannot invite more than 5 users at once',
      });
    }
    
    // Process invitations...
    const invitations = await sendInvitations(emails);
    
    return createAPIResponse(invitations);
  }
);

// ============================================================================
// EXAMPLE 5: Combined Subscription Enforcement
// ============================================================================

// Example: Advanced reporting endpoint with multiple requirements
export const GET_ADVANCED_REPORT = withSubscription({
  requireActive: true,
  requiredFeatures: ['advanced_analytics', 'api_access'],
  trackUsage: {
    type: 'reports',
    quantity: 1,
    metadata: { reportType: 'advanced', format: 'pdf' }
  },
  checkLimits: { reports: 1 }
})(
  async (req: NextRequest) => {
    // This endpoint requires:
    // 1. Active subscription
    // 2. Both 'advanced_analytics' and 'api_access' features
    // 3. Will track 1 report usage
    // 4. Checks if generating 1 more report would exceed limits
    
    const { reportType, organizationId } = await req.json();
    
    const report = await generateAdvancedReport(reportType, organizationId);
    
    return createAPIResponse(report);
  }
);

// ============================================================================
// EXAMPLE 6: API Access with Rate Limiting by Plan
// ============================================================================

// Example: Different rate limits based on subscription plan
export const GET_API_DATA = withAPI(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    // Get user's plan to determine rate limits
    const subscription = await getUserSubscription(user.organizationId);
    const apiCallsLimit = subscription?.plan?.limits?.apiCalls || 100;
    
    // Apply dynamic rate limiting based on plan
    if (apiCallsLimit < 1000) {
      // Lower tier plans get stricter rate limiting
      await enforceRateLimit(req, { windowMs: 60000, maxRequests: 10 });
    } else {
      // Higher tier plans get more generous rate limiting
      await enforceRateLimit(req, { windowMs: 60000, maxRequests: 100 });
    }
    
    const data = await fetchAPIData();
    return createAPIResponse(data);
  },
  {
    requireAuth: true,
    subscription: {
      requiredFeatures: ['api_access'],
      trackUsage: { type: 'apiCalls', quantity: 1 }
    }
  }
);

// ============================================================================
// EXAMPLE 7: Premium Features with Graceful Degradation
// ============================================================================

// Example: Risk dashboard with premium features
export const GET_RISK_DASHBOARD = withAPI(
  async (req: NextRequest) => {
    const user = (req as any).user;
    const subscription = await getUserSubscription(user.organizationId);
    
    // Base dashboard data available to all plans
    const basicData = await getRiskDashboardBasics(user.organizationId);
    
    // Premium features only for qualifying plans
    let premiumData = {};
    
    if (hasPlanFeature(subscription, 'advanced_analytics')) {
      premiumData = {
        trendAnalysis: await getTrendAnalysis(user.organizationId),
        predictiveInsights: await getPredictiveInsights(user.organizationId),
        benchmarkComparison: await getBenchmarkData(user.organizationId),
      };
    }
    
    return createAPIResponse({
      ...basicData,
      ...premiumData,
      planFeatures: subscription?.plan?.features || [],
    });
  },
  {
    requireAuth: true,
    subscription: {
      requireActive: true,
      trackUsage: { type: 'dashboardViews', quantity: 1 }
    }
  }
);

// ============================================================================
// EXAMPLE 8: Document Upload with Storage Limits
// ============================================================================

// Example: Document upload with storage limit enforcement
export const POST_UPLOAD_DOCUMENT = withAPI(
  async (req: NextRequest) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const user = (req as any).user;
    
    if (!file) {
      return createAPIResponse(null, {
        statusCode: 400,
        message: 'No file provided',
      });
    }
    
    // Check storage limits
    const subscription = await getUserSubscription(user.organizationId);
    const storageLimit = subscription?.plan?.limits?.storageGB || 1;
    const currentUsage = await getCurrentStorageUsage(user.organizationId);
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    
    if (currentUsage + fileSizeGB > storageLimit) {
      return createAPIResponse(null, {
        statusCode: 402,
        message: `Storage limit exceeded. Current: ${currentUsage.toFixed(2)}GB, Limit: ${storageLimit}GB`,
      });
    }
    
    // Process upload...
    const document = await uploadDocument(file, user.organizationId);
    
    return createAPIResponse(document);
  },
  {
    requireAuth: true,
    subscription: {
      requireActive: true,
      checkLimits: { documents: 1 }
    }
  }
);

// ============================================================================
// HELPER FUNCTIONS (implementation examples)
// ============================================================================

async function processAIQuery(prompt: string): Promise<any> {
  // Implementation would call AI service
  return { response: 'AI analysis result', confidence: 0.95 };
}

async function createRisk(riskData: any): Promise<any> {
  // Implementation would create risk in database
  return { id: 'risk_123', ...riskData, createdAt: new Date() };
}

async function sendInvitations(emails: string[]): Promise<any[]> {
  // Implementation would send email invitations
  return emails.map(email => ({ email, status: 'sent' }));
}

async function generateAdvancedReport(type: string, orgId: string): Promise<any> {
  // Implementation would generate the report
  return { reportId: 'report_123', type, generatedAt: new Date() };
}

async function getUserSubscription(organizationId: string): Promise<any> {
  // Implementation would fetch subscription with plan details
  return null; // Placeholder
}

async function enforceRateLimit(req: NextRequest, limits: any): Promise<void> {
  // Implementation would apply rate limiting
}

async function fetchAPIData(): Promise<any> {
  // Implementation would fetch data
  return { data: 'example' };
}

async function getRiskDashboardBasics(orgId: string): Promise<any> {
  // Implementation would fetch basic dashboard data
  return { totalRisks: 10, criticalRisks: 2 };
}

async function getTrendAnalysis(orgId: string): Promise<any> {
  // Implementation would analyze trends
  return { trend: 'increasing', rate: 0.15 };
}

async function getPredictiveInsights(orgId: string): Promise<any> {
  // Implementation would generate predictions
  return { predictions: ['Risk A likely to increase'] };
}

async function getBenchmarkData(orgId: string): Promise<any> {
  // Implementation would fetch benchmark data
  return { industry: 'Technology', percentile: 75 };
}

function hasPlanFeature(subscription: any, featureId: string): boolean {
  // Implementation would check if plan includes feature
  return subscription?.plan?.features?.some((f: any) => f.id === featureId && f.included);
}

async function getCurrentStorageUsage(orgId: string): Promise<number> {
  // Implementation would calculate current storage usage
  return 0.5; // GB
}

async function uploadDocument(file: File, orgId: string): Promise<any> {
  // Implementation would upload and store document
  return { id: 'doc_123', name: file.name, size: file.size };
}