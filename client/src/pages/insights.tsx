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
    <div className="w-full">
      {/* Remove the header - search bar will contain the title */}
      
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl h-14 items-center">
          <TabsTrigger 
            value="gallery" 
            className="relative rounded-xl font-medium flex items-center justify-center h-12 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Insights & Resources
          </TabsTrigger>
          <TabsTrigger 
            value="resources" 
            className="relative rounded-xl font-medium flex items-center justify-center h-12 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Knowledge Base
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gallery" className="mt-6">
          <GalleryView userId={user?.uid || ""} />
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6">
          <InsightsResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
