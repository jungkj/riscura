'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Clock, Shield, Target } from 'lucide-react';

interface StatItem {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const sectionRef = useRef<HTMLElement>(null);

  const stats: StatItem[] = [
    {
      value: '62%',
      label: 'faster risk evidence collection time',
      description: 'Reduce time spent gathering evidence with automated workflows',
      icon: Clock,
      color: 'text-[#199BEC]',
    },
    {
      value: '54%',
      label: 'increased productivity gains',
      description: 'Streamline risk management processes with AI-powered insights',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      value: '90%',
      label: 'improvement in risk visibility',
      description: "Get complete visibility into your organization's risk landscape",
      icon: Shield,
      color: 'text-purple-600',
    },
    {
      value: '75%',
      label: 'reduction in compliance overhead',
      description: 'Automate compliance workflows and reduce manual effort',
      icon: Target,
      color: 'text-orange-600',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Animate numbers
          stats.forEach((stat, index) => {
            const numericValue = parseInt(stat.value)
            let current = 0;
            const increment = numericValue / 50;
            const timer = setInterval(
              () => {
                current += increment;
                if (current >= numericValue) {
                  current = numericValue;
                  clearInterval(timer);
                }
                setAnimatedValues((prev) => ({
                  ...prev,
                  [index]: Math.floor(current),
                }));
              },
              30 + index * 10
            ); // Stagger animations
          });
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Spend up to 50% less time on risk assessments
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pull findings from assessments, reports, questionnaires, and more, to help customers cut
            risk assessment times in half with AI-powered automation.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            const animatedValue = animatedValues[index] || 0;

            return (
              <div
                key={index}
                className={`text-center transform transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                </div>

                {/* Animated Value */}
                <div className="mb-2">
                  <span className="text-5xl md:text-6xl font-bold text-[#199BEC]">
                    {animatedValue}%
                  </span>
                </div>

                {/* Label */}
                <div className="text-gray-600 font-medium mb-2">{stat.label}</div>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div
          className={`text-center mt-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <p className="text-gray-600 mb-4">
            Join thousands of companies already using Riscura to transform their risk management
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-400">
            <span>Microsoft</span>
            <span>•</span>
            <span>Salesforce</span>
            <span>•</span>
            <span>Stripe</span>
            <span>•</span>
            <span>Airbnb</span>
            <span>•</span>
            <span>Uber</span>
          </div>
        </div>
      </div>
    </section>
  );
}
