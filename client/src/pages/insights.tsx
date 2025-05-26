import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { CrossSessionAnalysisView } from "@/components/insights/CrossSessionAnalysisView";

export default function InsightsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Insights & Resources</h1>
        <p className="text-muted-foreground max-w-3xl">
          AI-powered analysis, pattern discovery, and professional development insights to accelerate your growth toward licensure.
        </p>
      </div>
      
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="gallery">Analysis Gallery</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
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
