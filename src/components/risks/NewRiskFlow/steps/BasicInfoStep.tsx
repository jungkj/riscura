'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRiskFlow } from '../RiskFlowContext';
import { RiskCategory } from '@/types/rcsa.types';
import { cn } from '@/lib/utils';

const categories: { value: RiskCategory; label: string; color: string; emoji: string }[] = [
  { value: 'STRATEGIC', label: 'Strategic', color: 'text-purple-600 bg-purple-50', emoji: '🎯' },
  { value: 'OPERATIONAL', label: 'Operational', color: 'text-blue-600 bg-blue-50', emoji: '⚙️' },
  { value: 'FINANCIAL', label: 'Financial', color: 'text-green-600 bg-green-50', emoji: '💰' },
  { value: 'COMPLIANCE', label: 'Compliance', color: 'text-orange-600 bg-orange-50', emoji: '📋' },
  { value: 'REPUTATIONAL', label: 'Reputational', color: 'text-red-600 bg-red-50', emoji: '🌟' },
  { value: 'TECHNOLOGICAL', label: 'Technological', color: 'text-indigo-600 bg-indigo-50', emoji: '💻' },
  { value: 'ENVIRONMENTAL', label: 'Environmental', color: 'text-teal-600 bg-teal-50', emoji: '🌍' },
  { value: 'SOCIAL', label: 'Social', color: 'text-pink-600 bg-pink-50', emoji: '👥' },
];

interface BasicInfoStepProps {
  onNext: () => void;
}

export function BasicInfoStep({ onNext }: BasicInfoStepProps) {
  const { riskData, updateRiskData } = useRiskFlow();
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!riskData.title.trim()) {
      newErrors.title = 'Risk title is required';
    }
    if (!riskData.description.trim()) {
      newErrors.description = 'Risk description is required';
    }
    if (!riskData.category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const generateAISuggestion = async () => {
    if (!riskData.title) return;
    
    setAiSuggesting(true);
    // Simulate AI suggestion (in real app, this would call an API)
    setTimeout(() => {
      const suggestions: Record<string, string> = {
        'Data breach': 'Potential unauthorized access to sensitive customer data through vulnerabilities in our systems, which could result in regulatory fines, legal action, and loss of customer trust.',
        'Supply chain': 'Disruption in critical supply chain operations due to vendor dependencies, geopolitical factors, or natural disasters, potentially impacting product delivery and customer satisfaction.',
        'Cybersecurity': 'Risk of sophisticated cyber attacks targeting our infrastructure, including ransomware, phishing, or DDoS attacks that could compromise business continuity.',
      };
      
      const suggestion = suggestions[riskData.title] || 
        `Risk of ${riskData.title.toLowerCase()} impacting business operations and objectives. This could lead to operational inefficiencies, financial losses, or strategic misalignment.`;
      
      updateRiskData({ description: suggestion });
      setAiSuggesting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label htmlFor="title">Risk Title</Label>
        <Input
          id="title"
          placeholder="e.g., Data breach risk, Supply chain disruption"
          value={riskData.title}
          onChange={(e) => {
            updateRiskData({ title: e.target.value });
            if (errors.title) setErrors({ ...errors, title: '' });
          }}
          className={cn("mt-1", errors.title && "border-red-500")}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.title}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="description">Risk Description</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateAISuggestion}
            disabled={!riskData.title || aiSuggesting}
            className="text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {aiSuggesting ? 'Generating...' : 'AI Suggest'}
          </Button>
        </div>
        <Textarea
          id="description"
          placeholder="Describe the risk, its potential causes, and possible consequences..."
          value={riskData.description}
          onChange={(e) => {
            updateRiskData({ description: e.target.value });
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
          rows={4}
          className={cn("resize-none", errors.description && "border-red-500")}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.description}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Label htmlFor="category">Category</Label>
        <Select
          value={riskData.category || ''}
          onValueChange={(value) => {
            updateRiskData({ category: value as RiskCategory });
            if (errors.category) setErrors({ ...errors, category: '' });
          }}
        >
          <SelectTrigger className={cn("mt-1", errors.category && "border-red-500")}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", cat.color)}>
                    {cat.emoji} {cat.label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.category}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end pt-4"
      >
        <Button onClick={handleNext} size="lg" className="min-w-[120px]">
          Next
        </Button>
      </motion.div>
    </div>
  );
}