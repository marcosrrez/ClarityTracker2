import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Shield, 
  FileText, 
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Brain,
  Target,
  Activity,
  Award,
  MessageSquare,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface LACSupervisee {
  id: string;
  name: string;
  email: string;
  licenseLevel: 'LAC' | 'LPC-A' | 'LMFT-A';
  startDate: Date;
  totalHours: number;
  directHours: number;
  groupHours: number;
  supervisionHours: number;
  riskLevel: 'low' | 'medium' | 'high';
  competencyScore: number;
  lastSessionDate: Date;
  recentConcerns: string[];
  strengths: string[];
  nextMilestone: string;
  progressToLicense: number;
}

interface SupervisionMetrics {
  totalSupervisees: number;
  activeSupervisions: number;
  upcomingDeadlines: number;
  riskAlerts: number;
  completedHoursThisMonth: number;
  averageCompetencyScore: number;
  complianceRate: number;
}

interface TrendData {
  month: string;
  sessions: number;
  riskEvents: number;
  competencyGrowth: number;
  complianceScore: number;
}

export default function SupervisorAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedSupervisee, setSelectedSupervisee] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch real supervision metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: [`/api/supervisor/${user?.uid}/analytics`],
    enabled: !!user?.uid,
  });

  // Fetch real supervisees data
  const { data: superviseesData, isLoading: superviseesLoading } = useQuery({
    queryKey: [`/api/supervisor/${user?.uid}/supervisees`],
    enabled: !!user?.uid,
  });

  // Fetch trends data
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: [`/api/supervisor/${user?.uid}/trends`, selectedTimeframe],
    enabled: !!user?.uid,
  });

  // Fetch compliance data
  const { data: complianceData, isLoading: complianceLoading } = useQuery({
    queryKey: [`/api/supervisor/${user?.uid}/compliance`],
    enabled: !!user?.uid,
  });

  const supervisionMetrics = metricsData?.metrics || {
    totalSupervisees: 0,
    activeSupervisions: 0,
    upcomingDeadlines: 0,
    riskAlerts: 0,
    completedHoursThisMonth: 0,
    averageCompetencyScore: 0,
    complianceRate: 0
  };

  const supervisees = superviseesData?.supervisees || [];
  const trendData = trendsData?.trendData || [];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCompetencyLevel = (score: number) => {
    if (score >= 8) return { level: 'Proficient', color: 'bg-green-500' };
    if (score >= 7) return { level: 'Developing', color: 'bg-yellow-500' };
    if (score >= 6) return { level: 'Novice', color: 'bg-blue-500' };
    return { level: 'Needs Support', color: 'bg-red-500' };
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supervisor Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive oversight and progress tracking for LAC supervisees
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Supervisees</p>
                <p className="text-2xl font-bold">{supervisionMetrics.totalSupervisees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Alerts</p>
                <p className="text-2xl font-bold text-red-600">{supervisionMetrics.riskAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Competency</p>
                <p className="text-2xl font-bold">{supervisionMetrics.averageCompetencyScore}/10</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold">{supervisionMetrics.complianceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="supervisees">Supervisees</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sessions This Month</span>
                    <span className="font-bold">{supervisionMetrics.completedHoursThisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Supervisions</span>
                    <span className="font-bold">{supervisionMetrics.activeSupervisions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Upcoming Deadlines</span>
                    <Badge variant="outline">{supervisionMetrics.upcomingDeadlines}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>1 supervisee</strong> requires additional attention for risk assessment skills
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Risk Distribution</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-700">6</div>
                        <div className="text-green-600">Low Risk</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-bold text-yellow-700">1</div>
                        <div className="text-yellow-600">Medium Risk</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-red-700">0</div>
                        <div className="text-red-600">High Risk</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Supervisees Tab */}
        <TabsContent value="supervisees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Supervisee Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supervisees.map((supervisee) => {
                  const competencyLevel = getCompetencyLevel(supervisee.competencyScore);
                  return (
                    <div key={supervisee.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{supervisee.name}</h3>
                          <p className="text-sm text-muted-foreground">{supervisee.email}</p>
                          <Badge variant="outline" className="mt-1">{supervisee.licenseLevel}</Badge>
                        </div>
                        <div className="text-right">
                          <Badge variant={getRiskColor(supervisee.riskLevel)}>
                            {supervisee.riskLevel.toUpperCase()} RISK
                          </Badge>
                          <div className="mt-2">
                            <span className="text-sm text-muted-foreground">Competency: </span>
                            <span className="font-bold">{supervisee.competencyScore}/10</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Progress to License</h4>
                          <Progress value={supervisee.progressToLicense} className="mb-1" />
                          <p className="text-xs text-muted-foreground">{supervisee.progressToLicense}% Complete</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Hours Summary</h4>
                          <div className="text-sm space-y-1">
                            <div>Direct: {supervisee.directHours}h</div>
                            <div>Group: {supervisee.groupHours}h</div>
                            <div>Supervision: {supervisee.supervisionHours}h</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Next Milestone</h4>
                          <p className="text-sm">{supervisee.nextMilestone}</p>
                        </div>
                      </div>

                      {supervisee.recentConcerns.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Areas for Development:</strong> {supervisee.recentConcerns.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <h4 className="font-medium mb-1">Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {supervisee.strengths.map((strength, index) => (
                            <Badge key={index} variant="secondary">{strength}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Session Volume Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendData.map((data, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{data.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{data.sessions} sessions</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(data.sessions / 180) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Competency Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendData.map((data, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{data.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">+{data.competencyGrowth.toFixed(1)} avg growth</span>
                        {data.competencyGrowth > 0.3 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          {complianceLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentation Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Overall Compliance Rate</span>
                      <span className="font-bold text-green-600">{complianceData?.compliance?.overallRate || 0}%</span>
                    </div>
                    <Progress value={complianceData?.compliance?.overallRate || 0} className="mb-4" />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Session Notes Complete</span>
                        <span className="text-sm font-medium">{complianceData?.compliance?.sessionNotesComplete || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Risk Assessments Current</span>
                        <span className="text-sm font-medium">{complianceData?.compliance?.riskAssessmentsCurrent || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Supervision Documentation</span>
                        <span className="text-sm font-medium">{complianceData?.compliance?.supervisionDocumentation || 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceData?.compliance?.upcomingRequirements?.length > 0 && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          {complianceData.compliance.upcomingRequirements.length} supervisees have sessions due within 7 days
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-3">
                      {complianceData?.compliance?.upcomingRequirements?.map((req: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{req.superviseeName} - {req.requirement}</span>
                          <Badge variant="outline">{req.priority}</Badge>
                        </div>
                      )) || (
                        <div className="text-center text-muted-foreground py-4">
                          No upcoming requirements
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Compliance Report
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Schedule Group Supervision
            </Button>
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Set Development Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}