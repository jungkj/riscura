import { useRouter } from 'next/navigation';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
            <DaisyAlertTriangle className="w-12 h-12 text-red-600" >
  </div>
</DaisyAlertTriangle>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-8">
              You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <DaisyButton
            onClick={() => router.push('/dashboard')}
            className="w-full notion-button-primary" />
            Go to Dashboard
          </DaisyButton>
          <DaisyButton
            onClick={() => router.push('/auth/login')}
            variant="outline"
            className="w-full notion-button-outline" />
            Sign In Again
          </DaisyButton>
        </div>
      </div>
    </div>
  );
} 