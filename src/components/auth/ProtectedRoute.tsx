import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, hasAnyPermission } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: Array<'admin' | 'risk_manager' | 'auditor' | 'user'>;
  requireAll?: boolean; // If true, user must have ALL permissions, otherwise ANY
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallbackPath = '/auth/login'
}) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle authentication and authorization logic in useEffect
  useEffect(() => {
    // Wait for auth to initialize before making any decisions
    if (!isInitialized || isLoading) {
      console.log('[ProtectedRoute] Waiting for auth:', { isInitialized, isLoading });
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('[ProtectedRoute] Not authenticated, redirecting:', { 
        isAuthenticated, 
        hasUser: !!user,
        pathname 
      });
      const redirectUrl = `${fallbackPath}?from=${encodeURIComponent(pathname || '')}`;
      router.push(redirectUrl);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAll
        ? requiredPermissions.every(permission => hasPermission(user.permissions, permission))
        : hasAnyPermission(user.permissions, requiredPermissions);

      if (!hasRequiredPermissions) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, isInitialized, router, pathname, fallbackPath, requiredRoles, requiredPermissions, requireAll]);

  // Show loading spinner while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated or doesn't have permissions, don't render children
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return null;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(user.permissions, permission))
      : hasAnyPermission(user.permissions, requiredPermissions);

    if (!hasRequiredPermissions) {
      return null;
    }
  }

  return <>{children}</>;
};

// Higher-order component for easier usage
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
  
  WrappedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specific role-based route components
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

export const RiskManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'risk_manager']}>
    {children}
  </ProtectedRoute>
);

export const AuditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'auditor']}>
    {children}
  </ProtectedRoute>
);

// Permission-based route components
export const ReadRisksRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermissions={['read_risks']}>
    {children}
  </ProtectedRoute>
);

export const WriteRisksRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermissions={['write_risks']}>
    {children}
  </ProtectedRoute>
);

export const ReadControlsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermissions={['read_controls']}>
    {children}
  </ProtectedRoute>
);

export const WriteControlsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermissions={['write_controls']}>
    {children}
  </ProtectedRoute>
); 