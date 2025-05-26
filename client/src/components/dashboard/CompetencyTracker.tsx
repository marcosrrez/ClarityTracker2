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
  Target,
  ChevronDown,
  ChevronUp,
  Award
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
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
          <div className="h-2 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!logEntries.length) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Competency Tracking</h3>
          <p className="text-gray-500">
            Start logging sessions to track your competency development.
          </p>
        </div>
      </div>
    );
  }

  const overallProgress = competencies.length > 0 
    ? Math.round(competencies.reduce((sum, comp) => sum + comp.progress, 0) / competencies.length)
    : 0;

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Competency Tracking</h3>
              <p className="text-sm text-gray-500 font-medium">
                {overallProgress}% overall progress across core competencies
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={analyzeCompetencies}
              disabled={isAnalyzing}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
            >
              <TrendingUp className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            </Button>
            {competencies.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {isAnalyzing ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 mb-3">Analyzing your competency development...</div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-2 bg-gray-100 rounded-full animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900">{overallProgress}%</div>
                <div className="text-sm text-gray-500">Overall Progress</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900">{competencies.filter(c => c.progress >= 70).length}</div>
                <div className="text-sm text-gray-500">Advanced Areas</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900">{logEntries.length}</div>
                <div className="text-sm text-gray-500">Evidence Points</div>
              </div>
            </div>

            {/* Expandable Detailed View */}
            {isExpanded && (
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Detailed Competency Breakdown</h4>
                {competencies.map((competency) => {
                  const IconComponent = competency.icon;
                  const isHighProgress = competency.progress >= 70;
                  
                  return (
                    <div key={competency.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                            <IconComponent className={`h-3 w-3 ${competency.color}`} />
                          </div>
                          <span className="font-medium text-gray-900">{competency.name}</span>
                          {isHighProgress && <Award className="h-4 w-4 text-green-500" />}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{competency.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${competency.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Next milestone: {competency.nextMilestone}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};