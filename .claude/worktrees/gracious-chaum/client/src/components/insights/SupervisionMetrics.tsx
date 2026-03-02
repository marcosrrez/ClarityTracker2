import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, Calendar, TrendingUp, PenTool, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface SupervisionRecord {
  id: string;
  supervisorName: string;
  supervisionType: 'individual' | 'group' | 'triadic';
  requiredHours: number;
  completedHours: number;
  status: 'active' | 'inactive';
}

interface SupervisionSession {
  id: string;
  date: Date;
  duration: number;
  supervisorId: string;
  topics: string;
  notes: string;
}

export function SupervisionMetrics() {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    supervisorId: '',
    topics: '',
    notes: ''
  });
  const [metrics, setMetrics] = useState({
    totalHours: 0,
    sessionsThisMonth: 0,
    activeSupervisors: 0,
    progressPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

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
          supervisorId: '',
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

  return (
    <div className="space-y-6">
      {/* Supervision Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <p className="text-xl font-semibold text-gray-900">{metrics.activeSupervisors}</p>
            <p className="text-xs text-gray-600">Active Supervisors</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-semibold text-gray-900">{metrics.totalHours}</p>
            <p className="text-xs text-gray-600">Total Hours</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-semibold text-gray-900">{metrics.sessionsThisMonth}</p>
            <p className="text-xs text-gray-600">This Month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-2" />
            <p className="text-xl font-semibold text-gray-900">{metrics.progressPercentage}%</p>
            <p className="text-xs text-gray-600">Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Log Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Supervision Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData(prev => ({...prev, date: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={sessionData.duration}
                    onChange={(e) => setSessionData(prev => ({...prev, duration: parseFloat(e.target.value) || 0}))}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Topics</label>
                <Textarea
                  placeholder="Topics discussed in supervision..."
                  value={sessionData.topics}
                  onChange={(e) => setSessionData(prev => ({...prev, topics: e.target.value}))}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  placeholder="Session notes, feedback, action items..."
                  value={sessionData.notes}
                  onChange={(e) => setSessionData(prev => ({...prev, notes: e.target.value}))}
                  rows={3}
                />
              </div>
              
              <Button onClick={handleLogSession} className="w-full">
                Log Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          size="sm" 
          variant="outline"
          className="border-gray-200 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supervisor
        </Button>
      </div>

      {/* Progress Overview */}
      {supervisionRecords.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Supervision Progress</span>
                <span className="font-medium">{totalHours} / {totalRequired} hours</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex flex-wrap gap-2">
                {supervisionRecords.map(record => (
                  <Badge key={record.id} variant="secondary" className="text-xs">
                    {record.supervisorName}: {record.completedHours}/{record.requiredHours}h
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}