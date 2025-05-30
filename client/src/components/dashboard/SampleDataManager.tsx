import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";

export const SampleDataManager = () => {
  const { user, userProfile } = useAuth();
  const { entries, addEntry } = useLogEntries();

  useEffect(() => {
    // Only add sample data for new users who haven't completed onboarding
    if (user && userProfile && !userProfile.hasCompletedOnboarding && entries?.length === 0) {
      addSampleEntry();
    }
  }, [user, userProfile, entries]);

  const addSampleEntry = async () => {
    try {
      const sampleEntry = {
        dateOfContact: new Date(),
        clientContactHours: 1,
        indirectHours: false,
        supervisionDate: new Date(),
        supervisionHours: 0,
        supervisionType: "none" as const,
        techAssistedSupervision: false,
        notes: "Welcome to ClarityLog! This is a sample session entry to help you get started. You can edit or delete this entry anytime. Use this space to document your client interactions, therapeutic techniques used, and reflections on the session."
      };

      await addEntry(sampleEntry);
    } catch (error) {
      console.error('Error adding sample entry:', error);
    }
  };

  return null; // This component doesn't render anything
};