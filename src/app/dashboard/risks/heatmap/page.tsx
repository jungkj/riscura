'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnhancedHeading } from '@/components/ui/enhanced-typography';
import { RiskHeatMap } from '@/components/risks/RiskHeatMap';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function RiskHeatMapPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E9] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/60 border border-[#E5E1D8] rounded-lg p-6 backdrop-blur-sm"
        >
          <EnhancedHeading level="h1" className="text-[#2C1810] mb-2">
            Risk Heat Map
          </EnhancedHeading>
          <p className="text-[#6B5B47] text-sm">
            Visualize and analyze your organization's risk landscape through our interactive heat map interface.
          </p>
        </motion.div>

        {/* Heat Map Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/60 border border-[#E5E1D8] rounded-lg backdrop-blur-sm overflow-hidden"
        >
          <Suspense 
            fallback={
              <div className="flex items-center justify-center p-12">
                <LoadingSpinner />
              </div>
            }
          >
            <RiskHeatMap />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}