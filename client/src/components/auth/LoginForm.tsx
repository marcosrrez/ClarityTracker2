import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

export const LoginForm = ({ onSwitchToSignUp }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn(data.email, data.password);
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      await resetPassword(email);
      setError(null);
      alert("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      setError(error.message || "Failed to send reset email");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-xl">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            disabled={isLoading}
            className="rounded-xl border-gray-200 focus:border-blue-500"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
            disabled={isLoading}
            className="rounded-xl border-gray-200 focus:border-blue-500"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-base font-medium" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <Button
          type="button"
          variant="link"
          onClick={handleForgotPassword}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Forgot your password?
        </Button>
        
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignUp}
            className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </Button>
        </p>
      </div>
    </div>
  );
};
