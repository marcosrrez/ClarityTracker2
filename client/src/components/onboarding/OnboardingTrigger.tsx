import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";
import { OnboardingFlow } from "./OnboardingFlow";

export const OnboardingTrigger = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding for authenticated users who haven't completed it
    if (user && userProfile && !loading) {
      const hasCompletedOnboarding = userProfile.hasCompletedOnboarding;
      
      // Show onboarding for users who haven't completed it (regardless of log entries)
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user, userProfile, loading]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <OnboardingFlow 
      isOpen={showOnboarding} 
      onClose={handleCloseOnboarding} 
    />
  );
};