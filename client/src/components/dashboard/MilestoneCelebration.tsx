import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  X
} from "lucide-react";

interface MilestoneCelebrationProps {
  open: boolean;
  onClose: () => void;
  milestone: {
    type: 'hours' | 'supervision' | 'goal_completion' | 'streak';
    value: number;
    total?: number;
    title: string;
    description: string;
    nextGoal?: string;
    cognitiveMessage: string;
    achievements: string[];
  };
}

const getMilestoneIcon = (type: string) => {
  switch (type) {
    case 'hours':
      return <Target className="h-8 w-8 text-blue-500" />;
    case 'supervision':
      return <TrendingUp className="h-8 w-8 text-green-500" />;
    case 'goal_completion':
      return <Trophy className="h-8 w-8 text-yellow-500" />;
    case 'streak':
      return <Star className="h-8 w-8 text-purple-500" />;
    default:
      return <CheckCircle className="h-8 w-8 text-blue-500" />;
  }
};

const getCelebrationColor = (type: string) => {
  switch (type) {
    case 'hours':
      return 'from-blue-500 to-blue-600';
    case 'supervision':
      return 'from-green-500 to-green-600';
    case 'goal_completion':
      return 'from-yellow-500 to-yellow-600';
    case 'streak':
      return 'from-purple-500 to-purple-600';
    default:
      return 'from-blue-500 to-blue-600';
  }
};

// Cognitive science-based milestone messages
export const generateMilestoneMessage = (type: string, value: number) => {
  const messages = {
    hours: {
      25: "Neuroplasticity research shows that consistent practice creates lasting neural pathways. Your dedication to logging 25 hours demonstrates the professional habits that will serve you throughout your career!",
      50: "You've reached a significant milestone! Cognitive psychology tells us that celebrating small wins releases dopamine, reinforcing positive behaviors. You're building momentum toward licensure excellence.",
      100: "Outstanding progress! Research in behavioral psychology shows that tracking milestones increases motivation by 23%. Your commitment to detailed documentation is creating powerful professional habits.",
      250: "Incredible achievement! Studies in goal psychology demonstrate that people who celebrate quarter-milestones are 31% more likely to reach their ultimate goals. You're proving your dedication to professional excellence.",
      500: "Halfway to 1000! Cognitive science research shows that acknowledging progress at the midpoint significantly increases completion rates. Your persistence is the foundation of clinical expertise."
    },
    supervision: {
      10: "Supervision is where growth accelerates! Research shows that reflective practice combined with mentorship creates the strongest clinical skills. You're investing in your professional development.",
      25: "Amazing progress in supervision! Studies indicate that counselors who actively engage in supervision report higher confidence and better client outcomes. You're building clinical excellence.",
      50: "Supervision milestone achieved! Research in professional development shows that consistent mentorship relationships are the strongest predictor of career satisfaction and clinical competence."
    },
    streak: {
      7: "A week of consistent logging! Habit formation research shows it takes repeated action to build neural pathways. You're creating the professional discipline that defines excellent counselors.",
      14: "Two weeks of consistency! Behavioral psychology research indicates that 14 days of repeated behavior significantly strengthens habit formation. Your dedication is impressive!",
      30: "One month of dedicated practice! Neuroscience shows that 30 days of consistent behavior creates lasting changes in brain structure. You're literally rewiring your brain for professional success!"
    }
  };

  return (messages as any)[type]?.[value] || "Every step forward in your professional journey matters. Research shows that acknowledging progress, no matter how small, reinforces positive behaviors and builds lasting motivation.";
};

export const MilestoneCelebration = ({ open, onClose, milestone }: MilestoneCelebrationProps) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setCurrentProgress(milestone.total ? (milestone.value / milestone.total) * 100 : 100);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, milestone]);

  const handleClose = () => {
    setCurrentProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className={`bg-gradient-to-r ${getCelebrationColor(milestone.type)} p-6 text-white`}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white/20 rounded-full">
                  {getMilestoneIcon(milestone.type)}
                </div>
              </div>
              
              <div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-2">
                  🎉 Milestone Achieved!
                </Badge>
                <h2 className="text-2xl font-bold mb-2">{milestone.title}</h2>
                <p className="text-white/90">{milestone.description}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {milestone.total && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {milestone.value} / {milestone.total}
                      </span>
                    </div>
                    <Progress value={currentProgress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Growth Mindset Insight</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {milestone.cognitiveMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">What You've Accomplished:</h4>
              {milestone.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-800">{achievement}</span>
                </div>
              ))}
            </div>

            {milestone.nextGoal && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Next Goal</h4>
                      <p className="text-sm text-muted-foreground">{milestone.nextGoal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-4">
              <Button onClick={handleClose} className="w-full" size="lg">
                Continue Your Journey
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};