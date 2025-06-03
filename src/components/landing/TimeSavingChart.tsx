"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

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
                Accelerated Time-to-Value
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#191919] mb-6 leading-tight font-inter">
                Riscura automates discovery, planning, data migration, and validation so that your customers go live faster.
              </h2>
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
                  
                  {/* Traditional Methods Line */}
                  <Line
                    type="monotone"
                    dataKey="traditional"
                    stroke="#A8A8A8"
                    strokeWidth={3}
                    dot={{ fill: '#A8A8A8', strokeWidth: 0, r: 6 }}
                    activeDot={{ r: 8, fill: '#A8A8A8' }}
                  />
                  
                  {/* Riscura Line */}
                  <Line
                    type="monotone"
                    dataKey="riscura"
                    stroke="#191919"
                    strokeWidth={3}
                    dot={{ fill: '#191919', strokeWidth: 0, r: 6 }}
                    activeDot={{ r: 8, fill: '#191919' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex justify-end space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#191919]"></div>
                <span className="text-sm text-[#191919] font-medium font-inter">Riscura</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#A8A8A8]"></div>
                <span className="text-sm text-[#A8A8A8] font-medium font-inter">Traditional Methods</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 