import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { CrossSessionAnalysisView } from "@/components/insights/CrossSessionAnalysisView";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Insights & Resources</h1>
        <p className="text-muted-foreground">
          AI-powered analysis, pattern discovery, and professional development insights.
        </p>
      </div>
      
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="gallery">Analysis Gallery</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patterns" className="space-y-6">
          <CrossSessionAnalysisView />
        </TabsContent>
        
        <TabsContent value="gallery" className="space-y-6">
          <GalleryView />
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-6">
          <InsightsResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
