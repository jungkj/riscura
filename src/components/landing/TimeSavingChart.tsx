"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Zap } from 'lucide-react';

const data = [
  { quarter: 'Q1', traditional: 10, riscura: 10 },
  { quarter: 'Q2', traditional: 25, riscura: 45 },
  { quarter: 'Q3', traditional: 45, riscura: 85 },
  { quarter: 'Q4', traditional: 65, riscura: 95 },
];

export const TimeSavingChart = () => {
  return (
    <section className="py-16 bg-[#F5F1E9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Excel Hook Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-2xl sm:text-3xl lg:text-4xl text-[#191919] font-inter leading-relaxed">
            Still using <span className="font-bold text-green-600">Excel</span> to track your RCSA?{" "}
            <span className="text-[#A8A8A8]">
              It's time to upgrade to AI-powered automation that actually works.
            </span>
          </p>
        </motion.div>

        {/* Time Savings Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <Badge className="bg-[#199BEC] text-white px-6 py-3 text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            90% Faster Implementation
          </Badge>
          <Badge className="bg-green-600 text-white px-6 py-3 text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            75% Less Manual Work
          </Badge>
          <Badge className="bg-purple-600 text-white px-6 py-3 text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Real-time Updates
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-[#191919] text-[#FAFAFA] text-sm font-medium rounded-full mb-4 font-inter">
                Excel vs AI-Powered Platform
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#191919] mb-6 leading-tight font-inter">
                See how Riscura's AI automation outperforms traditional Excel-based RCSA tracking.
              </h2>
              <p className="text-lg text-[#A8A8A8] font-inter leading-relaxed">
                While Excel requires manual updates, error-prone formulas, and constant maintenance, 
                Riscura delivers automated risk discovery, real-time analytics, and instant compliance reporting.
              </p>
            </div>
            
            {/* Company logos */}
            <div className="mb-8">
              <p className="text-sm text-[#A8A8A8] font-medium mb-4 font-inter">Built by experts from</p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm font-inter">M</span>
                  </div>
                  <span className="font-semibold text-[#191919] font-inter">Meta</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm font-inter">P</span>
                  </div>
                  <span className="font-semibold text-[#191919] font-inter">Palantir</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm font-inter">Y</span>
                  </div>
                  <span className="font-semibold text-[#191919] font-inter">Combinator</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#191919] text-[#FAFAFA] px-6 py-3 rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors font-inter"
            >
              Talk to Sales
            </motion.button>
          </motion.div>

          {/* Right side - Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-[#FAFAFA] rounded-2xl p-8 shadow-lg border border-[#D8C3A5]"
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis 
                    dataKey="quarter" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  
                  {/* Grid lines */}
                  <ReferenceLine y={25} stroke="#D8C3A5" strokeDasharray="3 3" />
                  <ReferenceLine y={50} stroke="#D8C3A5" strokeDasharray="3 3" />
                  <ReferenceLine y={75} stroke="#D8C3A5" strokeDasharray="3 3" />
                  
                  {/* Excel-based RCSA Line */}
                  <Line
                    type="monotone"
                    dataKey="traditional"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', strokeWidth: 0, r: 6 }}
                    activeDot={{ r: 8, fill: '#16a34a' }}
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
            </div>
            
            {/* Legend */}
            <div className="flex justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#199BEC]"></div>
                <span className="text-sm text-[#191919] font-semibold font-inter">Riscura AI Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-600"></div>
                <span className="text-sm text-[#A8A8A8] font-medium font-inter">Excel-based RCSA</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 