import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Target,
  TrendingUp,
  Star,
  Award,
  Lightbulb,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Zap
} from "lucide-react";

interface CompetencyArea {
  name: string;
  currentLevel: number;
  targetLevel: number;
  description: string;
  insights: string[];
  resources: string[];
}

interface AIMentorInsight {
  id: string;
  type: 'growth_observation' | 'skill_development' | 'ethical_guidance' | 'encouragement';
  title: string;
  content: string;
  competencyArea: string;
  actionableSteps: string[];
  helpful?: boolean | null;
  createdAt: Date;
}

interface GrowthMetric {
  period: string;
  competencyGrowth: Record<string, number>;
  overallProgress: number;
  milestones: string[];
}

export default function GrowthStudioView() {
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const competencyAreas: CompetencyArea[] = [
    {
      name: 'Clinical Assessment',
      currentLevel: 75,
      targetLevel: 90,
      description: 'Ability to conduct thorough clinical assessments and develop accurate diagnoses',
      insights: [
        'Showing strong improvement in structured interview techniques',
        'Risk assessment skills have developed significantly',
        'Consider expanding knowledge of personality assessments'
      ],
      resources: [
        'Advanced Clinical Assessment Course',
        'DSM-5-TR Updates Workshop',
        'Risk Assessment Training'
      ]
    },
    {
      name: 'Therapeutic Interventions',
      currentLevel: 82,
      targetLevel: 90,
      description: 'Skill in implementing evidence-based therapeutic interventions',
      insights: [
        'Excellent progress with CBT techniques',
        'Building confidence in trauma-informed approaches',
        'Developing strong therapeutic alliance skills'
      ],
      resources: [
        'Advanced CBT Certification',
        'EMDR Training Level 1',
        'Mindfulness-Based Interventions'
      ]
    },
    {
      name: 'Cultural Competence',
      currentLevel: 68,
      targetLevel: 85,
      description: 'Understanding and effectively working with diverse populations',
      insights: [
        'Increased awareness of cultural factors in treatment',
        'Good progress in addressing bias in clinical work',
        'Focus on developing multicultural counseling skills'
      ],
      resources: [
        'Multicultural Counseling Workshop',
        'LGBTQ+ Affirming Therapy Training',
        'Working with Immigrant Populations'
      ]
    },
    {
      name: 'Professional Ethics',
      currentLevel: 88,
      targetLevel: 95,
      description: 'Knowledge and application of ethical principles in practice',
      insights: [
        'Strong ethical reasoning demonstrated consistently',
        'Excellent understanding of boundary issues',
        'Continue developing consultation skills'
      ],
      resources: [
        'Advanced Ethics in Practice',
        'Supervision and Consultation Skills',
        'Legal Issues in Mental Health'
      ]
    }
  ];

  const aiInsights: AIMentorInsight[] = [
    {
      id: '1',
      type: 'growth_observation',
      title: 'Emerging Strength in Trauma-Informed Care',
      content: 'Your recent sessions show a developing expertise in trauma-informed approaches. You\'re naturally creating safety and building trust with clients who have trauma histories.',
      competencyArea: 'Therapeutic Interventions',
      actionableSteps: [
        'Continue building trauma-specific intervention skills',
        'Consider pursuing specialized trauma training',
        'Document trauma-informed techniques that work well for you'
      ],
      helpful: null,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      type: 'skill_development',
      title: 'Assessment Skills Showing Growth',
      content: 'Your case conceptualizations are becoming more thorough and nuanced. The integration of multiple assessment sources demonstrates growing clinical thinking.',
      competencyArea: 'Clinical Assessment',
      actionableSteps: [
        'Practice presenting cases to build confidence',
        'Seek feedback on diagnostic reasoning',
        'Explore advanced assessment tools'
      ],
      helpful: true,
      createdAt: new Date('2024-01-12')
    },
    {
      id: '3',
      type: 'encouragement',
      title: 'Cultural Awareness Growing',
      content: 'You\'re becoming more attuned to cultural factors in your work. Your sensitivity to clients\' cultural backgrounds is evident in your treatment planning.',
      competencyArea: 'Cultural Competence',
      actionableSteps: [
        'Continue exploring your own cultural identities',
        'Seek diverse supervision experiences',
        'Engage with cultural competency resources'
      ],
      helpful: null,
      createdAt: new Date('2024-01-10')
    }
  ];

  const growthMetrics: GrowthMetric[] = [
    {
      period: 'This Month',
      competencyGrowth: {
        'Clinical Assessment': 8,
        'Therapeutic Interventions': 5,
        'Cultural Competence': 12,
        'Professional Ethics': 3
      },
      overallProgress: 7,
      milestones: ['Completed 25 hours supervision', 'First successful crisis intervention']
    },
    {
      period: 'Last Month',
      competencyGrowth: {
        'Clinical Assessment': 6,
        'Therapeutic Interventions': 10,
        'Cultural Competence': 4,
        'Professional Ethics': 2
      },
      overallProgress: 6,
      milestones: ['Reached 100 client contact hours', 'Received positive supervisor feedback']
    }
  ];

  const handleInsightFeedback = (insightId: string, helpful: boolean) => {
    // Update insight feedback
    console.log(`Insight ${insightId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  };

  const getCompetencyColor = (level: number) => {
    if (level >= 85) return 'text-green-600 bg-green-100';
    if (level >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">Growth Studio</h1>
          <p className="text-gray-600">Track competencies, insights, and professional development</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="competencies">Competencies</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Growth Trajectory
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {growthMetrics.map((metric, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-black">{metric.period}</span>
                          <Badge className="bg-green-100 text-green-800">
                            +{metric.overallProgress}% growth
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(metric.competencyGrowth).map(([area, growth]) => (
                            <div key={area} className="flex justify-between text-sm">
                              <span className="text-gray-600">{area}</span>
                              <span className="font-medium text-black">+{growth}%</span>
                            </div>
                          ))}
                        </div>
                        {metric.milestones.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-black mb-1">Milestones</p>
                            {metric.milestones.map((milestone, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                <Award className="h-3 w-3 text-yellow-600" />
                                {milestone}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Star className="h-5 w-5 text-green-600" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-black text-sm">150 Hours Milestone</p>
                        <p className="text-xs text-gray-600">Reached major licensure milestone</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-black text-sm">Assessment Expertise</p>
                        <p className="text-xs text-gray-600">Supervisor noted improvement in diagnostic skills</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Target className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-black text-sm">Cultural Competency Growth</p>
                        <p className="text-xs text-gray-600">Significant progress in multicultural awareness</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Progress */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black font-bold">Overall Competency Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {competencyAreas.map((area) => (
                    <div key={area.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-black text-sm">{area.name}</span>
                        <Badge className={getCompetencyColor(area.currentLevel)}>
                          {area.currentLevel}%
                        </Badge>
                      </div>
                      <Progress value={area.currentLevel} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Current: {area.currentLevel}%</span>
                        <span>Target: {area.targetLevel}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competencies" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {competencyAreas.map((area) => (
                <Card 
                  key={area.name}
                  className={`cursor-pointer transition-all border-0 shadow-lg ${
                    selectedCompetency === area.name ? 'ring-2 ring-blue-600' : ''
                  }`}
                  onClick={() => setSelectedCompetency(area.name)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-black font-bold">
                      <span className="text-sm">{area.name}</span>
                      <Badge className={getCompetencyColor(area.currentLevel)}>
                        {area.currentLevel}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="space-y-3">
                      <Progress value={area.currentLevel} className="h-3" />
                      
                      <p className="text-xs text-gray-600">{area.description}</p>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-black">Recent Insights:</p>
                        {area.insights.slice(0, 2).map((insight, idx) => (
                          <p key={idx} className="text-xs text-gray-600">• {insight}</p>
                        ))}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompetency(area.name);
                          setActiveTab('insights');
                        }}
                      >
                        View Details <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <Card key={insight.id} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-black font-bold text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {insight.competencyArea}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {insight.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="space-y-4">
                      <p className="text-gray-700">{insight.content}</p>
                      
                      <div>
                        <h4 className="font-medium text-black text-sm mb-2">Actionable Steps:</h4>
                        <div className="space-y-1">
                          {insight.actionableSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-600" />
                              <span className="text-sm text-gray-700">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-600">Was this insight helpful?</span>
                        <div className="flex gap-2">
                          <Button
                            variant={insight.helpful === true ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleInsightFeedback(insight.id, true)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={insight.helpful === false ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleInsightFeedback(insight.id, false)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competencyAreas.map((area) => (
                <Card key={area.name} className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardTitle className="flex items-center gap-2 text-black font-bold">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                      {area.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Current Level</span>
                        <Badge className={getCompetencyColor(area.currentLevel)}>
                          {area.currentLevel}%
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-black text-sm mb-2">Recommended Resources:</h4>
                        <div className="space-y-2">
                          {area.resources.map((resource, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <Zap className="h-3 w-3 text-blue-600" />
                              <span className="text-sm text-gray-700">{resource}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-4">
                        Explore Resources
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}