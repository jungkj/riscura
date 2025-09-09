"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  CheckCircle,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DashboardPlaceholder() {
  const riskData = [
    { name: 'Critical', count: 23, color: 'bg-red-500', textColor: 'text-red-600' },
    { name: 'High', count: 45, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { name: 'Medium', count: 78, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { name: 'Low', count: 124, color: 'bg-green-500', textColor: 'text-green-600' }
  ];

  const recentActivities = [
    { action: 'New critical risk identified in IT infrastructure', time: '2 min ago', type: 'alert' },
    { action: 'Quarterly compliance report generated', time: '1 hour ago', type: 'success' },
    { action: '15 risks migrated and controls updated', time: '3 hours ago', type: 'info' }
  ];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Dashboard</h1>
          <p className="text-gray-600">Real-time risk intelligence for your organization</p>
        </div>
        <Badge className="bg-[#199BEC] text-white">Live</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {riskData.map((risk, index) => (
          <motion.div
            key={risk.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{risk.name}</p>
                <p className={`text-2xl font-bold ${risk.textColor}`}>{risk.count}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${risk.color}`}></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Risk Chart */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Risk Distribution</h3>
              <BarChart3 className="w-5 h-5 text-[#199BEC]" />
            </div>
            <div className="space-y-3">
              {riskData.map((risk, index) => (
                <div key={risk.name} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">{risk.name}</div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${risk.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(risk.count / 270) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{risk.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Clock className="w-5 h-5 text-[#199BEC]" />
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'alert' ? 'bg-red-500' :
                    activity.type === 'success' ? 'bg-green-500' : 'bg-[#199BEC]'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#199BEC]/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-[#199BEC]" />
          </div>
          <p className="text-lg font-bold text-[#199BEC]">87%</p>
          <p className="text-sm text-gray-600">Risk Coverage</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-600">95%</p>
          <p className="text-sm text-gray-600">Compliance</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-lg font-bold text-red-600">23</p>
          <p className="text-sm text-gray-600">Urgent Items</p>
        </div>
      </div>
    </div>
  );
}