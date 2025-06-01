import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { useAnalytics, usePageTimeTracking } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function InsightsPage() {
  const { trackPageView } = useAnalytics();
  const { user } = useAuth();
  usePageTimeTracking('insights');

  useEffect(() => {
    trackPageView('insights');
  }, [trackPageView]);
  return (
    <div className="w-full h-screen">
      <GalleryView userId={user?.uid || ""} />
    </div>
  );
}
