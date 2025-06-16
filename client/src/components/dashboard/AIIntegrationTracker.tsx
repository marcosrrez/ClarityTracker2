import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  Mail,
  X,
  Brain
} from "lucide-react";

interface AIIntegrationStatus {
  totalInsights: number;
  sessionsAnalyzed: number;
  patternsDetected: number;
  supervisionPrepsGenerated: number;
  competenciesTracked: number;
  milestones: {
    firstInsight: boolean;
    tenInsights: boolean;
    firstPattern: boolean;
    firstSupervisionPrep: boolean;
    twentyFiveInsights: boolean;
    fiftyInsights: boolean;
  };
}

interface MilestoneAlert {
  type: 'first_insight' | 'ten_insights' | 'first_pattern' | 'twenty_five_insights';
  title: string;
  description: string;
  benefits: string[];
  nextSteps: string[];
}

export function AIIntegrationTracker() {
  const [showMilestoneAlert, setShowMilestoneAlert] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneAlert | null>(null);
  const [dismissedMilestones, setDismissedMilestones] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('dismissedAIMilestones') || '[]');
  });

  const { data: status, isLoading } = useQuery<AIIntegrationStatus>({
    queryKey: ['/api/ai/integration-status', 'demo-user'],
    refetchInterval: 60000, // Check every minute for new milestones
  });

  const milestoneDefinitions: Record<string, MilestoneAlert> = {
    first_insight: {
      type: 'first_insight',
      title: 'Welcome to AI-Powered Growth!',
      description: 'You\'ve received your first AI insight. This is the beginning of personalized professional development.',
      benefits: [
        'Pattern recognition has begun',
        'Your therapy profile is building',
        'Growth recommendations are now active'
      ],
      nextSteps: [
        'Continue logging sessions regularly',
        'Review insights in the Intelligence Hub',
        'Provide feedback to improve recommendations'
      ]
    },
    ten_insights: {
      type: 'ten_insights',
      title: 'AI Integration Milestone Reached!',
      description: 'You\'ve accumulated 10+ AI insights. The system now has enough data to provide meaningful pattern analysis.',
      benefits: [
        'More accurate pattern detection',
        'Personalized supervision preparation',
        'Competency tracking is now active',
        'Weekly rhythm insights available'
      ],
      nextSteps: [
        'Explore the Intelligence Hub for deep insights',
        'Set up email summaries for weekly reviews',
        'Check supervision prep before meetings'
      ]
    },
    first_pattern: {
      type: 'first_pattern',
      title: 'First Pattern Detected!',
      description: 'The AI has identified your first behavioral or learning pattern. This shows meaningful data accumulation.',
      benefits: [
        'Personalized growth recommendations',
        'Early warning system for challenges',
        'Strength recognition and amplification'
      ],
      nextSteps: [
        'Review the pattern in detail',
        'Discuss with your supervisor',
        'Track pattern evolution over time'
      ]
    },
    twenty_five_insights: {
      type: 'twenty_five_insights',
      title: 'Advanced AI Features Unlocked!',
      description: 'With 25+ insights, you now have access to advanced features like predictive supervision preparation and detailed competency analytics.',
      benefits: [
        'Predictive supervision agendas',
        'Advanced competency analytics',
        'Personalized resource recommendations',
        'Growth trajectory predictions'
      ],
      nextSteps: [
        'Explore advanced analytics',
        'Set up automated email summaries',
        'Review your growth trajectory'
      ]
    }
  };

  // Check for new milestones
  useEffect(() => {
    if (!status) return;

    const checkMilestone = (key: string, condition: boolean) => {
      if (condition && !dismissedMilestones.includes(key)) {
        setCurrentMilestone(milestoneDefinitions[key]);
        setShowMilestoneAlert(true);
      }
    };

    checkMilestone('first_insight', status.totalInsights >= 1);
    checkMilestone('ten_insights', status.totalInsights >= 10);
    checkMilestone('first_pattern', status.patternsDetected >= 1);
    checkMilestone('twenty_five_insights', status.totalInsights >= 25);
  }, [status, dismissedMilestones]);

  const dismissMilestone = () => {
    if (currentMilestone) {
      const updated = [...dismissedMilestones, currentMilestone.type];
      setDismissedMilestones(updated);
      localStorage.setItem('dismissedAIMilestones', JSON.stringify(updated));
    }
    setShowMilestoneAlert(false);
    setCurrentMilestone(null);
  };

  const sendEmailSummary = () => {
    // This would integrate with email service
    console.log('Sending AI integration summary email');
    dismissMilestone();
  };

  if (isLoading || !status) return null;

  const progress = Math.min((status.totalInsights / 25) * 100, 100);

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black font-bold">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            AI Integration Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Intelligence Building</span>
              <span className="font-bold text-black">{status.totalInsights}/25 insights</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-lg font-bold text-black">{status.patternsDetected}</span>
              </div>
              <p className="text-xs text-gray-600">Patterns</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-lg font-bold text-black">{status.supervisionPrepsGenerated}</span>
              </div>
              <p className="text-xs text-gray-600">Supervision Preps</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-lg font-bold text-black">{status.competenciesTracked}</span>
              </div>
              <p className="text-xs text-gray-600">Competencies</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Brain className="h-4 w-4 text-orange-600" />
                <span className="text-lg font-bold text-black">{status.sessionsAnalyzed}</span>
              </div>
              <p className="text-xs text-gray-600">Sessions</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {status.milestones.firstInsight && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                First Insight
              </Badge>
            )}
            {status.milestones.tenInsights && (
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                10+ Insights
              </Badge>
            )}
            {status.milestones.firstPattern && (
              <Badge className="bg-purple-100 text-purple-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Pattern Detection
              </Badge>
            )}
            {status.milestones.twentyFiveInsights && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Advanced Features
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Alert Dialog */}
      <Dialog open={showMilestoneAlert} onOpenChange={setShowMilestoneAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                {currentMilestone?.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissMilestone}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {currentMilestone && (
            <div className="space-y-4">
              <p className="text-gray-700">{currentMilestone.description}</p>
              
              <div>
                <h4 className="font-bold text-black mb-2">Benefits Unlocked:</h4>
                <ul className="space-y-1">
                  {currentMilestone.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-black mb-2">Recommended Next Steps:</h4>
                <ul className="space-y-1">
                  {currentMilestone.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={sendEmailSummary} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Summary
                </Button>
                <Button onClick={dismissMilestone} variant="outline">
                  Got it
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}