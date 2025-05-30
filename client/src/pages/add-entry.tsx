import { AddEntryForm } from "@/components/entries/AddEntryForm";
import { SupervisionSessionForm } from "@/components/supervision/SupervisionSessionForm";
import { useAnalytics, usePageTimeTracking } from "@/hooks/use-analytics";
import { useAccountType } from "@/hooks/use-account-type";
import { useEffect } from "react";

export default function AddEntryPage() {
  const { trackPageView } = useAnalytics();
  const { isSupervisor } = useAccountType();
  usePageTimeTracking('add-entry');

  useEffect(() => {
    trackPageView('add-entry');
  }, [trackPageView]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {isSupervisor ? <SupervisionSessionForm /> : <AddEntryForm />}
    </div>
  );
}
