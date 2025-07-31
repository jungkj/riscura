'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Share2 } from 'lucide-react';

// Simplified version for testing
interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaire: any;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  questionnaire
}: ShareDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share Questionnaire
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>Share dialog temporarily simplified for build testing</p>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <DaisyButton variant="outline" onClick={() => onOpenChange(false)} />
              Cancel
            </DaisyButton>
            <DaisyButton onClick={() => onOpenChange(false)} />
              Share
            </DaisyButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}