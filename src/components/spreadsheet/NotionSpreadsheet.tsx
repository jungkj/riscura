'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Type, 
  Hash, 
  Calendar, 
  Star,
  Trash2,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import Image from 'next/image';

// Sample data
const SAMPLE_DATA = [
  {
    id: 'R001',
    title: 'Data Breach Risk',
    category: 'Operational',
    likelihood: 4,
    impact: 5,
    owner: 'Sarah Chen',
    dueDate: '2024-02-15',
    status: 'In Progress'
  },
  {
    id: 'R002', 
    title: 'Vendor Risk',
    category: 'Strategic',
    likelihood: 3,
    impact: 3,
    owner: 'Mike Rodriguez',
    dueDate: '2024-03-01',
    status: 'Open'
  },
  {
    id: 'R003',
    title: 'Compliance Violation',
    category: 'Compliance', 
    likelihood: 2,
    impact: 4,
    owner: 'Jennifer Liu',
    dueDate: '2024-01-30',
    status: 'Mitigated'
  }
];

export default function NotionSpreadsheet() {
  const [data, setData] = useState(SAMPLE_DATA);
  const [searchTerm, setSearchTerm] = useState('');

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Open': 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Mitigated': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Operational': 'bg-blue-100 text-blue-800',
      'Financial': 'bg-green-100 text-green-800',
      'Strategic': 'bg-purple-100 text-purple-800',
      'Compliance': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Risk Register</h1>
          <Badge className="bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Enhanced
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-8 text-sm"
            />
          </div>
          
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[#199BEC] border-[#199BEC]/30 hover:bg-[#199BEC]/10"
          >
            <Image 
              src="/images/logo/riscura.png" 
              alt="Riscura" 
              width={14} 
              height={14} 
              className="mr-1"
            />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-fit">
          {/* Headers */}
          <div className="flex sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <div className="w-12 h-10 flex items-center justify-center border-r border-gray-200">
              <span className="text-xs text-gray-500">#</span>
            </div>
            <div className="w-24 h-10 flex items-center px-3 border-r border-gray-200">
              <Type className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">ID</span>
            </div>
            <div className="w-64 h-10 flex items-center px-3 border-r border-gray-200">
              <Type className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Risk Title</span>
            </div>
            <div className="w-32 h-10 flex items-center px-3 border-r border-gray-200">
              <Type className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Category</span>
            </div>
            <div className="w-32 h-10 flex items-center px-3 border-r border-gray-200">
              <Star className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Likelihood</span>
            </div>
            <div className="w-32 h-10 flex items-center px-3 border-r border-gray-200">
              <Star className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Impact</span>
            </div>
            <div className="w-40 h-10 flex items-center px-3 border-r border-gray-200">
              <Type className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Owner</span>
            </div>
            <div className="w-32 h-10 flex items-center px-3 border-r border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Due Date</span>
            </div>
            <div className="w-32 h-10 flex items-center px-3 border-r border-gray-200">
              <Type className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Status</span>
            </div>
            <div className="w-12 h-10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Data Rows */}
          {data.map((row, index) => (
            <div key={row.id} className="flex group hover:bg-gray-50/50 border-b border-gray-200">
              <div className="w-12 h-12 flex items-center justify-center border-r border-gray-200 bg-gray-50/50">
                <span className="text-xs text-gray-500">{index + 1}</span>
              </div>
              <div className="w-24 h-12 flex items-center px-3 border-r border-gray-200">
                <span className="text-sm font-mono text-gray-900">{row.id}</span>
              </div>
              <div className="w-64 h-12 flex items-center px-3 border-r border-gray-200">
                <span className="text-sm text-gray-900">{row.title}</span>
              </div>
              <div className="w-32 h-12 flex items-center px-3 border-r border-gray-200">
                <Badge className={`text-xs ${getCategoryColor(row.category)}`}>
                  {row.category}
                </Badge>
              </div>
              <div className="w-32 h-12 flex items-center px-3 border-r border-gray-200">
                {renderStars(row.likelihood)}
              </div>
              <div className="w-32 h-12 flex items-center px-3 border-r border-gray-200">
                {renderStars(row.impact)}
              </div>
              <div className="w-40 h-12 flex items-center px-3 border-r border-gray-200">
                <span className="text-sm text-gray-900">{row.owner}</span>
              </div>
              <div className="w-32 h-12 flex items-center px-3 border-r border-gray-200">
                <span className="text-sm text-gray-900">{row.dueDate}</span>
              </div>
              <div className="w-32 h-12 flex items-center px-3 border-r border-gray-200">
                <Badge className={`text-xs ${getStatusColor(row.status)}`}>
                  {row.status}
                </Badge>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Row */}
          <div className="flex border-b border-gray-200">
            <div className="w-12 h-10 flex items-center justify-center border-r border-gray-200 bg-gray-50/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
            <div className="flex-1 h-10 bg-gray-50/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 