'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AnimatedWrapper, SlideUp, SlideLeft, SlideRight } from '@/components/ui/AnimatedWrapper';
import { semanticSpacing } from '@/lib/design-system/spacing';

const data = [
  { quarter: 'Q1', excel: 120, riscura: 12 },
  { quarter: 'Q2', excel: 100, riscura: 8 },
  { quarter: 'Q3', excel: 85, riscura: 6 },
  { quarter: 'Q4', excel: 75, riscura: 4 },
];

interface TimeSavingChartProps {
  /** Enable animations for the component */
  animated?: boolean;
}

export const TimeSavingChart = ({ animated = false }: TimeSavingChartProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <section
      className="py-16 bg-[#F5F1E9]"
      style={{ paddingTop: semanticSpacing.section.sm, paddingBottom: semanticSpacing.section.sm }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Excel Hook Section */}
        <AnimatedWrapper
          animationType={animated ? 'slide-up' : 'none'}
          whileInView={animated}
          once={true}
          className="text-center"
          style={{ marginBottom: semanticSpacing.section.sm }}
        >
          <p className="text-2xl sm:text-3xl lg:text-4xl text-[#191919] font-inter leading-relaxed">
            Still using <span className="font-bold text-green-600">Excel</span> to track your RCSA?{' '}
            <span className="text-[#A8A8A8]">
              It's time to upgrade to AI-powered automation that actually works.
            </span>
          </p>
        </AnimatedWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <AnimatedWrapper
            animationType={animated ? 'slide-left' : 'none'}
            whileInView={animated}
            once={true}
            duration={0.8}
          >
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-[#191919] text-[#FAFAFA] text-sm font-medium rounded-full mb-4 font-inter">
                Efficiency Comparison
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#191919] mb-6 leading-tight font-inter">
                Cut assessment time by 95% with AI-powered automation.
              </h2>
              <p className="text-lg text-[#A8A8A8] font-inter leading-relaxed">
                Traditional Excel-based risk assessments consume 120+ hours per quarter. Riscura's
                AI platform completes the same comprehensive analysis in under 4 hours, freeing your
                team for strategic work.
              </p>
            </div>

            {/* CTA Button */}
            <AnimatedWrapper animationType="none" onHover={animated} onTap={animated}>
              <button className="bg-[#199BEC] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0f7dc7] transition-colors font-inter">
                Start Your Transformation
              </button>
            </AnimatedWrapper>
          </AnimatedWrapper>

          {/* Right side - Chart */}
          <AnimatedWrapper
            animationType={animated ? 'slide-right' : 'none'}
            whileInView={animated}
            once={true}
            duration={0.8}
            delay={0.2}
            className="bg-[#FAFAFA] rounded-2xl p-8 shadow-lg border border-[#D8C3A5]"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#191919] mb-2 font-inter">
                Risk Assessment Completion Time
              </h3>
              <p className="text-sm text-[#A8A8A8] font-inter">
                Hours required per quarterly risk assessment
              </p>
            </div>

            <div className="h-80 w-full">
              {Boolean(isClient) && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis
                      dataKey="quarter"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }}
                    />
                    <YAxis
                      domain={[0, 140]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }}
                      tickFormatter={(value) => `${value}h`}
                    />

                    {/* Grid lines */}
                    <ReferenceLine y={30} stroke="#D8C3A5" strokeDasharray="3 3" />
                    <ReferenceLine y={60} stroke="#D8C3A5" strokeDasharray="3 3" />
                    <ReferenceLine y={90} stroke="#D8C3A5" strokeDasharray="3 3" />
                    <ReferenceLine y={120} stroke="#D8C3A5" strokeDasharray="3 3" />

                    {/* Excel-based RCSA Line */}
                    <Line
                      type="monotone"
                      dataKey="excel"
                      stroke="#A8A8A8"
                      strokeWidth={3}
                      dot={{ fill: '#A8A8A8', strokeWidth: 0, r: 6 }}
                      activeDot={{ r: 8, fill: '#A8A8A8' }}
                    />

                    {/* Riscura AI Platform Line */}
                    <Line
                      type="monotone"
                      dataKey="riscura"
                      stroke="#199BEC"
                      strokeWidth={3}
                      dot={{ fill: '#199BEC', strokeWidth: 0, r: 6 }}
                      activeDot={{ r: 8, fill: '#199BEC' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#199BEC]" />
                <span className="text-sm text-[#191919] font-semibold font-inter">
                  Riscura AI Platform
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#A8A8A8]" />
                <span className="text-sm text-[#A8A8A8] font-medium font-inter">
                  Excel-based RCSA
                </span>
              </div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>
    </section>
  );
}
