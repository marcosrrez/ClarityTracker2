import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar,
  PenTool,
  Award,
  TrendingUp,
  Play,
  Eye,
  Star,
  Target,
  Brain,
  Shield
} from "lucide-react";

interface SupervisionRecord {
  id: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisionType: 'individual' | 'group' | 'triadic';
  requiredHours: number;
  completedHours: number;
  contractSigned: boolean;
  lastSessionDate: Date;
  nextSessionDate?: Date;
  status: 'active' | 'inactive' | 'completed';
}

interface SupervisionSession {
  id: string;
  date: Date;
  duration: number;
  type: 'individual' | 'group' | 'triadic';
  topics: string[];
  supervisorFeedback?: string;
  actionItems: string[];
  nextGoals: string[];
}

interface SessionAnalysis {
  id: string;
  superviseeId: string;
  superviseeName: string;
  sessionDate: Date;
  duration: number;
  clientInitials: string;
  ebpTechniques: string[];
  complianceScore: number;
  engagementScore: number;
  riskIndicators: string[];
  strengths: string[];
  areasForImprovement: string[];
  supervisorReview?: {
    rating: number;
    feedback: string;
    recommendations: string[];
    reviewed: boolean;
  };
}

interface CompetencyArea {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  sessions: number;
}

export default function SupervisionHubView() {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [newSessionData, setNewSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    type: 'individual' as const,
    topics: '',
    notes: ''
  });

  const { toast } = useToast();

  // Mock data for session analyses - would come from API
  const sessionAnalyses: SessionAnalysis[] = [
    {
      id: '1',
      superviseeId: 'supervisee1',
      superviseeName: 'Sarah Wilson, LAC',
      sessionDate: new Date('2024-01-15'),
      duration: 50,
      clientInitials: 'J.M.',
      ebpTechniques: ['CBT', 'Mindfulness', 'Motivational Interviewing'],
      complianceScore: 92,
      engagementScore: 87,
      riskIndicators: [],
      strengths: ['Excellent rapport building', 'Strong CBT implementation', 'Good session structure'],
      areasForImprovement: ['Documentation timing', 'Crisis assessment depth'],
      supervisorReview: {
        rating: 4,
        feedback: 'Strong session with good therapeutic alliance. Continue developing crisis assessment skills.',
        recommendations: ['Practice crisis screening tools', 'Review documentation guidelines'],
        reviewed: true
      }
    },
    {
      id: '2',
      superviseeId: 'supervisee1',
      superviseeName: 'Sarah Wilson, LAC',
      sessionDate: new Date('2024-01-12'),
      duration: 45,
      clientInitials: 'R.T.',
      ebpTechniques: ['DBT', 'Cognitive Restructuring'],
      complianceScore: 88,
      engagementScore: 85,
      riskIndicators: ['Mild anxiety escalation noted'],
      strengths: ['Good emotion regulation techniques', 'Clear treatment goals'],
      areasForImprovement: ['Pacing of interventions', 'Client engagement strategies'],
      supervisorReview: {
        rating: 4,
        feedback: 'Good progress in DBT techniques. Watch pacing with anxious clients.',
        recommendations: ['Slow down intervention delivery', 'Practice grounding techniques'],
        reviewed: true
      }
    }
  ];

  const competencyAreas: CompetencyArea[] = [
    { name: 'Therapeutic Alliance', score: 87, trend: 'up', sessions: 12 },
    { name: 'EBP Implementation', score: 84, trend: 'up', sessions: 12 },
    { name: 'Crisis Assessment', score: 76, trend: 'stable', sessions: 8 },
    { name: 'Documentation', score: 82, trend: 'up', sessions: 12 },
    { name: 'Ethical Practice', score: 93, trend: 'stable', sessions: 12 }
  ];

  // Mock data - would come from API
  const supervisionRecords: SupervisionRecord[] = [
    {
      id: '1',
      supervisorName: 'Dr. Sarah Johnson',
      supervisorEmail: 'sarah.johnson@clinic.com',
      supervisionType: 'individual',
      requiredHours: 100,
      completedHours: 67,
      contractSigned: true,
      lastSessionDate: new Date('2024-01-10'),
      nextSessionDate: new Date('2024-01-17'),
      status: 'active'
    },
    {
      id: '2',
      supervisorName: 'Dr. Michael Chen',
      supervisorEmail: 'michael.chen@center.org',
      supervisionType: 'group',
      requiredHours: 50,
      completedHours: 23,
      contractSigned: true,
      lastSessionDate: new Date('2024-01-08'),
      status: 'active'
    }
  ];

  const recentSessions: SupervisionSession[] = [
    {
      id: '1',
      date: new Date('2024-01-10'),
      duration: 1.5,
      type: 'individual',
      topics: ['Case conceptualization', 'Ethical considerations', 'Treatment planning'],
      supervisorFeedback: 'Excellent progress in case conceptualization. Continue developing assessment skills.',
      actionItems: ['Complete additional assessment training', 'Practice case presentations'],
      nextGoals: ['Focus on trauma-informed interventions', 'Develop group therapy skills']
    }
  ];

  const handleLogSession = async () => {
    try {
      toast({
        title: "Session logged successfully",
        description: "Your supervision session has been recorded.",
      });
      
      // Reset form
      setNewSessionData({
        date: new Date().toISOString().split('T')[0],
        duration: 1,
        type: 'individual',
        topics: '',
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Error logging session",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">AI-Enhanced Supervision Hub</h1>
          <p className="text-gray-600">Advanced supervision with session analysis and competency tracking</p>
        </div>

        {/* Enhanced Supervision Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Session Analysis
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Development
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          
          {/* Session Analysis Tab */}
          <TabsContent value="sessions">{renderSessionAnalysisTab()}</TabsContent>
          
          {/* Development Tab */}
          <TabsContent value="development">{renderDevelopmentTab()}</TabsContent>
          
          {/* Compliance Tab */}
          <TabsContent value="compliance">{renderComplianceTab()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function renderOverviewTab() {
    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">2</p>
              <p className="text-sm text-gray-600">Active Supervisors</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">90</p>
              <p className="text-sm text-gray-600">Total Supervision Hours</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">3</p>
              <p className="text-sm text-gray-600">Sessions This Month</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">60%</p>
              <p className="text-sm text-gray-600">Requirements Met</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supervision Records */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Users className="h-5 w-5 text-blue-600" />
                Supervision Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {supervisionRecords.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-black">{record.supervisorName}</h3>
                      <p className="text-sm text-gray-600">{record.supervisorEmail}</p>
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs capitalize"
                      >
                        {record.supervisionType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.contractSigned && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <Badge 
                        variant={record.status === 'active' ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-black">
                        {record.completedHours} / {record.requiredHours} hours
                      </span>
                    </div>
                    <Progress 
                      value={(record.completedHours / record.requiredHours) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    <p>Last session: {record.lastSessionDate.toLocaleDateString()}</p>
                    {record.nextSessionDate && (
                      <p>Next session: {record.nextSessionDate.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Users className="h-4 w-4 mr-2" />
                    Add Supervisor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Supervisor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Supervisor Name" />
                    <Input placeholder="Email Address" />
                    <Input placeholder="Required Hours" type="number" />
                    <Button className="w-full">Add Supervisor</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Log New Session */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Calendar className="h-5 w-5 text-green-600" />
                Log Supervision Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={newSessionData.date}
                    onChange={(e) => setNewSessionData(prev => ({
                      ...prev,
                      date: e.target.value
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Duration (hours)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={newSessionData.duration}
                    onChange={(e) => setNewSessionData(prev => ({
                      ...prev,
                      duration: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Topics Discussed
                </label>
                <Textarea
                  placeholder="Enter the main topics covered in supervision..."
                  value={newSessionData.topics}
                  onChange={(e) => setNewSessionData(prev => ({
                    ...prev,
                    topics: e.target.value
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Session Notes
                </label>
                <Textarea
                  placeholder="Additional notes, feedback received, action items..."
                  value={newSessionData.notes}
                  onChange={(e) => setNewSessionData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleLogSession}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Log Session
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <FileText className="h-5 w-5 text-purple-600" />
              Recent Supervision Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-black">
                        {session.date.toLocaleDateString()} - {session.duration}h
                      </h3>
                      <Badge variant="outline" className="mt-1 text-xs capitalize">
                        {session.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-black text-sm mb-1">Topics Discussed</h4>
                      <div className="flex flex-wrap gap-1">
                        {session.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {session.supervisorFeedback && (
                      <div>
                        <h4 className="font-medium text-black text-sm mb-1">Supervisor Feedback</h4>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                          {session.supervisorFeedback}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-black text-sm mb-1">Action Items</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {session.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-black text-sm mb-1">Next Goals</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {session.nextGoals.map((goal, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Award className="h-3 w-3 mt-0.5 text-blue-600" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Management */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <FileText className="h-5 w-5 text-orange-600" />
              Documents & Contracts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-black mb-3">Required Documents</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium text-black">Supervision Contract</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span className="text-sm font-medium text-black">Liability Insurance</span>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium text-black">Background Check</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-3">Upload Documents</h3>
                <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose Files
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  }

  function renderSessionAnalysisTab() {
    return (
      <div className="space-y-6">
        {/* Session Analysis Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">AI-Powered Session Analysis</h2>
          <Button className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Generate AI Summary
          </Button>
        </div>

        {/* Session Analysis Cards */}
        <div className="grid gap-4">
          {sessionAnalyses.map((analysis) => (
            <Card key={analysis.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-black">{analysis.superviseeName}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {analysis.sessionDate.toLocaleDateString()} • {analysis.duration} min • Client: {analysis.clientInitials}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis.supervisorReview?.reviewed ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Reviewed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending Review</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-black">Compliance Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={analysis.complianceScore} className="flex-1" />
                      <span className="text-sm font-semibold">{analysis.complianceScore}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">Engagement Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={analysis.engagementScore} className="flex-1" />
                      <span className="text-sm font-semibold">{analysis.engagementScore}%</span>
                    </div>
                  </div>
                </div>

                {/* EBP Techniques */}
                <div>
                  <p className="text-sm font-medium text-black mb-2">Evidence-Based Practices Used</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.ebpTechniques.map((technique) => (
                      <Badge key={technique} variant="outline">{technique}</Badge>
                    ))}
                  </div>
                </div>

                {/* Risk Indicators */}
                {analysis.riskIndicators.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-800">Risk Indicators</p>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {analysis.riskIndicators.map((indicator, index) => (
                        <li key={index}>• {indicator}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths & Areas for Improvement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-2">Strengths</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-orange-800 mb-2">Areas for Improvement</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {analysis.areasForImprovement.map((area, index) => (
                        <li key={index}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Supervisor Review */}
                {analysis.supervisorReview && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">
                        Supervisor Review ({analysis.supervisorReview.rating}/5 stars)
                      </p>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">{analysis.supervisorReview.feedback}</p>
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Recommendations:</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {analysis.supervisorReview.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Full Session
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Watch Recording
                  </Button>
                  {!analysis.supervisorReview?.reviewed && (
                    <Button size="sm" className="flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Add Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function renderDevelopmentTab() {
    return (
      <div className="space-y-6">
        {/* Competency Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Competency Development Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competencyAreas.map((area) => (
                <div key={area.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-black">{area.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{area.score}%</span>
                        {area.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {area.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />}
                        {area.trend === 'stable' && <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />}
                      </div>
                    </div>
                    <Progress value={area.score} className="mb-1" />
                    <p className="text-xs text-gray-500">{area.sessions} sessions analyzed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Professional Development Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-black">Improve Crisis Assessment Skills</p>
                  <p className="text-sm text-gray-600">Target: 85% competency by March 2024</p>
                </div>
                <Progress value={76} className="w-24" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-black">Master DBT Techniques</p>
                  <p className="text-sm text-gray-600">Target: Complete advanced training</p>
                </div>
                <Progress value={60} className="w-24" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-black">Documentation Efficiency</p>
                  <p className="text-sm text-gray-600">Target: Same-day completion</p>
                </div>
                <Progress value={85} className="w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderComplianceTab() {
    return (
      <div className="space-y-6">
        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">94%</p>
              <p className="text-sm text-gray-600">Overall Compliance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">12/12</p>
              <p className="text-sm text-gray-600">Sessions Documented</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">2.5 hrs</p>
              <p className="text-sm text-gray-600">Supervision Hours This Month</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="flex-1 text-black">Required supervision hours met (4/4 hours)</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="flex-1 text-black">All session notes submitted on time</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="flex-1 text-black">Professional development plan review</span>
                <Badge variant="secondary">Due Jan 30</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="flex-1 text-black">Ethics training completed</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Risk Management & Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800 mb-2">Recent Risk Indicators</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Client anxiety escalation noted in session (1/12/24)</li>
                  <li>• Crisis assessment depth needs improvement</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-800 mb-2">Recommended Actions</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Complete crisis intervention training module</li>
                  <li>• Practice de-escalation techniques in next supervision</li>
                  <li>• Review safety protocols for high-anxiety clients</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}