'use client';

import { useState, useEffect, useRef } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  Shield,
  Target,
  Eye,
  BarChart3,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  stats: string;
  color: string;
  mockUI: React.ReactNode;
}

export default function FeatureShowcase() {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const features: Feature[] = [
    {
      icon: Shield,
      title: 'Fast, accurate, automated risk assessments',
      description:
        'Leverage automation to reduce the time it takes to gather all the evidence you need and use AI to accelerate the risk assessment process.',
      stats: '62% faster risk evidence collection time',
      color: 'text-[#199BEC]',
      mockUI: (
        <DaisyCard className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Risk Assessment</h4>
              <DaisyBadge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </DaisyBadge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#199BEC] rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-[#199BEC] rounded-full w-4/5"></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">80%</span>
              </div>
            </div>
          </div>
        </DaisyCard>
      ),
    },
    {
      icon: Target,
      title: 'Risk management, tailored to your program',
      description:
        'Leverage out-of-the-box templates for evaluating risk, or customize inherent and residual risk scoring as your program matures.',
      stats: '54% increased productivity gains',
      color: 'text-[#199BEC]',
      mockUI: (
        <DaisyCard className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Risk Scoring Matrix</h4>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }, (_, i) => {
                const intensity = Math.random();
                const bgColor =
                  intensity > 0.7
                    ? 'bg-red-500'
                    : intensity > 0.5
                      ? 'bg-orange-400'
                      : intensity > 0.3
                        ? 'bg-yellow-400'
                        : 'bg-green-400';

                return (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded ${bgColor} flex items-center justify-center text-white text-xs`}
                  >
                    {Math.floor(intensity * 9) + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </DaisyCard>
      ),
    },
    {
      icon: Eye,
      title: 'Automatic risk discovery for shadow processes',
      description:
        'Automatically identify risks and stay on top of potential blind spots, to make sure all processes meet your security and compliance standards.',
      stats: '90% improvement in risk visibility',
      color: 'text-[#199BEC]',
      mockUI: (
        <DaisyCard className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Discovered Risks</h4>
              <DaisyBadge className="bg-orange-100 text-orange-800">
                <AlertTriangle className="w-3 h-3 mr-1" />5 New
              </DaisyBadge>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Shadow IT Application', severity: 'High' },
                { name: 'Unencrypted Data Transfer', severity: 'Critical' },
                { name: 'Access Control Gap', severity: 'Medium' },
              ].map((risk, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      risk.severity === 'Critical'
                        ? 'bg-red-500'
                        : risk.severity === 'High'
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{risk.name}</div>
                    <div className="text-xs text-gray-500">{risk.severity} Risk</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DaisyCard>
      ),
    },
    {
      icon: BarChart3,
      title: 'Integrated risk across your entire program',
      description:
        "No more juggling between fragmented views. With Riscura, risk becomes a clear, actionable part of your team's unified program.",
      stats: 'Complete risk program integration',
      color: 'text-[#199BEC]',
      mockUI: (
        <DaisyCard className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Risk Dashboard</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#199BEC]">23</div>
                <div className="text-xs text-gray-500">Total Risks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">4</div>
                <div className="text-xs text-gray-500">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">94%</div>
                <div className="text-xs text-gray-500">Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">7</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        </DaisyCard>
      ),
    },
  ];

  useEffect(() => {
    const observers = features.map((_, index) => {
      return new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, index]));
          }
        },
        { threshold: 0.3 }
      );
    });

    sectionRefs.current.forEach((ref, index) => {
      if (ref && observers[index]) {
        observers[index].observe(ref);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          const isVisible = visibleSections.has(index);
          const isReversed = index % 2 === 1;

          return (
            <div
              key={index}
              ref={(el) => {
                sectionRefs.current[index] = el;
              }}
              className={`flex flex-col lg:flex-row items-center gap-12 mb-20 ${
                isReversed ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content Side */}
              <div
                className={`flex-1 transition-all duration-1000 ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : `opacity-0 ${isReversed ? 'translate-x-10' : '-translate-x-10'}`
                }`}
              >
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#199BEC]/10 rounded-2xl flex items-center justify-center mb-6">
                    <IconComponent className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-2xl font-bold text-[#199BEC]">{feature.stats}</div>
                  </div>
                  <DaisyButton className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white">
                    Request a demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </DaisyButton>
                </div>
              </div>

              {/* Mock UI Side */}
              <div
                className={`flex-1 transition-all duration-1000 ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : `opacity-0 ${isReversed ? '-translate-x-10' : 'translate-x-10'}`
                }`}
              >
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg">
                  {feature.mockUI}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
