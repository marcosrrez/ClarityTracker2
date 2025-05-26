import { GalleryView } from "@/components/insights/GalleryView";

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Session Insights Gallery</h1>
        <p className="text-muted-foreground">
          View AI-powered insights from your session notes to identify patterns, themes, and growth opportunities.
        </p>
      </div>
      
      <GalleryView />
    </div>
  );
}
