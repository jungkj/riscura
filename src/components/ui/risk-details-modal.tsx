'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  FileText, 
  ExternalLink,
  TrendingUp,
  Shield
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
        return <AlertTriangle className="w-4 h-4" />;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>
              Risks: {impact} Impact × {likelihood} Likelihood
            </span>
          </DialogTitle>
          <DialogDescription>
            {risks.length} risk{risks.length !== 1 ? 's' : ''} found in this category
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No risks found in this category</p>
              </div>
            ) : (
              risks.map((risk) => (
                <Card key={risk.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold">
                          {risk.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          ID: {risk.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={`${getRiskLevelColor(risk.riskLevel)} flex items-center space-x-1`}
                        >
                          {getRiskLevelIcon(risk.riskLevel)}
                          <span className="capitalize">{risk.riskLevel}</span>
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(risk.status)}
                        >
                          {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {risk.description}
                    </p>
                    
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
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {risks.length > 0 && (
            <Button>
              View All Risks
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 