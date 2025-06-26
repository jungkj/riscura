import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardData, useRisksData, useControlsData } from '@/hooks/use-live-data';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function LiveDataTest() {
  const dashboard = useDashboardData();
  const risks = useRisksData();
  const controls = useControlsData();

  const DataSection = ({ 
    title, 
    data, 
    loading, 
    error, 
    refetch 
  }: { 
    title: string; 
    data: any; 
    loading: boolean; 
    error: string | null; 
    refetch: () => void; 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          {error && <AlertCircle className="h-4 w-4 text-red-500" />}
          {!loading && !error && <CheckCircle className="h-4 w-4 text-green-500" />}
          <Button variant="secondary" size="sm" onClick={refetch}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && data && (
          <div className="space-y-2">
            <Badge variant="secondary">
              {Array.isArray(data) ? `${data.length} items` : 'Object loaded'}
            </Badge>
            <div className="text-xs text-muted-foreground">
              <pre className="max-h-32 overflow-auto">
                {JSON.stringify(data, null, 2).substring(0, 200)}...
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Data Connectivity Test</h3>
        <Badge variant={
          !dashboard.loading && !risks.loading && !controls.loading &&
          !dashboard.error && !risks.error && !controls.error
            ? "default" : "destructive"
        }>
          {!dashboard.loading && !risks.loading && !controls.loading &&
           !dashboard.error && !risks.error && !controls.error
            ? "All Connected" : "Issues Detected"}
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <DataSection
          title="Dashboard API"
          data={dashboard.data}
          loading={dashboard.loading}
          error={dashboard.error}
          refetch={dashboard.refetch}
        />
        
        <DataSection
          title="Risks API"
          data={risks.data}
          loading={risks.loading}
          error={risks.error}
          refetch={risks.refetch}
        />
        
        <DataSection
          title="Controls API"
          data={controls.data}
          loading={controls.loading}
          error={controls.error}
          refetch={controls.refetch}
        />
      </div>
    </div>
  );
} 