'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Table2, 
  Grid3x3, 
  Plus, 
  FileSpreadsheet,
  ArrowLeft,
  Info
} from 'lucide-react';
import { NotionRCSASpreadsheet } from '@/components/spreadsheet/NotionRCSASpreadsheet';
import { RCSASpreadsheet } from '@/components/spreadsheet/RCSASpreadsheet';
import { RCSAProvider } from '@/context/RCSAContext';
import { cn } from '@/lib/utils';

type ViewMode = 'notion' | 'classic';

export default function RCSAPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('notion');

  return (
    <RCSAProvider>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Risk Control Self Assessment
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm">
              <Info className="h-4 w-4" />
              <span>All-in-One View</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('notion')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'notion'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Table2 className="h-4 w-4" />
              Notion View
            </button>
            <button
              onClick={() => setViewMode('classic')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'classic'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Grid3x3 className="h-4 w-4" />
              Classic View
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {viewMode === 'notion' ? (
              <NotionRCSASpreadsheet />
            ) : (
              <RCSASpreadsheet />
            )}
          </motion.div>
        </div>

        {/* Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10"
          onClick={() => {
            // Open create modal based on view mode
            console.log('Create new item');
          }}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>
    </RCSAProvider>
  );
}