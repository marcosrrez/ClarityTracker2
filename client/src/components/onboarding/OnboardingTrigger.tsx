import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";
import { OnboardingFlow } from "./OnboardingFlow";

export const OnboardingTrigger = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding if user is authenticated and hasn't completed it
    if (user && userProfile && !loading) {
      const hasCompletedOnboarding = userProfile.hasCompletedOnboarding;
      const isNewUser = logEntries.length === 0;
      
      // Show onboarding for new users who haven't completed it
      if (!hasCompletedOnboarding && isNewUser) {
        setShowOnboarding(true);
      }
    }
  }, [user, userProfile, logEntries.length, loading]);

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