import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Clock, Calendar, TrendingUp, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MetricDetailView } from '../progressive-disclosure/MetricDetailView';
import { DataAnalysisView } from '../progressive-disclosure/DataAnalysisView';
import { EducationalContentView } from '../progressive-disclosure/EducationalContentView';

interface SupervisionMetrics {
  totalHours: number;
  sessionsThisMonth: number;
  activeSupervisors: number;
  progressPercentage: number;
  recentSessions: Array<{
    id: string;
    date: string;
    duration: number;
    supervisorName: string;
    topics: string;
  }>;
}

type NavigationState = {
  level: 'overview' | 'detail' | 'analysis' | 'education';
  dataPoint?: string;
  context?: any;
  topic?: string;
};

export function SupervisionTracker() {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [navigation, setNavigation] = useState<NavigationState>({ level: 'overview' });
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    supervisorName: '',
    topics: '',
    notes: ''
  });
  const [metrics, setMetrics] = useState<SupervisionMetrics>({
    totalHours: 0,
    sessionsThisMonth: 0,
    activeSupervisors: 0,
    progressPercentage: 0,
    recentSessions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCardClick = () => {
    if (user?.uid) {
      setNavigation({ level: 'detail' });
    }
  };

  const handleBack = () => {
    if (navigation.level === 'detail') {
      setNavigation({ level: 'overview' });
    } else if (navigation.level === 'analysis') {
      setNavigation({ level: 'detail' });
    } else if (navigation.level === 'education') {
      setNavigation({ level: 'analysis', dataPoint: navigation.dataPoint, context: navigation.context });
    }
  };

  const handleDrillDown = (dataPoint: string, context: any) => {
    setNavigation({ level: 'analysis', dataPoint, context });
  };

  const handleLearnMore = (topic: string, context: any) => {
    setNavigation({ level: 'education', topic, context, dataPoint: navigation.dataPoint });
  };

  // Fetch supervision metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?.uid) return;
      
      try {
        const response = await fetch(`/api/supervision/metrics/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching supervision metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [user?.uid]);

  const handleLogSession = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch('/api/supervision/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          sessionData
        }),
      });

      if (response.ok) {
        toast({
          title: "Session logged",
          description: "Your supervision session has been recorded.",
        });
        
        // Refresh metrics
        const metricsResponse = await fetch(`/api/supervision/metrics/${user.uid}`);
        if (metricsResponse.ok) {
          const updatedMetrics = await metricsResponse.json();
          setMetrics(updatedMetrics);
        }
        
        setShowSessionDialog(false);
        setSessionData({
          date: new Date().toISOString().split('T')[0],
          duration: 1,
          supervisorName: '',
          topics: '',
          notes: ''
        });
      } else {
        throw new Error('Failed to save session');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Detail Level - Detailed supervision view
  if (navigation.level === 'detail') {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <MetricDetailView
            category="supervision_hours"
            onBack={handleBack}
            onDrillDown={handleDrillDown}
          />
        </div>
      </div>
    );
  }

  // Analysis Level - Supervision analysis
  if (navigation.level === 'analysis') {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <DataAnalysisView
            dataPoint={navigation.dataPoint!}
            context={navigation.context}
            onBack={handleBack}
            onLearnMore={handleLearnMore}
          />
        </div>
      </div>
    );
  }

  // Education Level - Educational content about supervision
  if (navigation.level === 'education') {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <EducationalContentView
            topic={navigation.topic!}
            context={navigation.context}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supervision Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supervision Progress
          </div>
          <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Supervision Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-date">Date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="session-duration">Duration (hours)</Label>
                  <Input
                    id="session-duration"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={sessionData.duration}
                    onChange={(e) => setSessionData(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="supervisor-name">Supervisor Name</Label>
                  <Input
                    id="supervisor-name"
                    value={sessionData.supervisorName}
                    onChange={(e) => setSessionData(prev => ({ ...prev, supervisorName: e.target.value }))}
                    placeholder="Dr. Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="session-topics">Topics Discussed</Label>
                  <Input
                    id="session-topics"
                    value={sessionData.topics}
                    onChange={(e) => setSessionData(prev => ({ ...prev, topics: e.target.value }))}
                    placeholder="Case consultation, ethical considerations..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="session-notes">Notes</Label>
                  <Textarea
                    id="session-notes"
                    value={sessionData.notes}
                    onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Key takeaways and insights..."
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleLogSession} className="w-full">
                  Save Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-semibold text-gray-900">{metrics.activeSupervisors}</p>
              <p className="text-xs text-gray-600">Active Supervisors</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-semibold text-gray-900">{metrics.totalHours}</p>
              <p className="text-xs text-gray-600">Total Hours</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-semibold text-gray-900">{metrics.sessionsThisMonth}</p>
              <p className="text-xs text-gray-600">This Month</p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-1" />
              <p className="text-lg font-semibold text-gray-900">{metrics.progressPercentage}%</p>
              <p className="text-xs text-gray-600">Progress</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          {metrics.totalHours > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Licensure Progress</span>
                <span className="font-medium">{metrics.totalHours} / 100 hours</span>
              </div>
              <Progress value={metrics.progressPercentage} className="h-2" />
            </div>
          )}
          
          {/* Recent Sessions */}
          {metrics.recentSessions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Sessions</h4>
              <div className="space-y-2">
                {metrics.recentSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{session.supervisorName}</p>
                      <p className="text-xs text-gray-600">{session.topics}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {session.duration}h
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{session.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}