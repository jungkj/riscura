'use client';

import { useState } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In demo mode, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <DaisyCard className="w-full max-w-md" >
  <DaisyCardHeader className="text-center" />
</DaisyCard>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <DaisyCardTitle>Check your email</DaisyCardTitle>
        <DaisyCardContent className="text-center space-y-4" >
  <p className="text-muted-foreground">
</DaisyCardContent>
              We've sent a password reset link to <strong>{email}</strong>
            </DaisyCardDescription>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </DaisyCardDescription>
            <div className="space-y-2">
              <DaisyButton 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
              >
                Try different email
              </DaisyButton>
              <Link href="/auth/login">
                <DaisyButton variant="ghost" className="w-full" >
  <ArrowLeft className="h-4 w-4 mr-2" />
</DaisyButton>
                  Back to login
                </DaisyButton>
              </Link>
            </div>
          </DaisyCardContent>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <DaisyCard className="w-full max-w-md" >
  <DaisyCardHeader />
</DaisyCard>
          <DaisyCardTitle>Reset your password</DaisyCardTitle>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </DaisyCardDescription>
        
        <DaisyCardContent >
  <form onSubmit={handleSubmit} className="space-y-4">
</DaisyCardContent>
            <div className="space-y-2">
              <DaisyLabel htmlFor="email">Email address</DaisyLabel>
              <DaisyInput
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <DaisyButton 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email} >
  {isLoading ? 'Sending...' : 'Send reset link'}
</DaisyButton>
            
            <Link href="/auth/login">
              <DaisyButton variant="ghost" className="w-full" >
  <ArrowLeft className="h-4 w-4 mr-2" />
</DaisyButton>
                Back to login
              </DaisyButton>
            </Link>
          </form>
        </DaisyCardContent>
    </div>
  );
} 