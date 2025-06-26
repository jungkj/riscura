'use client';

import React from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with basic risk management',
    features: [
      'Up to 10 risks',
      'Basic reporting',
      'Community support',
      '3 team members'
    ],
    limits: 'Limited features',
    popular: false,
    icon: Shield
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'Advanced features for growing organizations',
    features: [
      'Unlimited risks',
      'Advanced reporting & analytics',
      'AI-powered insights',
      'Priority support',
      'Up to 25 team members',
      'Integrations',
      'Custom workflows'
    ],
    limits: 'Everything you need',
    popular: true,
    icon: Zap
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    description: 'Full-featured solution for large enterprises',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'SSO & advanced security',
      'API access',
      'Custom reporting',
      'Dedicated support',
      'On-premise deployment'
    ],
    limits: 'Ultimate solution',
    popular: false,
    icon: Crown
  }
];

export default function UpgradePage() {
  const { data: session } = useSession();
  const { subscription, loading } = useSubscription();

  const handleUpgrade = async (planName: string) => {
    if (!session) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: planName === 'pro' ? 'price_pro_monthly' : 'price_enterprise_monthly',
          mode: 'subscription'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading subscription information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Upgrade your risk management capabilities with advanced features
        </p>
        {subscription && (
          <div className="mt-4">
            <Badge variant="outline">
              Current Plan: {subscription.plan}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = subscription?.plan === plan.name.toLowerCase();
          const isUpgrade = subscription && subscription.plan === 'free' && plan.name !== 'Free';

          return (
            <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    /{plan.period}
                  </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                                 ) : plan.name === 'Free' ? (
                   <Button 
                     variant="secondary" 
                     className="w-full"
                     disabled
                   >
                     Free Forever
                   </Button>
                 ) : (
                   <Button 
                     className="w-full" 
                     onClick={() => handleUpgrade(plan.name.toLowerCase())}
                     variant={plan.popular ? 'default' : 'secondary'}
                   >
                     {isUpgrade ? 'Upgrade' : 'Choose'} {plan.name}
                   </Button>
                 )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Need a custom solution? <a href="/contact" className="text-primary hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
} 