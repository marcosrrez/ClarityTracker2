import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Lightbulb, Target, Eye, BookOpen, Tag } from "lucide-react";

interface AiAnalysisResult {
  summary: string;
  themes: string[];
  potentialBlindSpots: string[];
  reflectivePrompts: string[];
  keyLearnings: string[];
  ccsrCategory: string;
}

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
      
      // TODO: Implement AI analysis with Google AI/Gemini
      // For now, simulate the analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      const mockResult: AiAnalysisResult = {
        summary: "Session focused on anxiety management techniques with a client presenting with generalized anxiety disorder. Explored cognitive restructuring strategies and introduced mindfulness-based interventions.",
        themes: [
          "Anxiety management",
          "Cognitive restructuring", 
          "Mindfulness interventions",
          "Therapeutic rapport building"
        ],
        potentialBlindSpots: [
          "Consider exploring underlying trauma history",
          "Monitor for signs of avoidance behaviors",
          "Assess family dynamics impact on anxiety"
        ],
        reflectivePrompts: [
          "What cultural factors might be influencing the client's anxiety expression?",
          "How might your own experiences with anxiety impact your therapeutic approach?",
          "What additional assessment tools could provide deeper insight into the client's presentation?"
        ],
        keyLearnings: [
          "Client responds well to concrete coping strategies",
          "Mindfulness techniques require more practice and guidance",
          "Strong therapeutic alliance established"
        ],
        ccsrCategory: "Individual Counseling - Anxiety Disorders"
      };
      
      setAnalysis(mockResult);
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
      icon: Bot,
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
      color: "text-blue-500",
    },
    {
      title: "Key Learnings",
      content: analysis?.keyLearnings,
      icon: BookOpen,
      color: "text-green-500",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>AI-Powered Session Analysis</span>
          </CardTitle>
          <CardDescription>
            Enter your anonymized session notes to receive intelligent insights and reflective prompts
            to enhance your clinical practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Textarea
              placeholder="Paste your anonymized session notes here...

Example: 'Session with client presenting anxiety symptoms. Discussed coping strategies and introduced breathing exercises. Client showed good engagement and willingness to practice techniques at home.'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              <strong>Important:</strong> Ensure all identifying information is removed to protect client confidentiality.
            </p>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !notes.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Analyzing Notes...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Analyze Session Notes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* CCS-R Category */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">CCS-R Category:</span>
                <Badge variant="outline">{analysis.ccsrCategory}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                      <span>{card.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {card.title === "Summary" ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {card.content}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {(card.content as string[])?.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start space-x-2">
                            <span className="text-xs mt-1.5 block w-1 h-1 bg-current rounded-full flex-shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  Save Analysis
                </Button>
                <Button variant="outline" size="sm">
                  Export to PDF
                </Button>
                <Button variant="outline" size="sm">
                  Add to Journal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
