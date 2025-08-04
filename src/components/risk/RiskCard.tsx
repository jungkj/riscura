'use client';

import { useState } from 'react';
// import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  MoreHorizontal,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RiskData {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Mitigated' | 'Accepted' | 'Closed' | 'Active';
  likelihood: number;
  impact: number;
  riskScore: number;
  owner: string;
  assignee: string;
  dueDate: string;
  lastUpdated: string;
  progress: number;
  tags: string[];
  trend: 'up' | 'down' | 'stable';
  mitigationActions: string[] | number;
  completedActions: number;
  // Optional additional properties
  controls?: string[];
  treatmentPlan?: string;
  linkedVendors?: string[];
  createdDate?: string;
  attachments?: number;
  comments?: number;
}

interface RiskCardProps {
  risk: RiskData;
  onView?: (_risk: RiskData) => void;
  onEdit?: (_risk: RiskData) => void;
  onArchive?: (_risk: RiskData) => void;
  className?: string;
}

export default function RiskCard({ risk, onView, onEdit, onArchive, className = '' }: RiskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-50 text-red-700 border-red-200';
      case 'Active': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Mitigated': return 'bg-green-50 text-green-700 border-green-200';
      case 'Accepted': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Closed': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 16) return 'text-red-600 bg-red-50';
    if (score >= 12) return 'text-orange-600 bg-orange-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getTrendIcon = (_trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getDueDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 3) return 'text-orange-600';
    if (diffDays <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <DaisyCard 
      className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView?.(risk)}
    >
      <DaisyCardBody className="p-6" >
  <div className="flex items-start justify-between">
</DaisyCard>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {risk.id}
              </span>
              <DaisyBadge className={`text-xs border ${getSeverityColor(risk.severity)}`}>
                {risk.severity}
              </DaisyBadge>
              <DaisyBadge className={`text-xs border ${getStatusColor(risk.status)}`}>
                {risk.status}
              </DaisyBadge>
              {getTrendIcon(risk.trend)}
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {risk.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {risk.description}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {risk.category}
                </span>
                {risk.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="text-xs text-[#199BEC] bg-[#199BEC]/10 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
                {risk.tags.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{risk.tags.length - 2} more
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Risk Score</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${getRiskScoreColor(risk.riskScore)}`}>
                    {risk.riskScore}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Likelihood</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full ${
                          level <= risk.likelihood ? 'bg-[#199BEC]' : 'bg-gray-200'
                        }`} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Impact</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full ${
                          level <= risk.impact ? 'bg-[#199BEC]' : 'bg-gray-200'
                        }`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-sm font-medium">{risk.progress}%</span>
                </div>
                <DaisyProgress value={risk.progress} className="h-2" />
<div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Actions</span>
                  <span>{risk.completedActions}/{Array.isArray(risk.mitigationActions) ? risk.mitigationActions.length : risk.mitigationActions}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">{risk.assignee}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DaisyCalendar className="w-4 h-4" />
<span className={`text-xs ${getDueDateColor(risk.dueDate)}`}>
                    {formatDate(risk.dueDate)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Updated {risk.lastUpdated}
              </div>
            </div>
          </div>

          <div className={`ml-4 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <DaisyDropdownMenu >
                <DaisyDropdownMenuTrigger asChild >
                  <DaisyButton 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()} />
                  <MoreHorizontal className="w-4 h-4" />
                </DaisyProgress>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent align="end" className="w-48" >
                  <DaisyDropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(risk); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(risk); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Risk
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(risk); }}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DaisyDropdownMenuItem>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}
