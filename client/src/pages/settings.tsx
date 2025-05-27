import { SettingsView } from "@/components/settings/SettingsView";
import { useAnalytics, usePageTimeTracking } from "@/hooks/use-analytics";
import { useEffect } from "react";

export default function SettingsPage() {
  const { trackPageView } = useAnalytics();
  usePageTimeTracking('settings');

  useEffect(() => {
    trackPageView('settings');
  }, [trackPageView]);
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your goals, preferences, and account settings to customize your ClarityLog experience and track your path to licensure.
        </p>
      </div>
      
      <SettingsView />
    </div>
  );
}
