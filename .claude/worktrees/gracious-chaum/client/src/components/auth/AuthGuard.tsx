import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAccountSetup?: boolean;
}

export const AuthGuard = ({ children, fallback, requireAccountSetup = true }: AuthGuardProps) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return fallback || null;
  }

  // Show onboarding flow if user hasn't completed setup
  if (requireAccountSetup && user && !userProfile?.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return <>{children}</>;
};
