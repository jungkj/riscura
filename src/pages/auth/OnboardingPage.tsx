import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyButton } from '@/components/ui/DaisyButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

// Form schema
const onboardingSchema = z.object({
  organizationName: z.string().min(2, { message: 'Organization name is required' }),
  industry: z.string().min(1, { message: 'Please select an industry' }),
  size: z.string().min(1, { message: 'Please select company size' }),
  role: z.string().min(1, { message: 'Please select your role' }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { updateProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
      industry: '',
      size: '',
      role: 'risk_manager',
    },
  });

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    try {
      // In a real app, we would create the organization and update user profile
      await updateProfile({ role: values.role as 'admin' | 'risk_manager' | 'auditor' | 'user' });
      toast({
        title: 'Setup complete!',
        description: 'Your organization has been set up successfully.',
      });
      router.push('/dashboard');
    } catch {
      toast({
        title: 'Setup failed',
        description: 'There was an error setting up your organization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <DaisyCard className="w-full" >
  <DaisyCardBody className="space-y-1" />
</DaisyCard>
        <DaisyCardTitle className="text-2xl font-bold" >
  {step === 1 ? 'Welcome to Riscura' : 'Complete Your Profile'}
</DaisyCardTitle>
        </DaisyCardTitle>
        <DaisyCardDescription >
  {step === 1 
</DaisyCardDescription>
            ? 'Let\'s set up your organization'
            : 'Tell us about your role and requirements'}
        </p>
      
      <DaisyCardBody >
  <Form {...form}>
</DaisyCardBody>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 ? (
              <>
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <DaisyInput placeholder="Acme Corp" {...field} /></DaisyInput>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <DaisySelect 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} />
                        <FormControl>
                          <DaisySelectTrigger />
                            <DaisySelectValue placeholder="Select industry" /></DaisySelect>
                        </FormControl>
                        <DaisySelectContent />
                          <DaisySelectItem value="financial">Financial Services</DaisySelectContent>
                          <DaisySelectItem value="healthcare">Healthcare</DaisySelectItem>
                          <DaisySelectItem value="technology">Technology</DaisySelectItem>
                          <DaisySelectItem value="manufacturing">Manufacturing</DaisySelectItem>
                          <DaisySelectItem value="retail">Retail</DaisySelectItem>
                          <DaisySelectItem value="energy">Energy</DaisySelectItem>
                          <DaisySelectItem value="other">Other</DaisySelectItem>
                        </DaisySelectContent>
                      </DaisySelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <DaisySelect 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} />
                        <FormControl>
                          <DaisySelectTrigger />
                            <DaisySelectValue placeholder="Select company size" /></DaisySelect>
                        </FormControl>
                        <DaisySelectContent />
                          <DaisySelectItem value="1-50">1-50 employees</DaisySelectContent>
                          <DaisySelectItem value="51-200">51-200 employees</DaisySelectItem>
                          <DaisySelectItem value="201-500">201-500 employees</DaisySelectItem>
                          <DaisySelectItem value="501-1000">501-1000 employees</DaisySelectItem>
                          <DaisySelectItem value="1001+">1001+ employees</DaisySelectItem>
                        </DaisySelectContent>
                      </DaisySelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DaisyButton 
                  type="button" 
                  onClick={nextStep} 
                  className="w-full" >
  Continue
</DaisyButton>
                </DaisyButton>
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Your Role</FormLabel>
                      <FormDescription>
                        Select the role that best describes your position
                      </FormDescription>
                      <FormControl>
                        <DaisyRadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-1" />
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <DaisyRadioGroupItem value="risk_manager" /></DaisyRadioGroup>
                            <FormLabel className="font-normal">
                              Risk Manager
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <DaisyRadioGroupItem value="admin" /></DaisyRadioGroupItem>
                            <FormLabel className="font-normal">
                              Administrator
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <DaisyRadioGroupItem value="auditor" /></DaisyRadioGroupItem>
                            <FormLabel className="font-normal">
                              Auditor
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <DaisyRadioGroupItem value="user" /></DaisyRadioGroupItem>
                            <FormLabel className="font-normal">
                              Regular User
                            </FormLabel>
                          </FormItem>
                        </DaisyRadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-4">
                  <DaisyButton 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    className="flex-1" >
  Back
</DaisyButton>
                  </DaisyButton>
                  <DaisyButton 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoading} >
  {isLoading ? (
</DaisyButton>
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </DaisyButton>
                </div>
              </>
            )}
          </form>
        </Form>
      </DaisyCardBody>
      <DaisyCardFooter className="flex justify-center" >
  <p className="text-xs text-muted-foreground">
</DaisyCardFooter>
          Step {step} of 2
        </p>
      </CardFooter>
    </DaisyCard>
  );
}