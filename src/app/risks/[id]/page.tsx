"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRCSA } from '@/context/RCSAContext';
import { RCSABreadcrumb, RCSAContextIndicator } from '@/components/rcsa/RCSABreadcrumb';
import { RCSANavigationTabs, RCSAQuickNavigation } from '@/components/rcsa/RCSANavigationTabs';
import { RiskOverviewTab } from '@/components/rcsa/tabs/RiskOverviewTab';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Loading skeleton component
function RiskDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Navigation tabs skeleton */}
      <div className="flex space-x-4 border-b">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// Error display component
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// Risk not found component
function RiskNotFound() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Risk Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The risk you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => window.history.back()}>
            Return to Risk Register
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RiskDetailPage() {
  const params = useParams();
  const riskId = params?.id as string;
  const { 
    navigateToRisk, 
    currentRisk, 
    loading, 
    error, 
    clearError,
    getRelatedControls 
  } = useRCSA();
  
  const [retryCount, setRetryCount] = useState(0);

  // Load risk data
  useEffect(() => {
    if (riskId) {
      navigateToRisk(riskId);
    }
  }, [riskId, navigateToRisk, retryCount]);

  // Handle retry
  const handleRetry = () => {
    clearError();
    setRetryCount(prev => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <RiskDetailSkeleton />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <ErrorDisplay error={error} onRetry={handleRetry} />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Not found state
  if (!currentRisk) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <RiskNotFound />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Get related entities for quick navigation
  const relatedControls = getRelatedControls(riskId);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb Navigation */}
          <RCSABreadcrumb />
          
          {/* Context Indicator */}
          <RCSAContextIndicator />
          
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  {currentRisk.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Risk ID: {currentRisk.id}</span>
                  <span>•</span>
                  <span>Category: {currentRisk.category}</span>
                  <span>•</span>
                  <span>Status: {currentRisk.status}</span>
                  {currentRisk.aiConfidence && (
                    <>
                      <span>•</span>
                      <span>AI Confidence: {Math.round(currentRisk.aiConfidence * 100)}%</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <Button variant="outline" size="sm">
                  Edit Risk
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Navigation to Related Entities */}
          <RCSAQuickNavigation 
            currentEntityType="risk"
            currentEntityId={riskId}
            className="mb-6"
          />

          {/* Navigation Tabs */}
          <RCSANavigationTabs 
            entityType="risk" 
            entityId={riskId}
            showDescriptions={true}
          >
            {/* Main Content */}
            <RiskOverviewTab 
              risk={currentRisk}
              relatedControls={relatedControls}
            />
          </RCSANavigationTabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
} 