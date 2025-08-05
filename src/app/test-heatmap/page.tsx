'use client';

import React from 'react';
// import { RiskHeatMap } from '@/components/ui/interactive-risk-heatmap';

export default function TestHeatmapPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Interactive Risk Heat Map Test
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Click on any cell in the heatmap to view the risks in that category
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <RiskHeatMap />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
            How to Test:
          </h2>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>• Click on any cell with a number greater than 0</li>
            <li>• A modal will open showing the risks in that impact/likelihood category</li>
            <li>
              • Try clicking on the "2" in "Very High Impact × Very likely" to see 2 critical risks
            </li>
            <li>
              • Try clicking on the "3" in "Very High Impact × Likely" to see 3 critical risks
            </li>
            <li>
              • Try clicking on the "4" in "High Impact × Likely" to see 4 high-priority risks
            </li>
            <li>• Notice the reduced spacing between the "Impact" label and the heatmap</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
            Features Implemented:
          </h2>
          <ul className="space-y-2 text-green-800 dark:text-green-200">
            <li>✅ Clickable heatmap cells with hover effects</li>
            <li>✅ Modal popup showing detailed risk information</li>
            <li>✅ Risk cards with status badges and progress indicators</li>
            <li>✅ Proper risk categorization by impact and likelihood</li>
            <li>✅ Reduced spacing between Impact label and heatmap</li>
            <li>✅ Enhanced visual feedback (hover scale, shadow effects)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
