'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Calendar,
  User2,
  Shield,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { useRiskFlow } from '../RiskFlowContext'
// import { format } from 'date-fns'
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReviewStepProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ReviewStep = ({ onBack, onSuccess }: ReviewStepProps) => {
  const { riskData, setIsSubmitting } = useRiskFlow();
  const [isCreating, setIsCreating] = useState(false);

  const getRiskLevel = (score: number) => {
    if (score <= 5) return { level: 'Low', color: 'text-green-600 bg-green-50', icon: '🟢' };
    if (score <= 10) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50', icon: '🟡' };
    if (score <= 15) return { level: 'High', color: 'text-orange-600 bg-orange-50', icon: '🟠' };
    return { level: 'Critical', color: 'text-red-600 bg-red-50', icon: '🔴' };
  };

  // Validate and clamp likelihood and impact values
  const validLikelihood = Math.max(1, Math.min(5, riskData.likelihood || 1));
  const validImpact = Math.max(1, Math.min(5, riskData.impact || 1));
  const riskScore = validLikelihood * validImpact;
  const riskLevel = getRiskLevel(riskScore);

  const handleCreate = async () => {
    setIsCreating(true);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: riskData.title,
          description: riskData.description,
          category: riskData.category,
          likelihood: validLikelihood,
          impact: validImpact,
          owner: riskData.owner,
          status: riskData.status,
          treatmentStrategy: riskData.treatmentStrategy,
          controlMeasures: riskData.controlMeasures,
          dateIdentified:
            riskData.dateIdentified instanceof Date && !isNaN(riskData.dateIdentified.getTime())
              ? riskData.dateIdentified.toISOString()
              : new Date().toISOString(),
          nextReview:
            riskData.nextReview instanceof Date && !isNaN(riskData.nextReview.getTime())
              ? riskData.nextReview.toISOString()
              : undefined,
          frameworkIds: riskData.frameworkIds,
          tags: riskData.tags,
        }),
      });

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = 'Failed to create risk';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success('Risk created successfully!');
      onSuccess();
    } catch (error) {
      // console.error('Error creating risk:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create risk. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h3 className="text-lg font-semibold mb-2">Review Your Risk</h3>
        <p className="text-sm text-muted-foreground">
          Please review the risk details before creating
        </p>
      </motion.div>

      {/* Risk Preview Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-lg border shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="text-xl font-semibold">{riskData.title}</h4>
              <div className="flex items-center gap-3 text-sm">
                <span className={cn('px-2 py-0.5 rounded-md font-medium', riskLevel.color)}>
                  {riskLevel.icon} {riskLevel.level} Risk
                </span>
                <span className="text-muted-foreground">Score: {riskScore}</span>
              </div>
            </div>
            <div
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                riskData.category === 'STRATEGIC'
                  ? 'bg-purple-100 text-purple-700'
                  : riskData.category === 'OPERATIONAL'
                    ? 'bg-blue-100 text-blue-700'
                    : riskData.category === 'FINANCIAL'
                      ? 'bg-green-100 text-green-700'
                      : riskData.category === 'COMPLIANCE'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
              )}
            >
              {riskData.category}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{riskData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risk Assessment</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>Likelihood: {validLikelihood}/5</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <span>Impact: {validImpact}/5</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Management</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <User2 className="w-4 h-4 text-muted-foreground" />
                  <span>{riskData.owner}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span>{riskData.treatmentStrategy}</span>
                </div>
              </div>
            </div>
          </div>

          {riskData.controlMeasures && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Control Measures</p>
              <p className="text-sm">{riskData.controlMeasures}</p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Identified:{' '}
                {riskData.dateIdentified instanceof Date &&
                !isNaN(riskData.dateIdentified.getTime())
                  ? format(riskData.dateIdentified, 'MMM dd, yyyy')
                  : 'Today'}
              </span>
            </div>
            {riskData.nextReview instanceof Date && !isNaN(riskData.nextReview.getTime()) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Next Review: {format(riskData.nextReview, 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between pt-4"
      >
        <DaisyButton onClick={onBack} variant="outline" size="lg" disabled={isCreating}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </DaisyButton>
        <DaisyButton
          onClick={handleCreate}
          size="lg"
          className="min-w-[140px]"
          disabled={isCreating}
        >
          {isCreating ? (
            <>Creating...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Risk
            </>
          )}
        </DaisyButton>
      </motion.div>
    </div>
  );
};
