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
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user && requireAccountSetup) {
      // Check if user needs to complete account setup
      const needsAccountSetup = !userProfile?.accountType;
      const isOnAccountSetupPage = location === '/account-setup';
      
      if (needsAccountSetup && !isOnAccountSetupPage) {
        setLocation('/account-setup');
      } else if (!needsAccountSetup && isOnAccountSetupPage) {
        setLocation('/dashboard');
      }
    }
  }, [user, userProfile, loading, location, setLocation, requireAccountSetup]);

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

  return <>{children}</>;
};
