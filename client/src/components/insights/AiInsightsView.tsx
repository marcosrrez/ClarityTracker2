import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Lightbulb, Target, Eye, BookOpen, Tag } from "lucide-react";
import { analyzeSessionNotes } from "@/lib/ai";
import type { AiAnalysisResult } from "@/lib/ai";

export const AiInsightsView = () => {
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!notes.trim()) {
      setError("Please enter session notes to analyze");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Use real Firebase AI analysis
      const result = await analyzeSessionNotes(notes);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze notes. Please try again.");
      console.error("AI analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analysisCards = [
    {
      title: "Summary",
      content: analysis?.summary,
      icon: Sparkles,
      color: "text-primary",
    },
    {
      title: "Key Themes",
      content: analysis?.themes,
      icon: Lightbulb,
      color: "text-yellow-500",
    },
    {
      title: "Potential Blind Spots",
      content: analysis?.potentialBlindSpots,
      icon: Eye,
      color: "text-orange-500",
    },
    {
      title: "Reflective Prompts",
      content: analysis?.reflectivePrompts,
      icon: Target,
      color: "text-green-500",
    },
    {
      title: "Key Learnings",
      content: analysis?.keyLearnings,
      icon: BookOpen,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Session Notes for Analysis</h3>
          <Textarea
            placeholder="Enter your session notes here for AI-powered insights and professional development guidance..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={!notes.trim() || isAnalyzing}
          className="w-full sm:w-auto"
        >
          {isAnalyzing ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Session Notes
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {analysis && (
        <div className="space-y-6">
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              AI Analysis Results
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {analysisCards.map((card, index) => (
                <Card key={index} className="card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <card.icon className={`mr-2 h-4 w-4 ${card.color}`} />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(card.content) ? (
                      <div className="space-y-2">
                        {card.content.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="mr-2 mb-2">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {card.content || "No data available"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {analysis.ccsrCategory && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-primary" />
                  CCSR Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-primary border-primary">
                  {analysis.ccsrCategory}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};