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
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm">
          <TabsTrigger 
            value="patterns" 
            className="relative rounded-xl font-semibold text-center transition-all duration-500 ease-out data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:via-white data-[state=active]:to-blue-50 dark:data-[state=active]:from-blue-950/50 dark:data-[state=active]:via-gray-700 dark:data-[state=active]:to-blue-950/50 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100/50 dark:data-[state=active]:shadow-blue-900/20 data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 py-3 px-3 mx-0.5"
          >
            Pattern Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="gallery" 
            className="relative rounded-xl font-semibold text-center transition-all duration-500 ease-out data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:via-white data-[state=active]:to-purple-50 dark:data-[state=active]:from-purple-950/50 dark:data-[state=active]:via-gray-700 dark:data-[state=active]:to-purple-950/50 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-100/50 dark:data-[state=active]:shadow-purple-900/20 data-[state=active]:text-purple-900 dark:data-[state=active]:text-purple-100 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 py-3 px-3 mx-0.5"
          >
            Analysis Gallery
          </TabsTrigger>
          <TabsTrigger 
            value="resources" 
            className="relative rounded-xl font-semibold text-center transition-all duration-500 ease-out data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:via-white data-[state=active]:to-green-50 dark:data-[state=active]:from-green-950/50 dark:data-[state=active]:via-gray-700 dark:data-[state=active]:to-green-950/50 data-[state=active]:shadow-lg data-[state=active]:shadow-green-100/50 dark:data-[state=active]:shadow-green-900/20 data-[state=active]:text-green-900 dark:data-[state=active]:text-green-100 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 py-3 px-3 mx-0.5"
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
