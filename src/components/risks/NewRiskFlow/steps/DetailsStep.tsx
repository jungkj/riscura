'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, User2, Shield, AlertCircle } from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { Textarea } from '@/components/ui/textarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { useRiskFlow, TreatmentStrategy } from '../RiskFlowContext';
import { RiskStatus } from '@/types/rcsa.types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DetailsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const statuses: { value: RiskStatus; label: string; icon: string }[] = [
  { value: 'IDENTIFIED', label: 'Identified', icon: '🔍' },
  { value: 'ASSESSING', label: 'Assessing', icon: '📊' },
  { value: 'TREATING', label: 'Treating', icon: '🛠️' },
  { value: 'MONITORING', label: 'Monitoring', icon: '👁️' },
  { value: 'CLOSED', label: 'Closed', icon: '✅' },
];

const strategies: { value: TreatmentStrategy; label: string; description: string }[] = [
  { value: 'ACCEPT', label: 'Accept', description: 'Accept the risk and its potential consequences' },
  { value: 'MITIGATE', label: 'Mitigate', description: 'Implement controls to reduce likelihood or impact' },
  { value: 'TRANSFER', label: 'Transfer', description: 'Share or transfer the risk (e.g., insurance)' },
  { value: 'AVOID', label: 'Avoid', description: 'Eliminate the risk by avoiding the activity' },
];

export function DetailsStep({ onNext, onBack }: DetailsStepProps) {
  const { riskData, updateRiskData } = useRiskFlow();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!riskData.owner.trim()) {
      newErrors.owner = 'Risk owner is required';
    }
    if (!riskData.treatmentStrategy) {
      newErrors.treatmentStrategy = 'Please select a treatment strategy';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <div>
          <DaisyLabel htmlFor="owner">
            <User2 className="w-4 h-4 inline mr-1" />
            Risk Owner
          </DaisyLabel>
          <DaisyInput
            id="owner"
            placeholder="e.g., John Smith, IT Department"
            value={riskData.owner}
            onChange={(e) => {
              updateRiskData({ owner: e.target.value });
              if (errors.owner) setErrors({ ...errors, owner: '' });
            }}
            className={cn("mt-1", errors.owner && "border-red-500")}
          />
          {errors.owner && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <DaisyAlertCircle className="w-3 h-3" />
              {errors.owner}
            </p>
          )}
        </div>

        <div>
          <DaisyLabel htmlFor="status">Status</DaisyLabel>
          <DaisySelect
            value={riskData.status}
            onValueChange={(value) => updateRiskData({ status: value as RiskStatus })}
          >
            <DaisySelectTrigger className="mt-1">
              <DaisySelectValue />
            </SelectTrigger>
            <DaisySelectContent>
              {statuses.map((status) => (
                <DaisySelectItem key={status.value} value={status.value}>
                  <span className="flex items-center gap-2">
                    <span>{status.icon}</span>
                    {status.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </DaisySelect>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DaisyLabel htmlFor="treatment">
          <Shield className="w-4 h-4 inline mr-1" />
          Treatment Strategy
        </DaisyLabel>
        <div className="mt-2 space-y-2">
          {strategies.map((strategy) => (
            <motion.div
              key={strategy.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  riskData.treatmentStrategy === strategy.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="treatment"
                  value={strategy.value}
                  checked={riskData.treatmentStrategy === strategy.value}
                  onChange={(e) => {
                    updateRiskData({ treatmentStrategy: e.target.value as TreatmentStrategy });
                    if (errors.treatmentStrategy) setErrors({ ...errors, treatmentStrategy: '' });
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">{strategy.label}</p>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </div>
              </label>
            </motion.div>
          ))}
        </div>
        {errors.treatmentStrategy && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <DaisyAlertCircle className="w-3 h-3" />
            {errors.treatmentStrategy}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <DaisyLabel htmlFor="controls">Control Measures</DaisyLabel>
        <Textarea
          id="controls"
          placeholder="Describe any control measures or mitigation actions..."
          value={riskData.controlMeasures}
          onChange={(e) => updateRiskData({ controlMeasures: e.target.value })}
          rows={3}
          className="mt-1 resize-none"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4"
      >
        <div>
          <DaisyLabel htmlFor="dateIdentified">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date Identified
          </DaisyLabel>
          <DaisyInput
            id="dateIdentified"
            type="date"
            value={riskData.dateIdentified ? format(riskData.dateIdentified, 'yyyy-MM-dd') : ''}
            onChange={(e) => updateRiskData({ dateIdentified: new Date(e.target.value) })}
            className="mt-1"
          />
        </div>

        <div>
          <DaisyLabel htmlFor="nextReview">
            <Calendar className="w-4 h-4 inline mr-1" />
            Next Review Date
          </DaisyLabel>
          <DaisyInput
            id="nextReview"
            type="date"
            value={riskData.nextReview ? format(riskData.nextReview, 'yyyy-MM-dd') : ''}
            onChange={(e) => updateRiskData({ nextReview: e.target.value ? new Date(e.target.value) : undefined })}
            className="mt-1"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-between pt-4"
      >
        <DaisyButton onClick={onBack} variant="outline" size="lg">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </DaisyButton>
        <DaisyButton onClick={handleNext} size="lg" className="min-w-[120px]">
          Next
        </DaisyButton>
      </motion.div>
    </div>
  );
}