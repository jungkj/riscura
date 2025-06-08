"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Zap, AlertTriangle, CheckCircle, X, FileSpreadsheet, Bot } from 'lucide-react';

const comparisonData = [
  {
    category: "Setup Time",
    excel: { value: "3-6 months", color: "text-red-600", icon: Clock },
    riscura: { value: "5 minutes", color: "text-green-600", icon: Zap }
  },
  {
    category: "Manual Work",
    excel: { value: "95% manual", color: "text-red-600", icon: AlertTriangle },
    riscura: { value: "5% manual", color: "text-green-600", icon: Bot }
  },
  {
    category: "Error Rate",
    excel: { value: "High risk", color: "text-red-600", icon: X },
    riscura: { value: "AI validated", color: "text-green-600", icon: CheckCircle }
  },
  {
    category: "Real-time Updates",
    excel: { value: "Manual refresh", color: "text-red-600", icon: Clock },
    riscura: { value: "Automatic", color: "text-green-600", icon: TrendingUp }
  }
];

export const TimeSavingChart = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comparisonData.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-[#191919] text-[#FAFAFA] text-sm font-medium rounded-full mb-4 font-inter">
                Excel vs AI-Powered Platform
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#191919] mb-6 leading-tight font-inter">
                Stop wasting time on manual RCSA processes.
              </h2>
              <p className="text-lg text-[#A8A8A8] font-inter leading-relaxed mb-8">
                See the dramatic difference between traditional Excel workflows and Riscura's 
                intelligent automation across every aspect of risk management.
              </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600 mb-1">200+</div>
                  <div className="text-sm text-gray-600">Hours saved per quarter</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-1">90%</div>
                  <div className="text-sm text-gray-600">Less manual work</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#199BEC] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0f7dc7] transition-colors font-inter"
            >
              See Riscura in Action
            </motion.button>
          </motion.div>

          {/* Right side - Animated Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Comparison Cards */}
            <div className="space-y-4">
              {comparisonData.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isVisible ? 1 : 0, 
                    y: isVisible ? 0 : 20,
                    scale: currentIndex === index ? 1.02 : 1
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-lg border transition-all duration-300 ${
                    currentIndex === index ? 'border-[#199BEC] shadow-xl' : 'border-gray-200'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-500 mb-4 font-inter">
                    {item.category}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Excel Side */}
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <FileSpreadsheet className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-inter">Excel</div>
                        <div className={`text-sm font-semibold ${item.excel.color} font-inter`}>
                          {item.excel.value}
                        </div>
                      </div>
                    </div>

                    {/* Riscura Side */}
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <item.riscura.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-inter">Riscura</div>
                        <div className={`text-sm font-semibold ${item.riscura.color} font-inter`}>
                          {item.riscura.value}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator for highlighted item */}
                  {currentIndex === index && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                      className="h-1 bg-[#199BEC] rounded-full mt-4"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Floating indicators */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-[#199BEC] text-white p-3 rounded-full shadow-lg"
            >
              <TrendingUp className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 