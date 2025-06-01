import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { CrossSessionAnalysisView } from "@/components/insights/CrossSessionAnalysisView";
import { useAnalytics, usePageTimeTracking } from "@/hooks/use-analytics";
import { useEffect } from "react";

export default function InsightsPage() {
  const { trackPageView } = useAnalytics();
  usePageTimeTracking('insights');

  useEffect(() => {
    trackPageView('insights');
  }, [trackPageView]);
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3">
          Insights & Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl text-lg font-medium leading-relaxed">
          AI-powered analysis, pattern discovery, and professional development insights to accelerate your growth toward licensure.
        </p>
      </div>
      
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <TabsTrigger 
            value="patterns" 
            className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-3"
          >
            Pattern Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="gallery" 
            className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-3"
          >
            Analysis Gallery
          </TabsTrigger>
          <TabsTrigger 
            value="resources" 
            className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-3"
          >
            Resources
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="patterns" className="mt-6">
          <CrossSessionAnalysisView />
        </TabsContent>
        
        <TabsContent value="gallery" className="mt-6">
          <GalleryView />
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6">
          <InsightsResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
