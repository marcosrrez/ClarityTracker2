import { GalleryView } from "@/components/insights/GalleryView";

export default function GalleryPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Session Insights Gallery</h1>
        <p className="text-muted-foreground max-w-3xl">
          View AI-powered insights from your session notes to identify patterns, themes, and growth opportunities in your professional practice.
        </p>
      </div>
      
      <GalleryView />
    </div>
  );
}
