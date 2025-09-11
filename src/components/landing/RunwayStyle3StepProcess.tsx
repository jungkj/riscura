"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  FileText,
  Users,
  Target,
  AlertTriangle,
  Zap,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const RunwayStyle3StepProcess = () => {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState(0);

  // Runway.com style feature cards with risk management content
  const features = [
    {
      id: 'analyze',
      title: 'Analyze with AI',
      subtitle: 'Beta',
      description: 'Accelerate risk workflows, drill into compliance gaps, and deeply understand your risk landscape.',
      buttonText: 'Get a personalized sneak peek',
      mockup: {
        type: 'analysis',
        title: 'AI-generated risk analysis explaining changes in risk metrics',
        subtitle: 'with a chatbot interface interpreting compliance variance and risk trends',
        content: {
          metrics: [
            { label: 'High Risk Items', value: '23', change: '+5', trend: 'up' },
            { label: 'Compliance Score', value: '87%', change: '+3%', trend: 'up' },
            { label: 'Control Gaps', value: '12', change: '-2', trend: 'down' }
          ],
          chat: [
            { type: 'ai', message: 'I noticed a 15% increase in operational risks this quarter, primarily driven by new regulatory requirements in the financial services sector.' },
            { type: 'user', message: 'What specific controls should we prioritize?' },
            { type: 'ai', message: 'Based on the analysis, I recommend focusing on data governance controls and implementing automated monitoring for PCI DSS compliance.' }
          ]
        }
      }
    },
    {
      id: 'model',
      title: 'Shape data to your business logic',
      subtitle: '',
      description: 'Create flexible, structured risk models built to scale. Define custom risk categories, tie in compliance frameworks, and reuse assessments across departments.',
      buttonText: '',
      mockup: {
        type: 'modeling',
        title: 'Riscura platform showing structured risk modeling',
        subtitle: 'with formula logic for risk calculations, using tags like departments, risk types, and compliance frameworks',
        content: {
          formula: 'Risk Score = (Impact × Likelihood × Control Effectiveness) / Mitigation Factor',
          tags: ['Financial Services', 'Operational Risk', 'SOC 2', 'High Impact'],
          categories: [
            { name: 'Cyber Security', weight: 0.35, color: '#ef4444' },
            { name: 'Operational', weight: 0.25, color: '#f97316' },
            { name: 'Financial', weight: 0.20, color: '#eab308' },
            { name: 'Compliance', weight: 0.20, color: '#22c55e' }
          ]
        }
      }
    },
    {
      id: 'test',
      title: 'Pressure test every scenario',
      subtitle: '',
      description: 'Create dimension-rich risk scenarios, drag and drop to explore outcomes, and make instant decisions about risk appetite and mitigation strategies.',
      buttonText: '',
      mockup: {
        type: 'scenarios',
        title: 'Risk scenario planning interface showing editable mitigation timelines',
        subtitle: 'for incident response and compliance deadlines, enabling instant scenario adjustments and impact analysis',
        content: {
          scenarios: [
            { name: 'Base Case', riskScore: 2.3, budget: '$50K', timeline: '3 months' },
            { name: 'High Impact Event', riskScore: 4.1, budget: '$150K', timeline: '1 month' },
            { name: 'Regulatory Change', riskScore: 3.2, budget: '$75K', timeline: '6 months' }
          ],
          timeline: [
            { phase: 'Assessment', start: '2024-01', duration: 4 },
            { phase: 'Mitigation', start: '2024-05', duration: 8 },
            { phase: 'Monitoring', start: '2024-13', duration: 12 }
          ]
        }
      }
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % features.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [features.length]);

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  const renderMockup = (feature: typeof features[0]) => {
    const { mockup } = feature;
    
    if (mockup.type === 'analysis') {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Risk Analysis Dashboard</h4>
            <Badge className="bg-blue-100 text-blue-700">AI Powered</Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {mockup.content.metrics.map((metric, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
                <div className={`text-xs flex items-center justify-center mt-1 ${
                  metric.trend === 'up' ? 'text-red-600' : 'text-green-600'
                }`}>
                  <TrendingUp className={`w-3 h-3 mr-1 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  {metric.change}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 max-h-32 overflow-y-auto">
            {mockup.content.chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-lg p-2 text-sm ${
                  msg.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (mockup.type === 'modeling') {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Risk Model Builder</h4>
            <Badge className="bg-purple-100 text-purple-700">Formula Logic</Badge>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-mono text-gray-800 mb-2">Formula:</div>
            <div className="text-sm font-mono bg-white p-2 rounded border">
              {mockup.content.formula}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {mockup.content.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            {mockup.content.categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-medium">{Math.round(cat.weight * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (mockup.type === 'scenarios') {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Scenario Planning</h4>
            <Badge className="bg-green-100 text-green-700">Live Analysis</Badge>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Scenario</th>
                  <th className="text-left p-2">Risk Score</th>
                  <th className="text-left p-2">Budget</th>
                  <th className="text-left p-2">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {mockup.content.scenarios.map((scenario, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-2 font-medium">{scenario.name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        scenario.riskScore > 3.5 ? 'bg-red-100 text-red-800' :
                        scenario.riskScore > 2.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {scenario.riskScore}
                      </span>
                    </td>
                    <td className="p-2">{scenario.budget}</td>
                    <td className="p-2">{scenario.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">Implementation Timeline</div>
            <div className="space-y-2">
              {mockup.content.timeline.map((phase, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{phase.phase}</span>
                  <span className="text-xs text-gray-500">({phase.duration} weeks)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        
        {/* Header - Runway style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-20"
        >
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            Turn complexity into conviction
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            "Incredibly flexible and powerful risk management platform"
          </motion.p>
        </motion.div>

        {/* Main Content - Exact Runway 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column - Feature Content */}
          <div className="space-y-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true, amount: 0.3 }}
                className={`transition-all duration-500 ${
                  activeCard === index ? 'opacity-100' : 'opacity-40'
                }`}
                onMouseEnter={() => setActiveCard(index)}
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                    {feature.subtitle && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {feature.subtitle}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {feature.buttonText && (
                    <Button 
                      variant="outline" 
                      className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      {feature.buttonText}
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column - Interactive Mockups */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
              >
                {renderMockup(features[activeCard])}
              </motion.div>
            </AnimatePresence>

            {/* Subtle background decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 blur-2xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-100 rounded-full opacity-20 blur-2xl -z-10" />
          </div>
        </div>

        {/* Navigation Dots - Runway style */}
        <div className="flex justify-center mt-16 space-x-3">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${activeCard === index ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'}
              `}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mt-20"
        >
          <motion.h3 
            className="text-3xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Act on shared intuition
          </motion.h3>
          
          <motion.p 
            className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Drive aligned, data-informed risk decisions with unified inputs from compliance, security, and operations teams.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="px-12 py-4 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get started today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default RunwayStyle3StepProcess;
export { RunwayStyle3StepProcess };