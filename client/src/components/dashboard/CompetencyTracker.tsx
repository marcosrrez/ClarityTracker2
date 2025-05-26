import { useState, useEffect } from "react";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Circle, 
  TrendingUp,
  Brain,
  Heart,
  Users,
  FileText,
  Scale,
  Shield,
  Target
} from "lucide-react";

interface CompetencyArea {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  skills: string[];
  progress: number;
  evidenceCount: number;
  nextMilestone: string;
}

const COUNSELING_COMPETENCIES: Omit<CompetencyArea, 'progress' | 'evidenceCount'>[] = [
  {
    id: "therapeutic-relationship",
    name: "Therapeutic Relationship",
    description: "Building rapport, trust, and working alliance with clients",
    icon: Heart,
    color: "text-red-500",
    skills: ["Active listening", "Empathy", "Unconditional positive regard", "Genuineness", "Boundary setting"],
    nextMilestone: "Demonstrate consistent rapport building across diverse clients"
  },
  {
    id: "assessment-evaluation",
    name: "Assessment & Evaluation", 
    description: "Clinical assessment, diagnosis, and treatment planning",
    icon: FileText,
    color: "text-blue-500",
    skills: ["Mental status exam", "Risk assessment", "Diagnostic formulation", "Treatment planning", "Progress monitoring"],
    nextMilestone: "Complete comprehensive biopsychosocial assessments"
  },
  {
    id: "intervention-techniques",
    name: "Intervention Techniques",
    description: "Therapeutic modalities and evidence-based practices",
    icon: Brain,
    color: "text-purple-500",
    skills: ["CBT techniques", "Solution-focused therapy", "Motivational interviewing", "Crisis intervention", "Group facilitation"],
    nextMilestone: "Demonstrate proficiency in primary theoretical orientation"
  },
  {
    id: "multicultural-competence",
    name: "Multicultural Competence",
    description: "Cultural awareness, sensitivity, and inclusive practice",
    icon: Users,
    color: "text-green-500",
    skills: ["Cultural self-awareness", "Bias recognition", "Culturally adapted interventions", "Language considerations", "Social justice advocacy"],
    nextMilestone: "Integrate cultural factors in all treatment planning"
  },
  {
    id: "ethical-practice",
    name: "Ethical & Legal Practice",
    description: "Professional ethics, legal compliance, and risk management",
    icon: Scale,
    color: "text-amber-500",
    skills: ["Confidentiality", "Informed consent", "Dual relationships", "Documentation", "Mandated reporting"],
    nextMilestone: "Navigate complex ethical dilemmas independently"
  },
  {
    id: "professional-development",
    name: "Professional Development",
    description: "Self-care, supervision, and ongoing learning",
    icon: TrendingUp,
    color: "text-indigo-500",
    skills: ["Self-reflection", "Supervision utilization", "Continuing education", "Burnout prevention", "Professional identity"],
    nextMilestone: "Develop autonomous professional practice"
  }
];

export const CompetencyTracker = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const { cards: insightCards = [] } = useInsightCards();
  const [competencies, setCompetencies] = useState<CompetencyArea[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCompetencies = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis of competencies based on session content
    setTimeout(() => {
      const analyzedCompetencies = COUNSELING_COMPETENCIES.map(comp => {
        // Basic scoring based on available data
        let evidenceCount = 0;
        let skillsEvidence = 0;
        
        // Analyze session notes for competency keywords
        logEntries.forEach(entry => {
          const noteText = entry.notes.toLowerCase();
          comp.skills.forEach(skill => {
            if (noteText.includes(skill.toLowerCase().split(' ')[0])) {
              skillsEvidence++;
              evidenceCount++;
            }
          });
          
          // Additional scoring based on specific competency focus
          switch (comp.id) {
            case "therapeutic-relationship":
              if (noteText.includes("rapport") || noteText.includes("trust") || noteText.includes("alliance")) {
                evidenceCount += 2;
              }
              break;
            case "assessment-evaluation":
              if (noteText.includes("assessment") || noteText.includes("diagnosis") || noteText.includes("plan")) {
                evidenceCount += 2;
              }
              break;
            case "intervention-techniques":
              if (noteText.includes("cbt") || noteText.includes("intervention") || noteText.includes("technique")) {
                evidenceCount += 2;
              }
              break;
            case "ethical-practice":
              if (noteText.includes("ethical") || noteText.includes("boundary") || noteText.includes("confidential")) {
                evidenceCount += 2;
              }
              break;
          }
        });

        // Factor in insight cards for professional development
        if (comp.id === "professional-development") {
          evidenceCount += insightCards.length * 2;
        }

        // Calculate progress (0-100%)
        const maxEvidence = Math.max(20, logEntries.length * 2); // Scaling factor
        const progress = Math.min(95, (evidenceCount / maxEvidence) * 100);

        return {
          ...comp,
          progress: Math.round(progress),
          evidenceCount
        };
      });

      setCompetencies(analyzedCompetencies);
      setIsAnalyzing(false);
    }, 1500);
  };

  useEffect(() => {
    if (logEntries.length > 0 && !loading) {
      analyzeCompetencies();
    }
  }, [logEntries.length, insightCards.length, loading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logEntries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Competency Tracking</span>
          </CardTitle>
          <CardDescription>Monitor your progress across core counseling competencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start logging sessions to track your competency development.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = competencies.length > 0 
    ? Math.round(competencies.reduce((sum, comp) => sum + comp.progress, 0) / competencies.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary" />
          <span>Competency Tracking</span>
          <Badge variant="secondary">{overallProgress}% Overall</Badge>
        </CardTitle>
        <CardDescription>
          Progress across core counseling competencies based on your session documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Analyzing your competency development...
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {competencies.map((competency) => {
              const IconComponent = competency.icon;
              const isHighProgress = competency.progress >= 70;
              const isMediumProgress = competency.progress >= 40;
              
              return (
                <div key={competency.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`h-4 w-4 ${competency.color}`} />
                      <span className="font-medium text-sm">{competency.name}</span>
                      {isHighProgress && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {competency.evidenceCount} evidence points
                      </span>
                      <Badge 
                        variant={isHighProgress ? "default" : isMediumProgress ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {competency.progress}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={competency.progress} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Next: {competency.nextMilestone}
                  </p>
                </div>
              );
            })}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Competency Development</span>
                <span className="font-bold">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Based on analysis of {logEntries.length} sessions and {insightCards.length} reflections
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};