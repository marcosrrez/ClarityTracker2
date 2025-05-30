import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
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
      
      console.log("AuthGuard check:", { 
        loading, 
        userProfile, 
        needsAccountSetup, 
        isOnAccountSetupPage, 
        location 
      });
      
      if (needsAccountSetup && !isOnAccountSetupPage) {
        console.log("Redirecting to account setup");
        setLocation('/account-setup');
      } else if (!needsAccountSetup && isOnAccountSetupPage) {
        console.log("Redirecting to dashboard");
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
