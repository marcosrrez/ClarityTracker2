import { AiInsightsView } from "@/components/insights/AiInsightsView";

export default function AiAnalysisPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          AI Session Analysis
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Get intelligent insights and reflective prompts from your anonymized session notes to enhance your clinical practice and professional growth.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
        <AiInsightsView />
      </div>
    </div>
  );
}
