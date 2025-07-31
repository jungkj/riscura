'use client';

import { useState, useEffect, useRef } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { 
  Brain, 
  Zap, 
  Target, 
  ArrowRight,
  Sparkles,
  Bot,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function AIFeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const aiFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Risk Analysis",
      description: "Leverage machine learning to identify patterns and predict potential risks before they become critical issues."
    },
    {
      icon: Zap,
      title: "Automated Evidence Collection",
      description: "Automatically gather and organize evidence from multiple sources, reducing manual effort by 80%."
    },
    {
      icon: Target,
      title: "Smart Risk Prioritization",
      description: "AI algorithms analyze risk factors to help you focus on what matters most to your organization."
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    };

  return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-40 h-40 bg-[#199BEC]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* AI Badge */}
          <DaisyBadge className="bg-gradient-to-r from-[#199BEC] to-purple-600 text-white px-6 py-2 mb-8 text-sm rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by Artificial Intelligence
          </DaisyBadge>
          
          {/* Main Headline */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            The future of risk management is
            <br />
            <span className="bg-gradient-to-r from-[#199BEC] to-purple-400 bg-clip-text text-transparent">
              intelligent and automated
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Riscura AI transforms how organizations approach risk management with predictive insights and automation.
          </p>
        </div>
        
        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {aiFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <DaisyCard 
                key={index}
                className={`bg-white/10 backdrop-blur-sm border-white/20 text-white transition-all duration-1000 hover:bg-white/20 hover:scale-105 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <DaisyCardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#199BEC] to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </DaisyCardContent>
              </DaisyCard>
            );
          })}
        </div>
        
        {/* Bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to transform your risk management with AI?
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join forward-thinking organizations using Riscura AI to stay ahead of risks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <DaisyButton size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4">
              Start free trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </DaisyButton>
            <DaisyButton size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4">
              Schedule demo
            </DaisyButton>
          </div>
        </div>
      </div>
    </section>
  );
} 