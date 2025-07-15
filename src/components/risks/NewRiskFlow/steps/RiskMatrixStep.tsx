'use client';

import { useState, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRiskFlow } from '../RiskFlowContext';
import { cn } from '@/lib/utils';
import { ChevronLeft, Info } from 'lucide-react';

interface RiskMatrixStepProps {
  onNext: () => void;
  onBack: () => void;
}

const likelihoodLabels = ['Very Unlikely', 'Unlikely', 'Possible', 'Likely', 'Very Likely'];
const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];

const matrixColors = [
  ['bg-green-100', 'bg-green-200', 'bg-yellow-100', 'bg-yellow-200', 'bg-orange-100'],
  ['bg-green-200', 'bg-yellow-100', 'bg-yellow-200', 'bg-orange-100', 'bg-orange-200'],
  ['bg-yellow-100', 'bg-yellow-200', 'bg-orange-100', 'bg-orange-200', 'bg-red-100'],
  ['bg-yellow-200', 'bg-orange-100', 'bg-orange-200', 'bg-red-100', 'bg-red-200'],
  ['bg-orange-100', 'bg-orange-200', 'bg-red-100', 'bg-red-200', 'bg-red-300'],
];

export function RiskMatrixStep({ onNext, onBack }: RiskMatrixStepProps) {
  const { riskData, updateRiskData } = useRiskFlow();
  const matrixRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMatrixClick = (likelihood: number, impact: number) => {
    updateRiskData({ likelihood, impact });
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!matrixRef.current) return;
    
    const rect = matrixRef.current.getBoundingClientRect();
    const x = 'clientX' in event ? event.clientX : 0;
    const y = 'clientY' in event ? event.clientY : 0;
    
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    const cellWidth = rect.width / 5;
    const cellHeight = rect.height / 5;
    
    const likelihood = Math.min(Math.max(Math.ceil(relativeX / cellWidth), 1), 5);
    const impact = Math.min(Math.max(Math.ceil((rect.height - relativeY) / cellHeight), 1), 5);
    
    updateRiskData({ likelihood, impact });
    setIsDragging(false);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 5) return { level: 'Low', color: 'text-green-600' };
    if (score <= 10) return { level: 'Medium', color: 'text-yellow-600' };
    if (score <= 15) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Critical', color: 'text-red-600' };
  };

  const riskScore = riskData.likelihood * riskData.impact;
  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h3 className="text-lg font-semibold mb-2">Position Your Risk on the Matrix</h3>
        <p className="text-sm text-muted-foreground">
          Drag the risk marker or click on a cell to assess likelihood and impact
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-lg p-6 shadow-sm"
      >
        <div className="flex gap-8">
          {/* Risk Matrix */}
          <div className="flex-1">
            <div className="relative">
              {/* Y-axis label */}
              <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground">
                Impact
              </div>
              
              {/* Matrix Grid */}
              <div 
                ref={matrixRef}
                className="relative grid grid-cols-5 gap-1 p-8"
                style={{ aspectRatio: '1' }}
              >
                {[5, 4, 3, 2, 1].map((impact) => (
                  [1, 2, 3, 4, 5].map((likelihood) => (
                    <motion.button
                      key={`${likelihood}-${impact}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMatrixClick(likelihood, impact)}
                      className={cn(
                        "relative rounded-md transition-all duration-200 border-2",
                        matrixColors[5 - impact][likelihood - 1],
                        riskData.likelihood === likelihood && riskData.impact === impact
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-gray-300"
                      )}
                    >
                      {riskData.likelihood === likelihood && riskData.impact === impact && (
                        <motion.div
                          drag
                          dragElastic={0.2}
                          dragConstraints={matrixRef}
                          onDragStart={() => setIsDragging(true)}
                          onDragEnd={handleDragEnd}
                          whileDrag={{ scale: 1.2, zIndex: 50 }}
                          className="absolute inset-0 flex items-center justify-center cursor-move"
                        >
                          <div className="w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-white font-bold">
                            {riskScore}
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  ))
                ))}
                
                {/* Impact labels */}
                <div className="absolute -left-6 top-0 bottom-0 flex flex-col-reverse justify-around text-xs text-muted-foreground">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="text-center">{i}</div>
                  ))}
                </div>
                
                {/* Likelihood labels */}
                <div className="absolute left-0 right-0 -bottom-6 flex justify-around text-xs text-muted-foreground">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="text-center">{i}</div>
                  ))}
                </div>
              </div>
              
              {/* X-axis label */}
              <div className="text-center mt-8 text-sm font-medium text-muted-foreground">
                Likelihood
              </div>
            </div>
          </div>

          {/* Risk Details */}
          <div className="w-64 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-muted rounded-lg p-4"
            >
              <h4 className="font-medium mb-3">Risk Assessment</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Likelihood</p>
                  <p className="font-medium">{likelihoodLabels[riskData.likelihood - 1]} ({riskData.likelihood}/5)</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Impact</p>
                  <p className="font-medium">{impactLabels[riskData.impact - 1]} ({riskData.impact}/5)</p>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <p className={cn("text-2xl font-bold", riskLevel.color)}>
                    {riskScore} - {riskLevel.level}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 rounded-lg p-4"
            >
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">How to assess:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Likelihood:</strong> How probable is this risk?</li>
                    <li>• <strong>Impact:</strong> How severe would the consequences be?</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between pt-4"
      >
        <Button onClick={onBack} variant="outline" size="lg">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} size="lg" className="min-w-[120px]">
          Next
        </Button>
      </motion.div>
    </div>
  );
}