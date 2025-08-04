'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
// import { Users, Share2, UserPlus } from 'lucide-react';

// Simplified version for testing
interface CollaborationPanelProps {
  questionnaireId: string;
  currentUser: any;
  onUserActivity?: (activity: any) => void;
  className?: string;
}

export function CollaborationPanel({
  questionnaireId,
  currentUser,
  onUserActivity,
  className,
}: CollaborationPanelProps) {
  const [activeUsers] = useState([]);

  return (
    <DaisyCard className={`h-full ${className}`}>
      <DaisyCardBody className="pb-3">
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="text-lg flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Collaboration
          </DaisyCardTitle>

          <div className="flex items-center space-x-2">
            <DaisyButton variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </DaisyButton>

            <DaisyButton variant="ghost" size="sm">
              <UserPlus className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
      </DaisyCardBody>

      <DaisyCardBody>
        <div className="text-center py-8 text-gray-500">
          <p>Collaboration features temporarily simplified for build testing</p>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}
