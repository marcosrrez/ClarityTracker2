import { InsightsResourcesTab } from "@/components/insights/InsightsResourcesTab";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Insights & Resources</h1>
        <p className="text-muted-foreground">
          Capture your professional insights, summarize web content, and build your personal knowledge base.
        </p>
      </div>
      
      <InsightsResourcesTab />
    </div>
  );
}
