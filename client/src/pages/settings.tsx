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
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-light mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent tracking-tight leading-tight">
          Customize your journey
        </h1>
        <p className="text-xl font-light text-gray-600 dark:text-gray-400 max-w-2xl">
          Personalize your ClarityLog experience and set meaningful goals for your professional growth.
        </p>
      </div>
      
      <SettingsView />
    </div>
  );
}
