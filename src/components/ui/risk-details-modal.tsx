'use client';

import React from 'react';
import {
  Dialog as DaisyDialog,
  DialogContent as DaisyDialogContent,
  DialogDescription as DaisyDialogDescription,
  DialogHeader as DaisyDialogHeader,
  DialogTitle as DaisyDialogTitle,
} from '@/components/ui/dialog';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import {
  DaisyCard,
  DaisyCardBody,
  DaisyCardTitle,
  DaisyCardBody,
  DaisyCardBody,
  DaisyCardDescription,
} from '@/components/ui/DaisyCard';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import {
  AlertTriangle,
  Calendar,
  User,
  FileText,
  ExternalLink,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'closed';
  createdAt: string;
  updatedAt: string;
  nextReview?: Date;
}

interface RiskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: Risk[];
  impact: string;
  likelihood: string;
}

export const RiskDetailsModal: React.FC<RiskDetailsModalProps> = ({
  isOpen,
  onClose,
  risks,
  impact,
  likelihood,
}) => {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-red-400 text-white';
      case 'medium':
        return 'bg-yellow-400 text-gray-900';
      case 'low':
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <DaisyAlertTriangle className="w-4 h-4">;</DaisyAlertTriangle>;
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      case 'low':
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'assessed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'mitigated':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <DaisyDialog open={isOpen} onOpenChange={onClose}>
      <DaisyDialogContent className="max-w-4xl max-h-[80vh]">
        <DaisyDialogHeader>
          <DaisyDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>
              Risks: {impact} Impact × {likelihood} Likelihood
            </span>
          </DaisyDialogTitle>
          <DaisyDialogDescription>
            {risks.length} risk{risks.length !== 1 ? 's' : ''} found in this category
          </DaisyDialogDescription>
        </DaisyDialogHeader>

        <DaisyScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No risks found in this category</p>
              </div>
            ) : (
              risks.map((risk) => (
                <DaisyCard key={risk.id} className="border-l-4 border-l-blue-500">
                  <DaisyCardBody className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <DaisyCardTitle className="text-lg font-semibold">
                          {risk.title}
                        </DaisyCardTitle>
                        <DaisyCardDescription className="text-sm text-gray-600">
                          ID: {risk.id}
                        </DaisyCardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DaisyBadge
                          className={`${getRiskLevelColor(risk.riskLevel)} flex items-center space-x-1`}
                        >
                          {getRiskLevelIcon(risk.riskLevel)}
                          <span className="capitalize">{risk.riskLevel}</span>
                        </DaisyBadge>
                        <DaisyBadge variant="outline" className={getStatusColor(risk.status)}>
                          {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                        </DaisyBadge>
                      </div>
                    </div>
                  </DaisyCardBody>

                  <DaisyCardBody className="space-y-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{risk.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Risk Score</p>
                          <p className="text-gray-600">{risk.riskScore}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Owner</p>
                          <p className="text-gray-600">{risk.owner}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Category</p>
                          <p className="text-gray-600">{risk.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Last Updated</p>
                          <p className="text-gray-600">
                            {new Date(risk.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Impact Level</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${(risk.impact / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{risk.impact}/5</span>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Likelihood</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${(risk.likelihood / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{risk.likelihood}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <DaisyButton
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Details</span>
                      </DaisyButton>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              ))
            )}
          </div>
        </DaisyScrollArea>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <DaisyButton variant="outline" onClick={onClose}>
            Close
          </DaisyButton>
          {risks.length > 0 && <DaisyButton>View All Risks</DaisyButton>}
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
};
