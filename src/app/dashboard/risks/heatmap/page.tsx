'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { RiskHeatMap } from '@/components/risks/RiskHeatMap';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Plus, Download, Filter } from 'lucide-react';

export default function RiskHeatMapPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Heat Map</h1>
          <p className="text-gray-600">Visualize and analyze your organization's risk landscape through our interactive heat map interface.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" className="text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Heat Map Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Interactive Risk Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense 
            fallback={
              <div className="flex items-center justify-center p-12">
                <LoadingSpinner />
              </div>
            }
          >
            <RiskHeatMap />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}