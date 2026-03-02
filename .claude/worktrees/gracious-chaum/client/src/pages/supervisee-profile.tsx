import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, Mail, Phone, User, TrendingUp, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { format, differenceInDays, addMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScheduleSessionDialog } from '@/components/supervision/ScheduleSessionDialog';

export default function SuperviseeProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Fetch supervisee relationship data
  const { data: supervisee, isLoading: loadingSupervisee } = useQuery({
    queryKey: ['/api/supervisees', id],
    queryFn: async () => {
      const response = await fetch(`/api/supervisees/${id}`);
      if (!response.ok) throw new Error('Failed to fetch supervisee');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch supervision sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['/api/supervision/sessions', user?.uid, id],
    queryFn: async () => {
      const response = await fetch(`/api/supervision/sessions/${user?.uid}?superviseeId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!user?.uid && !!id,
  });

  // Fetch competency assessments
  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['/api/competency/assessments', user?.uid, id],
    queryFn: async () => {
      const response = await fetch(`/api/competency/assessments/${user?.uid}?superviseeId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch assessments');
      return response.json();
    },
    enabled: !!user?.uid && !!id,
  });

  // Fetch supervisee's logged hours (hour sharing system)
  const { data: superviseeHours = [], isLoading: loadingHours } = useQuery({
    queryKey: ['/api/supervisee-hours', id],
    queryFn: async () => {
      const response = await fetch(`/api/supervisee-hours/${id}`);
      if (!response.ok) throw new Error('Failed to fetch supervisee hours');
      return response.json();
    },
    enabled: !!id,
  });

  if (loadingSupervisee || loadingSessions || loadingAssessments || loadingHours) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!supervisee) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Supervisee not found.</p>
            <Button variant="outline" onClick={() => setLocation('/compliance')} className="mt-4">
              Back to Compliance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const totalSupervisionHours = sessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60;
  const totalClientHours = superviseeHours.reduce((sum: number, h: any) => sum + (h.clientContactHours || 0), 0);
  const requiredSupervisionRatio = 10; // 1 hour supervision per 10 client hours
  const requiredSupervisionHours = Math.ceil(totalClientHours / requiredSupervisionRatio);
  const supervisionDeficit = Math.max(0, requiredSupervisionHours - totalSupervisionHours);
  
  const lastSession = sessions.sort((a: any, b: any) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )[0];
  
  const daysSinceLastSession = lastSession 
    ? differenceInDays(new Date(), new Date(lastSession.sessionDate))
    : null;

  // LAC milestone calculations
  const lacStartDate = supervisee.lacDate ? new Date(supervisee.lacDate) : null;
  const sixMonthEval = lacStartDate ? addMonths(lacStartDate, 6) : null;
  const oneYearEval = lacStartDate ? addMonths(lacStartDate, 12) : null;
  const eighteenMonthEval = lacStartDate ? addMonths(lacStartDate, 18) : null;
  const twoYearCompletion = lacStartDate ? addMonths(lacStartDate, 24) : null;

  // Progress calculations
  const totalRequiredHours = 4000; // Standard LAC requirement
  const progressPercentage = Math.min(100, (totalClientHours / totalRequiredHours) * 100);
  
  // Compliance status
  const isSupervisionCompliant = supervisionDeficit === 0;
  const daysSinceLastSessionLimit = supervisee.supervisionFrequency === 'weekly' ? 7 : 14;
  const isSessionCompliant = !daysSinceLastSession || daysSinceLastSession <= daysSinceLastSessionLimit;
  
  const overallCompliance = isSupervisionCompliant && isSessionCompliant ? 'good' : 
                           (!isSupervisionCompliant || daysSinceLastSession > daysSinceLastSessionLimit * 0.8) ? 'warning' : 'at-risk';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setLocation('/compliance')}>
            ← Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supervisee.superviseeName}</h1>
            <p className="text-muted-foreground">Licensed Associate Counselor</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={
            overallCompliance === 'good' ? 'default' :
            overallCompliance === 'warning' ? 'secondary' : 'destructive'
          }>
            {overallCompliance === 'good' ? 'Compliant' :
             overallCompliance === 'warning' ? 'At Risk' : 'Needs Attention'}
          </Badge>
          <Button onClick={() => setShowScheduleDialog(true)}>
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Client Hours</p>
                <p className="text-2xl font-bold">{totalClientHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">of 4,000 required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Supervision Hours</p>
                <p className="text-2xl font-bold">{totalSupervisionHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {supervisionDeficit > 0 ? `${supervisionDeficit.toFixed(1)} behind` : 'On track'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Session</p>
                <p className="text-2xl font-bold">
                  {daysSinceLastSession !== null ? `${daysSinceLastSession}d` : 'Never'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSession ? format(new Date(lastSession.sessionDate), 'MMM d') : 'No sessions yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Progress</p>
                <p className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</p>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="hours">Hour Tracking</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{supervisee.superviseeEmail}</p>
                  </div>
                </div>
                {supervisee.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{supervisee.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">LAC Date</p>
                    <p className="text-sm text-muted-foreground">
                      {lacStartDate ? format(lacStartDate, 'MMMM d, yyyy') : 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 3).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Supervision Session</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.sessionDate), 'MMM d, yyyy')} • {session.durationMinutes} min
                        </p>
                      </div>
                      <Badge variant="outline">{session.sessionType}</Badge>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Growth Areas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Development Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium flex items-center mb-3">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      {supervisee.strengths ? (
                        <p className="text-sm">{supervisee.strengths}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No strengths recorded yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center mb-3">
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                      Growth Areas
                    </h4>
                    <div className="space-y-2">
                      {supervisee.growthAreas ? (
                        <p className="text-sm">{supervisee.growthAreas}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No growth areas identified yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Supervision Sessions</CardTitle>
              <CardDescription>
                Complete history of supervision sessions and notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session: any) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">
                          {format(new Date(session.sessionDate), 'MMMM d, yyyy')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {session.durationMinutes} minutes • {session.sessionType}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {session.isCompleted ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    {session.notes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Session Notes:</p>
                        <p className="text-sm">{session.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-muted-foreground">No sessions recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies">
          <Card>
            <CardHeader>
              <CardTitle>Competency Assessments</CardTitle>
              <CardDescription>
                Track development across key competency areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment: any) => (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{assessment.competencyArea}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(assessment.assessmentDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {assessment.currentLevel} → {assessment.targetLevel}
                      </Badge>
                    </div>
                    {assessment.progressNotes && (
                      <p className="text-sm mt-2">{assessment.progressNotes}</p>
                    )}
                  </div>
                ))}
                {assessments.length === 0 && (
                  <p className="text-muted-foreground">No competency assessments yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Hour Tracking (Shared)</CardTitle>
              <CardDescription>
                Hours logged by the supervisee are automatically shared here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">Supervision Ratio</h4>
                    <p className="text-2xl font-bold mt-2">
                      1:{Math.round(totalClientHours / Math.max(1, totalSupervisionHours))}
                    </p>
                    <p className="text-sm text-muted-foreground">Current ratio (target: 1:10)</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">Hours Deficit</h4>
                    <p className="text-2xl font-bold mt-2 text-red-600">
                      {supervisionDeficit.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Supervision hours needed</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">Total Progress</h4>
                    <p className="text-2xl font-bold mt-2">
                      {progressPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Toward LPC requirements</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Hour Entries</h4>
                  {superviseeHours.slice(0, 10).map((entry: any) => (
                    <div key={entry.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">
                          {format(new Date(entry.dateOfContact), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.clientContactHours} client hours • {entry.supervisionType}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {entry.supervisionHours > 0 ? `${entry.supervisionHours}h supervision` : 'No supervision'}
                      </Badge>
                    </div>
                  ))}
                  {superviseeHours.length === 0 && (
                    <p className="text-muted-foreground">No hours logged yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>LAC Milestones</CardTitle>
              <CardDescription>
                Track progress through key evaluation periods and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lacStartDate && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">LAC Start Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(lacStartDate, 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    {sixMonthEval && (
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">6-Month Evaluation</p>
                          <p className="text-sm text-muted-foreground">
                            {format(sixMonthEval, 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {new Date() > sixMonthEval ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    )}

                    {oneYearEval && (
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">1-Year Evaluation</p>
                          <p className="text-sm text-muted-foreground">
                            {format(oneYearEval, 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {new Date() > oneYearEval ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    )}

                    {eighteenMonthEval && (
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">18-Month Evaluation</p>
                          <p className="text-sm text-muted-foreground">
                            {format(eighteenMonthEval, 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {new Date() > eighteenMonthEval ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    )}

                    {twoYearCompletion && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">LPC Eligibility</p>
                          <p className="text-sm text-muted-foreground">
                            {format(twoYearCompletion, 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {new Date() > twoYearCompletion && totalClientHours >= 4000 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!lacStartDate && (
                  <p className="text-muted-foreground">LAC start date not specified.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Session Dialog */}
      <ScheduleSessionDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        superviseeId={id}
        superviseeName={supervisee.superviseeName}
        superviseeEmail={supervisee.superviseeEmail}
      />
    </div>
  );
}