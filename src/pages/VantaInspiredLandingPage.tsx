'use client';

import { useEffect } from 'react';
import VantaInspiredHero from '@/components/landing/VantaInspiredHero';
import StatsSection from '@/components/landing/StatsSection';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import AIFeaturesSection from '@/components/landing/AIFeaturesSection';

export default function VantaInspiredLandingPage() {
  useEffect(() => {
    // Smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth'

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <VantaInspiredHero />

      {/* Statistics Section */}
      <StatsSection />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* AI Features Section */}
      <AIFeaturesSection />

      {/* Footer CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your risk management?
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Join thousands of companies that trust Riscura to protect their business and streamline
            their risk management processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              Get started free
            </button>
            <button className="border border-gray-300 text-gray-700 hover:border-[#199BEC] hover:text-[#199BEC] px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200">
              Talk to sales
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Trusted by industry leaders</p>
            <div className="flex justify-center items-center space-x-8 text-gray-400 text-sm">
              <span className="font-medium">Microsoft</span>
              <span>•</span>
              <span className="font-medium">Salesforce</span>
              <span>•</span>
              <span className="font-medium">Stripe</span>
              <span>•</span>
              <span className="font-medium">Airbnb</span>
              <span>•</span>
              <span className="font-medium">Uber</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
