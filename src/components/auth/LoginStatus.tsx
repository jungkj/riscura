'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthStorage } from '@/lib/auth/storage';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield } from 'lucide-react';

interface LoginStatusProps {
  className?: string;
}

export const LoginStatus: React.FC<LoginStatusProps> = ({ className = '' }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated || !user) {
    return null;
  }

  const hasRememberMe = AuthStorage.hasRememberMe();
  const storageType = AuthStorage.getStorageType();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge 
        variant={hasRememberMe ? "default" : "secondary"}
        className="flex items-center space-x-1"
      >
        {hasRememberMe ? (
          <>
            <Shield className="w-3 h-3" />
            <span>Persistent Login</span>
          </>
        ) : (
          <>
            <Clock className="w-3 h-3" />
            <span>Session Login</span>
          </>
        )}
      </Badge>
      
      {process.env.NODE_ENV === 'development' && (
        <Badge variant="outline" className="text-xs">
          {storageType === 'localStorage' ? 'Local' : 'Session'}
        </Badge>
      )}
    </div>
  );
}; 