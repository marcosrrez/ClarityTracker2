import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Heart, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const clientLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type ClientLoginForm = z.infer<typeof clientLoginSchema>;

export default function ClientLogin() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientLoginForm>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: ClientLoginForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('/api/auth/client-login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account.",
      });

      // Redirect to client dashboard
      setLocation('/client-dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Sign In Failed",
        description: "Please check your email and password.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Heart className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClarityLog
              </h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Continue your growth journey
            </p>
          </div>

          {/* Login Form */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                          />
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
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLocation('/forgot-password')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setLocation('/client-signup')}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <button
              onClick={() => setLocation('/')}
              className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}