'use client';

import { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
// import { Shield, ArrowRight, Play, Star, Award, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function VantaInspiredHero() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background pattern from Vanta */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#199BEC]/5 via-white to-purple-50"></div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-[#199BEC]/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div
          className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {/* Announcement Badge */}
          <DaisyBadge className="bg-[#199BEC] text-white px-6 py-2 mb-6 text-sm rounded-full hover:bg-[#0f7dc7] transition-colors">
            <Sparkles className="w-4 h-4 mr-2" />
            Introducing Riscura AI: Powering the future of risk management
          </DaisyBadge>

          {/* Large headline with colored accent */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Risk Management that turns
            <br />
            <span className="text-[#199BEC] bg-gradient-to-r from-[#199BEC] to-blue-600 bg-clip-text text-transparent">
              checkboxes into insights
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
            Riscura helps you identify risk with AI-powered assessments, continuous monitoring, and
            proactive risk management. Go from tedious, point-in-time reviews to collaborative
            workflows—and do more with less.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <DaisyButton
              size="lg"
              className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => router.push('/register')}
            >
              Request a demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </DaisyButton>
            <DaisyButton
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:border-[#199BEC] hover:text-[#199BEC] px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch demo
            </DaisyButton>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>Trusted by 8,000+ companies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#199BEC]" />
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}
