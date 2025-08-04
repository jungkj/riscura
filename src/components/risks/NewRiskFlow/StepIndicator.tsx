'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between" role="list" aria-label="Progress steps">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;

        return (
          <div
            key={step.id}
            className="flex items-center flex-1"
            role="listitem"
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive
                    ? 'rgb(59 130 246)'
                    : isCompleted
                      ? 'rgb(34 197 94)'
                      : 'rgb(229 231 235)',
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white relative',
                  !isActive && !isCompleted && 'text-gray-600'
                )}
                aria-label={`Step ${index + 1}: ${step.label} - ${isCompleted ? 'Completed' : isActive ? 'Current' : 'Upcoming'}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-lg">{step.icon}</span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeRing"
                    className="absolute inset-0 rounded-full ring-4 ring-blue-500/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.div>

              <div className="ml-3">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{
                      width: isCompleted ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
