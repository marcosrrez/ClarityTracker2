import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HourSharingWidget } from "@/components/supervision/HourSharingWidget";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar,
  TrendingUp,
  Shield,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, addWeeks } from "date-fns";

export default function CompliancePage() {
  const { user } = useAuth();
  const { permissions, isIndividual } = useAccountType();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect individual users
  if (isIndividual || !permissions.canTrackCompliance) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Supervisor Features Required</h2>
        <p className="text-muted-foreground mb-4">
          Upgrade to a Supervisor or Enterprise plan to access compliance tracking.
        </p>
        <Button>Upgrade Account</Button>
      </div>
    );
  }

  // Fetch supervisee relationships and compliance data
  const { data: supervisees = [], isLoading: loadingSupervisees } = useQuery({
    queryKey: ['/api/supervisees', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervisees?supervisorId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch supervisees');
      return response.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch compliance alerts
  const { data: alerts = [], isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['/api/compliance/alerts', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/compliance/alerts?supervisorId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch supervision sessions for compliance tracking
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['/api/supervision/sessions', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervision/sessions/${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!user?.uid,
  });

  const generateAlerts = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/compliance/alerts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorId: user?.uid }),
      });
      
      if (!response.ok) throw new Error('Failed to generate alerts');
      
      await refetchAlerts();
      toast({
        title: "Compliance check complete",
        description: "Updated compliance alerts based on current supervision data.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh compliance data.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate compliance metrics
  const complianceMetrics = supervisees.map((supervisee: any) => {
    const superviseeSessions = sessions.filter((s: any) => s.superviseeId === supervisee.superviseeId);
    const lastSession = superviseeSessions.sort((a: any, b: any) => 
      new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    )[0];
    
    const daysSinceLastSession = lastSession 
      ? differenceInDays(new Date(), new Date(lastSession.sessionDate))
      : null;
    
    const requiredFrequency = supervisee.supervisionFrequency || 'weekly';
    const maxDaysBetweenSessions = requiredFrequency === 'weekly' ? 7 : 14;
    
    const isOverdue = daysSinceLastSession && daysSinceLastSession > maxDaysBetweenSessions;
    const totalHours = superviseeSessions.reduce((sum: number, s: any) => sum + s.durationMinutes, 0) / 60;
    
    return {
      ...supervisee,
      lastSessionDate: lastSession?.sessionDate,
      daysSinceLastSession,
      isOverdue,
      totalSupervisionHours: totalHours,
      sessionCount: superviseeSessions.length,
      complianceStatus: isOverdue ? 'at-risk' : (daysSinceLastSession && daysSinceLastSession > (maxDaysBetweenSessions * 0.8)) ? 'warning' : 'good'
    };
  });

  const overdueSupervisees = complianceMetrics.filter(s => s.isOverdue);
  const atRiskSupervisees = complianceMetrics.filter(s => s.complianceStatus === 'warning');
  const compliantSupervisees = complianceMetrics.filter(s => s.complianceStatus === 'good');

  if (loadingSupervisees || loadingAlerts || loadingSessions) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Compliance Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor supervision requirements and compliance status for all supervisees.
            </p>
          </div>
          <Button onClick={generateAlerts} disabled={refreshing}>
            {refreshing ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Run Compliance Check
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supervisees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{compliantSupervisees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atRiskSupervisees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueSupervisees.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="hours">Hour Tracking</TabsTrigger>
          <TabsTrigger value="supervisees">Supervisees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Active Compliance Alerts
                </CardTitle>
                <CardDescription>
                  Issues requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.slice(0, 3).map((alert: any) => (
                  <Alert 
                    key={alert.id} 
                    variant={alert.severity === 'high' ? 'destructive' : 'default'}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      // Show detailed alert information
                      toast({
                        title: `${alert.type.replace('_', ' ').toUpperCase()} Alert`,
                        description: `${alert.message}\n\nSupervision Details:\n${alert.details || 'Click "View All Alerts" for more information.'}\n\nCreated: ${format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}`,
                      });
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>{alert.type.replace('_', ' ').toUpperCase()}:</strong> {alert.message}
                          <div className="text-sm text-muted-foreground mt-1">
                            Created {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                            <span className="ml-2 text-xs opacity-75">Click for details</span>
                          </div>
                        </div>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Supervision Compliance Summary</CardTitle>
              <CardDescription>
                Overview of supervision frequency and requirements compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Compliance Rate</span>
                  <span>{Math.round((compliantSupervisees.length / supervisees.length) * 100)}%</span>
                </div>
                <Progress value={(compliantSupervisees.length / supervisees.length) * 100} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Recent Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    {sessions.length} supervision sessions logged in total
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Next Actions</h4>
                  <p className="text-sm text-muted-foreground">
                    {overdueSupervisees.length > 0 
                      ? `Schedule ${overdueSupervisees.length} overdue sessions`
                      : 'All supervision sessions up to date'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>
                Automated alerts based on supervision requirements and timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium">No active alerts</h3>
                  <p className="text-sm text-muted-foreground">All supervisees are meeting compliance requirements.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert: any) => (
                    <Alert 
                      key={alert.id} 
                      variant={alert.severity === 'high' ? 'destructive' : 'default'}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast({
                          title: `${(alert.alertType || alert.type || 'Alert').replace('_', ' ').toUpperCase()}`,
                          description: `${alert.description || alert.message}\n\nCreated: ${format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}`,
                        });
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong>{alert.type.replace('_', ' ').toUpperCase()}:</strong> {alert.message}
                            <div className="text-sm text-muted-foreground mt-1">
                              Created {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                              <span className="ml-2 text-xs opacity-75">Click for details</span>
                            </div>
                          </div>
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <HourSharingWidget supervisees={supervisees} supervisorId={user?.uid || ''} />
        </TabsContent>

        <TabsContent value="supervisees">
          <Card>
            <CardHeader>
              <CardTitle>Supervisee Compliance Status</CardTitle>
              <CardDescription>
                Individual compliance tracking for each supervisee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceMetrics.map((supervisee) => (
                  <div 
                    key={supervisee.id} 
                    className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setLocation(`/supervisee/${supervisee.superviseeId || supervisee.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{supervisee.superviseeName || supervisee.name}</h4>
                        <p className="text-sm text-muted-foreground">{supervisee.superviseeEmail || supervisee.email}</p>
                      </div>
                      <Badge variant={
                        supervisee.complianceStatus === 'good' ? 'default' :
                        supervisee.complianceStatus === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {supervisee.complianceStatus === 'good' ? 'Compliant' :
                         supervisee.complianceStatus === 'warning' ? 'At Risk' : 'Overdue'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Last Session:</span>
                        <div className="font-medium">
                          {supervisee.lastSessionDate 
                            ? format(new Date(supervisee.lastSessionDate), 'MMM d')
                            : 'Never'
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Hours:</span>
                        <div className="font-medium">{supervisee.totalSupervisionHours.toFixed(1)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sessions:</span>
                        <div className="font-medium">{supervisee.sessionCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>
                        <div className="font-medium">{supervisee.supervisionFrequency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}