"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Check, Zap, Star, Crown, ArrowRight } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/stripe';
import { useRouter } from 'next/navigation';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';

interface PricingSectionProps {
  onStartTrial?: () => void;
  onUpgrade?: (plan: 'PRO' | 'ENTERPRISE') => void;
}

export default function PricingSection({ onStartTrial, onUpgrade }: PricingSectionProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { loading, error, startFreeTrial, upgradeToEnterprise } = useStripeCheckout();

  const handleStartTrial = async () => {
    if (onStartTrial) {
      onStartTrial();
    } else {
      await startFreeTrial();
    }
  };

  const handleUpgrade = async (plan: 'PRO' | 'ENTERPRISE') => {
    if (onUpgrade) {
      onUpgrade(plan);
    } else if (plan === 'ENTERPRISE') {
      await upgradeToEnterprise();
    } else {
      router.push('/contact');
    }
  };

  const plans = [
    {
      key: 'FREE' as const,
      ...SUBSCRIPTION_PLANS.FREE,
      icon: Zap,
      popular: false,
      description: 'Perfect for getting started with risk management',
      buttonText: 'Get Started Free',
      buttonVariant: 'secondary' as const
    },
    {
      key: 'PRO' as const,
      ...SUBSCRIPTION_PLANS.PRO,
      icon: Star,
      popular: true,
      description: 'Advanced features for growing organizations',
      buttonText: '7-Day Free Trial',
      buttonVariant: 'default' as const,
      trialText: 'Then $15/month'
    },
    {
      key: 'ENTERPRISE' as const,
      ...SUBSCRIPTION_PLANS.ENTERPRISE,
      icon: Crown,
      popular: false,
      description: 'Custom solutions for large enterprises',
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary' as const
    }
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <DaisyBadge className="bg-[#199BEC]/10 text-[#199BEC] px-4 py-2 mb-6 text-sm" >
  Simple Pricing
</DaisyBadge>
          </DaisyBadge>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Choose your plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Start with our free trial. No credit card required.
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <DaisyBadge className="bg-[#199BEC] text-white px-4 py-1 font-semibold" >
  Most Popular
</DaisyBadge>
                    </DaisyBadge>
                  </div>
                )}
                
                <DaisyCard className={`
                  h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl
                  ${plan.popular 
                    ? 'border-[#199BEC] shadow-lg bg-gradient-to-br from-[#199BEC]/5 to-white' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <DaisyCardBody className="text-center pb-8" >
  <div className={`
                      w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4
                      ${plan.popular ? 'bg-[#199BEC]/10' : 'bg-gray-100'}
                    `}>
</DaisyCard>
                      <Icon className={`
                        w-8 h-8 
                        ${plan.popular ? 'text-[#199BEC]' : 'text-gray-600'}
                      `} />
                    </div>
                    
                    <DaisyCardTitle className="text-2xl font-bold text-gray-900 mb-2" >
  {plan.name}
</DaisyCardTitle>
                    </DaisyCardTitle>
                    
                    <p className="text-gray-600 text-sm mb-4">
                      {plan.description}
                    </p>
                    
                    <div className="mb-6">
                      {plan.price === null ? (
                        <div className="text-3xl font-bold text-gray-900">
                          Custom
                        </div>
                      ) : plan.price === 0 ? (
                        <div className="text-3xl font-bold text-gray-900">
                          Free
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl font-bold text-gray-900">
                            {formatPrice(plan.price)}
                            <span className="text-base font-normal text-gray-600">/month</span>
                          </div>
                          {plan.trialText && (
                            <p className="text-sm text-gray-600 mt-1">{plan.trialText}</p>
                          )}
                        </div>
                      )}
                    </div>
                  
                  
                  <DaisyCardBody >
  <ul className="space-y-3 mb-8">
</DaisyCardBody>
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <DaisyButton
                      className={`
                        w-full font-semibold py-3
                        ${plan.popular 
                          ? 'bg-[#199BEC] hover:bg-[#0f7dc7] text-white' 
                          : plan.key === 'ENTERPRISE'
                          ? 'bg-gray-900 hover:bg-gray-800 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }
                      `}
                      disabled={loading}
                      onClick={() => {
                        if (plan.key === 'FREE') {
                          router.push('/auth/register');
                        } else if (plan.key === 'PRO') {
                          handleStartTrial();
                        } else {
                          handleUpgrade(plan.key);
                        }
                      }}
                    >
                      {loading ? 'Loading...' : plan.buttonText}
                      {plan.key !== 'ENTERPRISE' && !loading && (
                        <ArrowRight className="w-4 h-4 ml-2" />
                      )}
                    </DaisyButton>
                    
                    {plan.key === 'PRO' && (
                      <p className="text-center text-xs text-gray-500 mt-3">
                        No credit card required for trial
                      </p>
                    )}
                  </DaisyCardBody>
                </DaisyCard>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6">
            Need something different? We're happy to discuss custom plans.
          </p>
          <DaisyButton 
            variant="secondary"
            onClick={() => router.push('/contact')}
            className="px-8 py-3" />
            Contact Sales
          </DaisyButton>
        </motion.div>

        {/* Trust Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 border-t border-gray-200 pt-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
              <p className="text-gray-600">Uptime SLA</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">SOC 2</div>
              <p className="text-gray-600">Type II Certified</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <p className="text-gray-600">Enterprise Support</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 