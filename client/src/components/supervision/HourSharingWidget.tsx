import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Share,
  Calendar
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ScheduleSessionDialog } from "./ScheduleSessionDialog";

interface HourSharingWidgetProps {
  supervisees: any[];
  supervisorId: string;
}

export function HourSharingWidget({ supervisees, supervisorId }: HourSharingWidgetProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedSuperviseeId, setSelectedSuperviseeId] = useState<string>("");

  // Fetch supervision sessions to calculate hour ratios
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/supervision/sessions', supervisorId],
    queryFn: async () => {
      const response = await fetch(`/api/supervision/sessions/${supervisorId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!supervisorId,
  });

  // Calculate supervision metrics for each supervisee
  const supervisionMetrics = supervisees.map(supervisee => {
    const superviseeSessions = sessions.filter((s: any) => s.superviseeId === supervisee.id);
    const totalSupervisionHours = superviseeSessions.reduce((sum: number, s: any) => 
      sum + (s.durationMinutes / 60), 0
    );

    // Estimate client contact hours (this would ideally come from shared data)
    const estimatedClientHours = supervisee.completedHours || 0;
    const recommendedSupervisionHours = Math.ceil(estimatedClientHours / 10); // 1:10 ratio
    const supervisionDeficit = Math.max(0, recommendedSupervisionHours - totalSupervisionHours);
    
    // Find last session
    const lastSession = superviseeSessions
      .sort((a: any, b: any) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0];
    
    const daysSinceLastSession = lastSession 
      ? differenceInDays(new Date(), new Date(lastSession.sessionDate))
      : null;

    // Find next scheduled session
    const upcomingSessions = superviseeSessions.filter((s: any) => 
      new Date(s.sessionDate) > new Date() && !s.isCompleted
    ).sort((a: any, b: any) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
    
    const nextSession = upcomingSessions[0];

    const complianceStatus = supervisionDeficit > 2 ? 'critical' : 
                           supervisionDeficit > 0 ? 'warning' : 'good';

    return {
      ...supervisee,
      totalSupervisionHours,
      estimatedClientHours,
      recommendedSupervisionHours,
      supervisionDeficit,
      complianceStatus,
      lastSession,
      daysSinceLastSession,
      nextSession,
      supervisionRatio: estimatedClientHours > 0 ? (totalSupervisionHours / estimatedClientHours) * 100 : 0
    };
  });

  const scheduleSession = (superviseeId: string) => {
    setSelectedSuperviseeId(superviseeId);
    setShowScheduleDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervision Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supervisionMetrics.reduce((sum, s) => sum + s.totalSupervisionHours, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {supervisees.length} supervisee{supervisees.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Supervision Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supervisionMetrics.length > 0 
                ? (supervisionMetrics.reduce((sum, s) => sum + s.supervisionRatio, 0) / supervisionMetrics.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 10% (1:10 ratio)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behind Schedule</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {supervisionMetrics.filter(s => s.complianceStatus !== 'good').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Supervisees needing attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supervision Compliance Alert */}
      {supervisionMetrics.some(s => s.complianceStatus === 'critical') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical supervision deficit detected.</strong> Some supervisees are significantly behind 
            on required supervision hours. Schedule sessions immediately to maintain compliance.
          </AlertDescription>
        </Alert>
      )}

      {/* Individual Supervisee Hour Tracking */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Supervision Hour Tracking</h3>
          <Button onClick={() => setShowScheduleDialog(true)} size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        {supervisionMetrics.map((supervisee) => (
          <Card key={supervisee.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{supervisee.superviseeName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Share className="h-3 w-3" />
                    Hour sharing enabled • {supervisee.supervisionFrequency} supervision required
                  </CardDescription>
                </div>
                <Badge 
                  variant={
                    supervisee.complianceStatus === 'good' ? 'default' : 
                    supervisee.complianceStatus === 'warning' ? 'secondary' : 
                    'destructive'
                  }
                >
                  {supervisee.complianceStatus === 'good' ? 'Compliant' : 
                   supervisee.complianceStatus === 'warning' ? 'At Risk' : 'Critical'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hour Ratio Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Supervision Ratio</span>
                  <span>{supervisee.supervisionRatio.toFixed(1)}% (Target: 10%)</span>
                </div>
                <Progress 
                  value={Math.min(supervisee.supervisionRatio, 15)} 
                  className="h-2"
                />
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>Client Hours: {supervisee.estimatedClientHours}</div>
                  <div>Supervision Hours: {supervisee.totalSupervisionHours.toFixed(1)}</div>
                </div>
              </div>

              {/* Session Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <h5 className="font-medium text-sm mb-1">Last Session</h5>
                  {supervisee.lastSession ? (
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(supervisee.lastSession.sessionDate), 'MMM d, yyyy')}
                      <span className="block text-xs">
                        {supervisee.daysSinceLastSession} days ago
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No sessions recorded</div>
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-sm mb-1">Next Session</h5>
                  {supervisee.nextSession ? (
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(supervisee.nextSession.sessionDate), 'MMM d, yyyy')}
                      <span className="block text-xs">
                        {supervisee.nextSession.sessionType} • {supervisee.nextSession.durationMinutes}min
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Not scheduled
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 ml-1 text-xs"
                        onClick={() => scheduleSession(supervisee.id)}
                      >
                        Schedule now
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Supervision Deficit Warning */}
              {supervisee.supervisionDeficit > 0 && (
                <Alert variant={supervisee.complianceStatus === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Supervision deficit: {supervisee.supervisionDeficit.toFixed(1)} hours</strong>
                    <br />
                    Schedule additional sessions to meet 1:10 supervision ratio requirements.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Session Dialog */}
      <ScheduleSessionDialog
        open={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        supervisees={supervisees}
        selectedSuperviseeId={selectedSuperviseeId}
      />
    </div>
  );
}