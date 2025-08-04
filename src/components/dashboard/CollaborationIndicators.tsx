'use client';

import React from 'react';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  DaisyTooltip,
  DaisyTooltipContent,
  DaisyTooltipTrigger,
} from '@/components/ui/DaisyTooltip';

interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
}

interface CollaborationIndicatorsProps {
  users: User[];
}

export const CollaborationIndicators = ({ users }: CollaborationIndicatorsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-[#A8A8A8] font-inter">Online:</span>
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <div key={user.id} className="relative">
            <div className="w-8 h-8 rounded-full bg-[#D8C3A5] border-2 border-[#FAFAFA] flex items-center justify-center">
              <span className="text-xs font-medium text-[#191919] font-inter">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FAFAFA] ${
                user.status === 'online' ? 'bg-green-500' : 'bg-orange-500'
              }`}
            />
          </div>
        ))}
      </div>
      {users.length > 3 && (
        <span className="text-xs text-[#A8A8A8] font-inter">+{users.length - 3} more</span>
      )}
    </div>
  );
};
