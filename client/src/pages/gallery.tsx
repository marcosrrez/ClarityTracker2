import { GalleryView } from "@/components/insights/GalleryView";

export default function GalleryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Session Insights Gallery
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          View AI-powered insights from your session notes to identify patterns, themes, and growth opportunities in your professional practice.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
        <GalleryView />
      </div>
    </div>
  );
}
