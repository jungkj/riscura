'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
// import { RiskHeatMap } from '@/components/risks/RiskHeatMap'
import { LoadingSpinner } from '@/components/ui/DaisyLoadingSpinner';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Activity, Plus, Download, Filter } from 'lucide-react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

export default function RiskHeatMapPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Heat Map</h1>
          <p className="text-gray-600">
            Visualize and analyze your organization's risk landscape through our interactive heat
            map interface.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DaisyButton variant="outline" className="text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </DaisyButton>
          <DaisyButton variant="outline" className="text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </DaisyButton>
          <DaisyButton>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </DaisyButton>
        </div>
      </div>

      {/* Heat Map Content */}
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Interactive Risk Heat Map
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <LoadingSpinner />
              </div>
            }
          >
            <RiskHeatMap />
          </Suspense>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}
