"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';


const data = [
  { quarter: 'Q1', traditional: 80, riscura: 8 },
  { quarter: 'Q2', traditional: 120, riscura: 12 },
  { quarter: 'Q3', traditional: 160, riscura: 15 },
  { quarter: 'Q4', traditional: 200, riscura: 20 },
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
                Reduce RCSA management from 200+ hours to just 20 hours per quarter.
              </h2>
              <p className="text-lg text-[#A8A8A8] font-inter leading-relaxed">
                Excel-based RCSA requires extensive manual data entry, formula maintenance, and report generation. 
                Riscura's AI automation handles risk discovery, control mapping, and compliance reporting automatically.
              </p>
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
                    domain={[0, 220]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A8A8A8', fontSize: 12, fontFamily: 'Inter' }}
                    tickFormatter={(value) => `${value}h`}
                  />
                  
                  {/* Grid lines */}
                  <ReferenceLine y={50} stroke="#D8C3A5" strokeDasharray="3 3" />
                  <ReferenceLine y={100} stroke="#D8C3A5" strokeDasharray="3 3" />
                  <ReferenceLine y={150} stroke="#D8C3A5" strokeDasharray="3 3" />
                  <ReferenceLine y={200} stroke="#D8C3A5" strokeDasharray="3 3" />
                  
                  {/* Excel-based RCSA Line */}
                  <Line
                    type="monotone"
                    dataKey="traditional"
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
            </div>
            
            {/* Legend */}
            <div className="flex justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#199BEC]"></div>
                <span className="text-sm text-[#191919] font-semibold font-inter">Riscura AI Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#A8A8A8]"></div>
                <span className="text-sm text-[#A8A8A8] font-medium font-inter">Excel-based RCSA</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 