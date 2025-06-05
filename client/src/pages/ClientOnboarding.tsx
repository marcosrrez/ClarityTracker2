import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Heart, Shield, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const clientRegistrationSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
  privacyAgreement: z.boolean().refine(val => val === true, {
    message: "You must agree to the privacy policy"
  }),
  communicationConsent: z.boolean().default(true)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ClientRegistrationForm = z.infer<typeof clientRegistrationSchema>;

export default function ClientOnboarding() {
  const [location, setLocation] = useLocation();
  const [isMatch, params] = useRoute('/client-onboarding/:inviteToken');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const inviteToken = params?.inviteToken;

  // Validate invitation token
  const { data: invitation, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: ['/api/client-invitation', inviteToken],
    enabled: !!inviteToken,
    retry: false
  });

  const form = useForm<ClientRegistrationForm>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      privacyAgreement: false,
      communicationConsent: true
    }
  });

  const onSubmit = async (data: ClientRegistrationForm) => {
    if (!inviteToken) {
      toast({
        title: "Invalid Access",
        description: "You need a valid invitation to register.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Accept the invitation and create client account
      const response = await apiRequest(`/api/client-invitation/${inviteToken}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          password: data.password,
          confirmPassword: data.confirmPassword
        })
      });

      toast({
        title: "Account Created Successfully",
        description: "Welcome to ClarityLog! You can now access your client portal.",
      });

      // Redirect to client portal
      setLocation('/client-portal');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Please check your password and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while validating invitation
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 animate-spin" />
              <span>Validating invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if invitation is invalid
  if (validationError || !invitation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ClarityLog</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Welcome {invitation.clientName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your registration to access your therapy portal
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Secure & Private</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your data is encrypted and protected
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Shared Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Collaborate with your therapist
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Track Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your therapy journey
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Set up your secure password to access your client portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
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
                </div>

                <div className="space-y-4">
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
                            I agree to the Privacy Policy and Terms of Service
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
                            I consent to receive therapy-related communications
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            By creating an account, you're joining a secure platform designed to enhance your therapy experience.
          </p>
        </div>
      </div>
    </div>
  );
}