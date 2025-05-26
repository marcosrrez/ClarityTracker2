import { AiInsightsView } from "@/components/insights/AiInsightsView";

export default function AiAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">AI Session Analysis</h1>
        <p className="text-muted-foreground">
          Get intelligent insights and reflective prompts from your anonymized session notes to enhance your clinical practice.
        </p>
      </div>
      
      <AiInsightsView />
    </div>
  );
}
