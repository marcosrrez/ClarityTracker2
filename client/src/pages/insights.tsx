import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { CrossSessionAnalysisView } from "@/components/insights/CrossSessionAnalysisView";

export default function InsightsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Insights & Resources
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          AI-powered analysis, pattern discovery, and professional development insights to accelerate your growth toward licensure.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800">
        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-indigo-200 dark:border-indigo-700 grid w-full grid-cols-3 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="patterns" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              Pattern Analysis
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              Analysis Gallery
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              Resources
            </TabsTrigger>
          </TabsList>
        
          <TabsContent value="patterns" className="mt-8">
            <CrossSessionAnalysisView />
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-8">
            <GalleryView />
          </TabsContent>
          
          <TabsContent value="resources" className="mt-8">
            <InsightsResourcesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
