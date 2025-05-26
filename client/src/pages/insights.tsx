import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";
import { GalleryView } from "@/components/insights/GalleryView";
import { CrossSessionAnalysisView } from "@/components/insights/CrossSessionAnalysisView";

export default function InsightsPage() {
  return (
    <div className="ive-spacing-lg">
      <div className="ive-fade-in space-y-3">
        <h1 className="text-3xl font-bold text-foreground">Insights & Resources</h1>
        <p className="text-muted-foreground/80 text-lg leading-relaxed">
          AI-powered analysis, pattern discovery, and professional development insights.
        </p>
      </div>
      
      <div className="ive-fade-in">
        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="ive-card grid w-full grid-cols-3 p-1 bg-muted/20">
            <TabsTrigger value="patterns" className="ive-button">Pattern Analysis</TabsTrigger>
            <TabsTrigger value="gallery" className="ive-button">Analysis Gallery</TabsTrigger>
            <TabsTrigger value="resources" className="ive-button">Resources</TabsTrigger>
          </TabsList>
        
          <TabsContent value="patterns" className="ive-spacing">
            <CrossSessionAnalysisView />
          </TabsContent>
          
          <TabsContent value="gallery" className="ive-spacing">
            <GalleryView />
          </TabsContent>
          
          <TabsContent value="resources" className="ive-spacing">
            <InsightsResourcesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
