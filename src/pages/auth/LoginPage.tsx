import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';

// UI Components
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';

// Enhanced components
import { GlowingStarsBackground } from '@/components/ui/aceternity/glowing-stars-background';
import { HoverCard } from '@/components/ui/aceternity/hover-effect';
import { FormErrorBoundary } from '@/components/ui/error-boundary';

// Form schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password, values.rememberMe);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      router.push('/dashboard');
    } catch {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Risk Manager', email: 'demo@rcsa.com', password: 'demo123' },
    { role: 'Admin', email: 'admin@rcsa.com', password: 'admin123' },
    { role: 'Auditor', email: 'auditor@rcsa.com', password: 'audit123' },
  ];

  const fillDemoCredentials = (email: string, password: string) => {
    form.setValue('email', email);
    form.setValue('password', password);
  };

  return (
    <FormErrorBoundary>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <GlowingStarsBackground className="absolute inset-0" starCount={150} />
        
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <HoverCard className="backdrop-blur-sm bg-card/90 dark:bg-card/90 border-border/20">
            <DaisyCardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex justify-center"
              >
                <Image
                  src="/images/logo/riscura.png"
                  alt="Riscura Logo"
                  width={140}
                  height={46}
                  className="object-contain"
                  priority
                />
              </motion.div>
              <DaisyCardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Welcome Back
              </DaisyCardTitle>
              <DaisyCardDescription>
                Enter your credentials to access your RCSA dashboard
              </p>
            
            
            <DaisyCardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <DaisyInput 
                              placeholder="name@company.com" 
                              {...field} 
                              autoComplete="email"
                              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="relative"
                          >
                            <DaisyInput 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••" 
                              {...field} 
                              autoComplete="current-password"
                              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 pr-10"
                            />
                            <DaisyButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </DaisyButton>
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <DaisyCheckbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            Stay logged in
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <DaisyButton 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#191919] to-[#191919] hover:from-[#2a2a2a] hover:to-[#2a2a2a] transition-all duration-200" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </DaisyButton>
                  </motion.div>
                </form>
              </Form>

              <div className="mt-4 text-center text-sm">
                <Link 
                  href="/forgot-password" 
                  className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </DaisyCardContent>
            
            <DaisyCardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
            
            {/* Enhanced Demo credentials */}
            <motion.div 
              className="px-6 pb-4 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Quick Demo Access:
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {demoCredentials.map((cred, index) => (
                  <motion.button
                    key={cred.role}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fillDemoCredentials(cred.email, cred.password)}
                    className="flex justify-between items-center p-2 rounded-md bg-secondary/10 dark:bg-secondary/10 hover:bg-secondary/20 dark:hover:bg-secondary/20 transition-colors text-xs group"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {cred.role}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                      Click to fill
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </HoverCard>
        </motion.div>
      </div>
    </FormErrorBoundary>
  );
}