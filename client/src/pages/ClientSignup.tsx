import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Heart, User, Shield, Brain, Target, CheckCircle } from 'lucide-react';

const clientSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  privacyAgreement: z.boolean().refine(val => val === true, "You must agree to the privacy policy"),
  communicationConsent: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ClientSignupForm = z.infer<typeof clientSignupSchema>;

export default function ClientSignup() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientSignupForm>({
    resolver: zodResolver(clientSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      privacyAgreement: false,
      communicationConsent: true,
    },
  });

  const onSubmit = async (data: ClientSignupForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('/api/auth/client-signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          communicationConsent: data.communicationConsent,
        }),
      });

      toast({
        title: "Account Created Successfully",
        description: "Welcome to ClarityLog! Let's personalize your experience.",
      });

      // Redirect to client onboarding flow
      setLocation('/client-onboarding-flow');
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: "Please check your information and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Heart className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClarityLog
              </h1>
            </div>
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Start Your Growth Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands who are building self-awareness and achieving personal growth through reflection and insights.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Brain className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      AI-Powered Insights
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Get personalized insights from your reflections to understand patterns and accelerate growth.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Goal Tracking
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Set meaningful goals and track your progress with visual milestones and achievements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Professional Support
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Invite a therapist anytime to collaborate on your journey with shared insights and guidance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Privacy First
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your data is encrypted and secure. You control what you share and with whom.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">Free to Start</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Begin with unlimited personal reflections and basic insights. Upgrade anytime for advanced features and professional collaboration.
                </p>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription>
                  Start your personal growth journey in less than 2 minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                            <Input
                              type="password"
                              placeholder="Create a secure password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3 pt-2">
                      <FormField
                        control={form.control}
                        name="privacyAgreement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                I agree to the{' '}
                                <a href="/privacy" className="text-blue-600 hover:underline">
                                  Privacy Policy
                                </a>{' '}
                                and{' '}
                                <a href="/terms" className="text-blue-600 hover:underline">
                                  Terms of Service
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="communicationConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                Send me helpful tips and updates about my growth journey
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Start My Journey'}
                    </Button>

                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setLocation('/client-login')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}