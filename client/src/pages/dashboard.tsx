import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAnalytics, usePageTimeTracking } from "@/hooks/use-analytics";
import { useEffect } from "react";

export default function DashboardPage() {
  const { trackPageView } = useAnalytics();
  usePageTimeTracking('dashboard');

  useEffect(() => {
    trackPageView('dashboard');
  }, [trackPageView]);

  return (
    <div className="max-w-7xl mx-auto">
      <Dashboard />
    </div>
  );
}
