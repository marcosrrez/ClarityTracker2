import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

interface OnboardingData {
  accountType: 'individual' | 'supervisor' | 'enterprise';
  licensureGoalDate?: Date;
  trackingChallenge?: string;
  displayName?: string;
}

export default function AccountSetupPage() {
  const { updateUserProfile } = useAuth();
  const [, setLocation] = useLocation();

  const handleCompleteOnboarding = async (data: OnboardingData) => {
    try {
      await updateUserProfile({ 
        accountType: data.accountType,
        subscriptionTier: 'free',
        licensureGoalDate: data.licensureGoalDate,
        trackingChallenge: data.trackingChallenge,
        displayName: data.displayName
      });
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return <OnboardingFlow onComplete={handleCompleteOnboarding} />;
}