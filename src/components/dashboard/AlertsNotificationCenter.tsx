'use client';

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export function AlertsNotificationCenter() {
  const alerts = [
    { id: 1, type: 'critical', title: 'High-risk vulnerability detected', time: '5 mins ago' },
    { id: 2, type: 'warning', title: 'Control test overdue', time: '1 hour ago' },
    { id: 3, type: 'info', title: 'Compliance report ready', time: '2 hours ago' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <DaisyAlertTriangle className="w-4 h-4 text-red-600" >
  ;
</DaisyAlertTriangle>
      case 'warning': return <Bell className="w-4 h-4 text-orange-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]" >
  <DaisyCardHeader className="pb-3" />
</DaisyCard>
        <DaisyCardTitle className="text-lg font-semibold text-[#191919] font-inter" >
  Alerts & Notifications
</DaisyCardTitle>
        </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-3" >
  {alerts.map((alert, index) => (
</DaisyCardContent>
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 rounded-lg bg-[#F5F1E9] border border-[#D8C3A5] hover:shadow-sm transition-shadow"
          >
            <div className={`w-2 h-2 rounded-full mt-2 ${
              alert.type === 'critical' ? 'bg-red-500' :
              alert.type === 'warning' ? 'bg-orange-500' :
              'bg-blue-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191919] font-inter">{alert.title}</p>
              <p className="text-xs text-[#A8A8A8] font-inter">{alert.time}</p>
            </div>
          </motion.div>
        ))}
      </DaisyCardContent>
    </DaisyCard>
  );
} 