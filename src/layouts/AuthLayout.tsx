import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { RiskIcon } from '@/components/icons/RiskIcon';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-muted flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <RiskIcon className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">Riscura</h1>
          </div>
        </div>
        
        <Outlet />
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} Riscura Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}