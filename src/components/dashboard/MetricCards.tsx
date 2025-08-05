'use client';

import { useState, useEffect } from 'react';
import { DaisyCardBody } from '@/components/ui/daisy-components';
// import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
// import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  Clock
} from 'lucide-react';

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  change: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  }
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export default function MetricCards() {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);

  const metrics: MetricData[] = [
    {
      id: 'total-risks',
      title: 'Total Risks',
      value: 23,
      change: {
        value: '12% decrease',
        type: 'decrease',
        period: 'vs last month'
      },
      icon: Shield,
      color: 'text-[#199BEC]',
      bgColor: 'bg-[#199BEC]/10'
    },
    {
      id: 'critical-risks',
      title: 'Critical Risks',
      value: 4,
      change: {
        value: '2 resolved',
        type: 'decrease',
        period: 'this week'
      },
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: 'compliance-score',
      title: 'Compliance Score',
      value: '94%',
      change: {
        value: '3% increase',
        type: 'increase',
        period: 'vs last quarter'
      },
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'risk-assessments',
      title: 'Risk Assessments',
      value: 156,
      change: {
        value: '8 completed',
        type: 'increase',
        period: 'this month'
      },
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'active-users',
      title: 'Active Users',
      value: 42,
      change: {
        value: '5 new users',
        type: 'increase',
        period: 'this week'
      },
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'avg-resolution',
      title: 'Avg Resolution Time',
      value: '2.3 days',
      change: {
        value: '0.5 days faster',
        type: 'decrease',
        period: 'vs last month'
      },
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Animate numeric values
    metrics.forEach((metric, index) => {
      if (typeof metric.value === 'number') {
        let current = 0
        const target = metric.value;
        const increment = target / 30;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedValues(prev => ({
            ...prev,
            [metric.id]: Math.floor(current)
          }));
        }, 50 + index * 20);
      }
    });
  }, []);

  const getTrendIcon = (_type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="w-4 h-4" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return null;
    }
  }

  const getTrendColor = (_type: 'increase' | 'decrease' | 'neutral', metricId: string) => {
    if (type === 'neutral') return 'text-gray-600';
    
    // For metrics where decrease is good (like risks, resolution time)
    const isDecreaseGood = ['total-risks', 'critical-risks', 'avg-resolution'].includes(metricId)
    const isGoodChange = (type === 'decrease' && isDecreaseGood) || (type === 'increase' && !isDecreaseGood);
    return isGoodChange ? 'text-green-600' : 'text-red-600';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        const animatedValue = animatedValues[metric.id];
        const displayValue = typeof metric.value === 'number' && animatedValue !== undefined 
          ? animatedValue 
          : metric.value;

        const trendColorClass = getTrendColor(metric.change.type, metric.id);

        return (
          <DaisyCard 
            key={metric.id}
            className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <DaisyCardBody className="p-6" >
  <div className="flex items-center justify-between">
</DaisyCard>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {metric.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-3">
                    {displayValue}
                  </p>
                  <div className={`flex items-center text-sm ${trendColorClass}`}>
                    {getTrendIcon(metric.change.type)}
                    <span className="ml-1 font-medium">
                      {metric.change.value}
                    </span>
                    <span className="ml-1 text-gray-500">
                      {metric.change.period}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        );
      })}
    </div>
  );
} 