'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Table2, 
  Grid3x3, 
  Plus, 
  FileSpreadsheet,
  ArrowLeft,
  Info,
  Upload
} from 'lucide-react';
import { NotionRCSASpreadsheet } from '@/components/spreadsheet/NotionRCSASpreadsheet';
import RCSASpreadsheet from '@/components/spreadsheet/RCSASpreadsheet';
import RCSAImportFlow from '@/components/rcsa/RCSAImportFlow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ViewMode = 'notion' | 'classic';

export default function RCSAPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('notion');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleImportComplete = () => {
    setShowImportDialog(false);
    // Refresh the page or data
    window.location.reload();
  };

  return (
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

          <div className="flex items-center gap-4">
            {/* Import Button */}
            <Button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import RCSA
            </Button>

            {/* View Mode Toggle with Accessibility */}
            <div 
              className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800"
              role="radiogroup"
              aria-label="View mode selection"
            >
            <button
              onClick={() => setViewMode('notion')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                viewMode === 'notion'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
              role="radio"
              aria-checked={viewMode === 'notion'}
              aria-label="Notion view mode"
              tabIndex={viewMode === 'notion' ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  setViewMode('classic');
                  e.preventDefault();
                }
              }}
            >
              <Table2 className="h-4 w-4" aria-hidden="true" />
              <span>Notion View</span>
            </button>
            <button
              onClick={() => setViewMode('classic')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                viewMode === 'classic'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
              role="radio"
              aria-checked={viewMode === 'classic'}
              aria-label="Classic view mode"
              tabIndex={viewMode === 'classic' ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  setViewMode('notion');
                  e.preventDefault();
                }
              }}
            >
              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
              <span>Classic View</span>
            </button>
          </div>
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
              <RCSASpreadsheet spreadsheetId="default" />
            )}
          </motion.div>
        </div>

        {/* Removed non-functional floating action button - creation handled within spreadsheet components */}
        
        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import RCSA Data</DialogTitle>
              <DialogDescription>
                Upload your RCSA Excel file or paste data to automatically analyze and import risks and controls
              </DialogDescription>
            </DialogHeader>
            <RCSAImportFlow onComplete={handleImportComplete} />
          </DialogContent>
        </Dialog>
      </div>
  );
}