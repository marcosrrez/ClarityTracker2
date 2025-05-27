import { useState, useEffect } from "react";
import { OnboardingModal } from "./OnboardingModal";

export const OnboardingTrigger = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('claritylog-onboarding-completed');
    
    if (!hasSeenOnboarding) {
      // Show onboarding after a brief delay for better UX
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('claritylog-onboarding-completed', 'true');
  };

  return (
    <OnboardingModal
      open={showOnboarding}
      onClose={handleCloseOnboarding}
    />
  );
};