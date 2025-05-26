import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { CrossSessionAnalysisView } from "@/components/insights/CrossSessionAnalysisView";

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Insights & Resources</h1>
        <p className="text-gray-600 text-lg leading-relaxed font-medium">
          AI-powered analysis, pattern discovery, and professional development insights.
        </p>
      </div>
      
      <div>
        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="bg-gray-50 border border-gray-200 grid w-full grid-cols-3 p-1 rounded-2xl">
            <TabsTrigger value="patterns" className="rounded-xl font-medium">Pattern Analysis</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-xl font-medium">Analysis Gallery</TabsTrigger>
            <TabsTrigger value="resources" className="rounded-xl font-medium">Resources</TabsTrigger>
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
    </div>
  );
}
