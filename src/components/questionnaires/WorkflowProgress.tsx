'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
// import {
  FileText,
  Hammer,
  BarChart3,
  BookTemplate,
  Workflow as WorkflowIcon,
  ChevronRight,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface WorkflowProgressProps {
  activeStep: string;
  onStepClick?: (step: string) => void;
  className?: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'list',
    label: 'Questionnaires',
    icon: <FileText className="w-4 h-4" />,
    description: 'Manage and view questionnaires',
  },
  {
    id: 'builder',
    label: 'Builder',
    icon: <Hammer className="w-4 h-4" />,
    description: 'Create and edit questionnaires',
  },
  {
    id: 'analytics',
    label: 'Analysis',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'View insights and analytics',
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: <BookTemplate className="w-4 h-4" />,
    description: 'Browse template library',
  },
  {
    id: 'workflow',
    label: 'Workflow',
    icon: <WorkflowIcon className="w-4 h-4" />,
    description: 'Manage approval processes',
  },
];

export const WorkflowProgress = ({ activeStep, onStepClick, className }: WorkflowProgressProps) => {
  const activeIndex = workflowSteps.findIndex((step) => step.id === activeStep);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-center px-4 py-6">
        <div className="flex items-center space-x-1 sm:space-x-2 max-w-5xl w-full overflow-x-auto">
          {workflowSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Pill */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex-shrink-0"
              >
                <button
                  onClick={() => onStepClick?.(step.id)}
                  className={cn(
                    'flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 sm:py-3 rounded-full transition-all duration-300 group',
                    'border-2 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                    activeStep === step.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : index <= activeIndex
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full transition-colors',
                      activeStep === step.id
                        ? 'text-white'
                        : index <= activeIndex
                          ? 'text-green-600'
                          : 'text-gray-400'
                    )}
                  >
                    {step.icon}
                  </div>

                  {/* Label */}
                  <div className="flex flex-col items-start">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                        activeStep === step.id
                          ? 'text-white'
                          : index <= activeIndex
                            ? 'text-green-700'
                            : 'text-gray-500'
                      )}
                    >
                      {step.label}
                    </span>
                    <span
                      className={cn(
                        'text-xs transition-colors hidden lg:block',
                        activeStep === step.id
                          ? 'text-blue-100'
                          : index <= activeIndex
                            ? 'text-green-600'
                            : 'text-gray-400'
                      )}
                    >
                      {step.description}
                    </span>
                  </div>

                  {/* Active Step Indicator */}
                  {activeStep === step.id && (
                    <motion.div
                      layoutId="activeStepIndicator"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full shadow-lg" />
                    </motion.div>
                  )}
                </button>

                {/* Step Number Badge */}
                <div
                  className={cn(
                    'absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                    activeStep === step.id
                      ? 'bg-blue-700 text-white ring-2 ring-blue-200'
                      : index <= activeIndex
                        ? 'bg-green-600 text-white ring-2 ring-green-200'
                        : 'bg-gray-300 text-gray-600 ring-2 ring-gray-100'
                  )}
                >
                  {index + 1}
                </div>
              </motion.div>

              {/* Connector Line */}
              {index < workflowSteps.length - 1 && (
                <div className="flex items-center px-1 sm:px-2">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="relative"
                  >
                    {/* Background Line */}
                    <div className="w-4 sm:w-8 h-0.5 bg-gray-200 rounded-full" />
                    {/* Progress Line */}
                    <motion.div
                      className={cn(
                        'absolute top-0 left-0 h-0.5 rounded-full transition-all duration-500',
                        index < activeIndex
                          ? 'bg-green-500 w-full'
                          : index === activeIndex
                            ? 'bg-blue-500 w-1/2'
                            : 'bg-gray-200 w-0'
                      )}
                      initial={{ width: 0 }}
                      animate={{
                        width: index < activeIndex ? '100%' : index === activeIndex ? '50%' : '0%',
                      }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                    />

                    {/* Animated Chevron */}
                    <ChevronRight
                      className={cn(
                        'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 sm:w-3 h-2 sm:h-3 transition-colors duration-300',
                        index < activeIndex
                          ? 'text-green-500'
                          : index === activeIndex
                            ? 'text-blue-500'
                            : 'text-gray-300'
                      )}
                    />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <motion.div
              className="h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((activeIndex + 1) / workflowSteps.length) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Start</span>
            <span className="font-medium">
              Step {activeIndex + 1} of {workflowSteps.length}
            </span>
            <span>Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
