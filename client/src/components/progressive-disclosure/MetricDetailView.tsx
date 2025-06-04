import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, TrendingUp, Calendar, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/lib/firebase';
import { useLogEntries } from '@/hooks/use-firestore';

interface MetricDetailProps {
  category: string;
  onBack: () => void;
  onDrillDown: (dataPoint: string, context: any) => void;
}

interface MetricData {
  totalHours: number;
  weeklyAverage: number;
  monthlyTrend: 'up' | 'down' | 'stable';
  recentEntries: Array<{
    date: string;
    hours: number;
    notes?: string;
    type?: string;
    supervisor?: string;
  }>;
  insights: string[];
}

export function MetricDetailView({ category, onBack, onDrillDown }: MetricDetailProps) {
  const { user } = useUser();
  const { entries: userEntries, loading: entriesLoading } = useLogEntries();
  const [data, setData] = useState<MetricData | null>(null);

  useEffect(() => {
    if (!entriesLoading && userEntries.length >= 0) {
      calculateMetrics();
    }
  }, [entriesLoading, userEntries, category]);

  const calculateMetrics = () => {
    if (!userEntries) return;
    
    // Calculate category-specific metrics from actual data
    let totalHours = 0;
    let recentEntries: any[] = [];
    let insights: string[] = [];
    let monthlyTrend: 'up' | 'down' | 'stable' = 'stable';
    
    if (category === 'direct_hours') {
      totalHours = userEntries.reduce((sum: number, entry: any) => 
        sum + (entry.clientContactHours || 0), 0);
      
      recentEntries = userEntries
        .filter((entry: any) => entry.clientContactHours > 0)
        .slice(0, 10)
        .map((entry: any) => {
          let displayDate = 'Recent Entry';
          if (entry.dateOfContact) {
            try {
              if (entry.dateOfContact.seconds) {
                displayDate = new Date(entry.dateOfContact.seconds * 1000).toLocaleDateString();
              } else if (entry.dateOfContact.toDate) {
                displayDate = entry.dateOfContact.toDate().toLocaleDateString();
              } else {
                displayDate = new Date(entry.dateOfContact).toLocaleDateString();
              }
            } catch (e) {
              displayDate = 'Recent Entry';
            }
          }
          return {
            date: displayDate,
            hours: entry.clientContactHours || 0,
            notes: entry.notes || 'No session notes recorded',
            type: 'Direct Client Contact'
          };
        });

      const averageSession = recentEntries.length > 0 ? 
        (totalHours / recentEntries.length).toFixed(1) : '0';
      
      insights = [
        `You've logged ${totalHours} direct client contact hours total`,
        `Average session length: ${averageSession} hours`,
        `${recentEntries.length} sessions recorded`,
        recentEntries.length > 0 ? 
          `Most recent: ${recentEntries[0]?.hours} hours on ${recentEntries[0]?.date}` :
          'No direct client hours logged yet'
      ];
    } else if (category === 'supervision_hours') {
      totalHours = userEntries.reduce((sum: number, entry: any) => 
        sum + (entry.supervisionHours || 0), 0);
      
      recentEntries = userEntries
        .filter((entry: any) => entry.supervisionHours > 0)
        .slice(0, 10)
        .map((entry: any) => {
          let displayDate = 'Recent Entry';
          if (entry.dateOfContact) {
            try {
              if (entry.dateOfContact.seconds) {
                displayDate = new Date(entry.dateOfContact.seconds * 1000).toLocaleDateString();
              } else if (entry.dateOfContact.toDate) {
                displayDate = entry.dateOfContact.toDate().toLocaleDateString();
              } else {
                displayDate = new Date(entry.dateOfContact).toLocaleDateString();
              }
            } catch (e) {
              displayDate = 'Recent Entry';
            }
          }
          return {
            date: displayDate,
            hours: entry.supervisionHours || 0,
            notes: entry.supervisionNotes || entry.notes || 'No supervision notes recorded',
            type: entry.supervisionType || 'Clinical Supervision',
            supervisor: entry.supervisorName || 'Supervisor'
          };
        });

      const averageSession = recentEntries.length > 0 ? 
        (totalHours / recentEntries.length).toFixed(1) : '0';
      
      insights = [
        `You've logged ${totalHours} supervision hours total`,
        `Average supervision session: ${averageSession} hours`,
        `${recentEntries.length} supervision sessions recorded`,
        recentEntries.length > 0 ? 
          `Most recent: ${recentEntries[0]?.hours} hours on ${recentEntries[0]?.date}` :
          'No supervision hours logged yet',
        `Progress toward 40-hour requirement: ${((totalHours / 40) * 100).toFixed(0)}%`
      ];
    } else if (category === 'professional_development' || category === 'ai_insights') {
      totalHours = userEntries.reduce((sum: number, entry: any) => 
        sum + (entry.professionalDevelopmentHours || 0), 0);
      
      recentEntries = userEntries
        .filter((entry: any) => entry.professionalDevelopmentHours > 0)
        .slice(0, 10)
        .map((entry: any) => {
          let displayDate = 'Recent Entry';
          if (entry.dateOfContact) {
            try {
              if (entry.dateOfContact.seconds) {
                displayDate = new Date(entry.dateOfContact.seconds * 1000).toLocaleDateString();
              } else if (entry.dateOfContact.toDate) {
                displayDate = entry.dateOfContact.toDate().toLocaleDateString();
              } else {
                displayDate = new Date(entry.dateOfContact).toLocaleDateString();
              }
            } catch (e) {
              displayDate = 'Recent Entry';
            }
          }
          return {
            date: displayDate,
            hours: entry.professionalDevelopmentHours || 0,
            notes: entry.notes || 'No development notes recorded',
            type: 'Professional Development'
          };
        });

      insights = [
        `You've logged ${totalHours} professional development hours total`,
        `${recentEntries.length} learning activities recorded`,
        `Focus: Continuing education and skill development`,
        recentEntries.length > 0 ? 
          `Most recent: ${recentEntries[0]?.hours} hours on ${recentEntries[0]?.date}` :
          'No professional development logged yet'
      ];
    }
    
    const weeklyAverage = totalHours > 0 ? Math.round((totalHours / 12) * 10) / 10 : 0;
    
    setData({
      totalHours,
      weeklyAverage,
      monthlyTrend,
      recentEntries,
      insights
    });
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'direct_hours':
        return 'Direct Client Contact Hours';
      case 'supervision_hours':
        return 'Supervision Hours';
      case 'professional_development':
        return 'Professional Development';
      default:
        return 'Metric Details';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'direct_hours':
        return Clock;
      case 'supervision_hours':
        return Calendar;
      case 'professional_development':
        return BookOpen;
      default:
        return TrendingUp;
    }
  };

  if (entriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">No Data Available</h2>
        </div>
      </div>
    );
  }

  const Icon = getCategoryIcon(category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">{getCategoryTitle(category)}</h2>
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{Number(data.totalHours).toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{Number(data.weeklyAverage).toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Weekly Average</div>
            </div>
            <div>
              <Badge variant={data.monthlyTrend === 'up' ? 'default' : 'secondary'}>
                {data.monthlyTrend === 'up' ? '↗' : data.monthlyTrend === 'down' ? '↘' : '→'} 
                {data.monthlyTrend}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Monthly Trend</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onDrillDown('total_hours', { 
              value: data?.totalHours, 
              trend: data?.monthlyTrend,
              category,
              totalHours: data?.totalHours,
              recentEntries: data?.recentEntries
            })}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Analyze Hours Pattern
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.recentEntries?.slice(0, 5).map((entry, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onDrillDown('recent_entry', { entry, category })}
            >
              <div>
                <div className="font-medium text-sm">{entry.date}</div>
                {entry.notes && (
                  <div className="text-xs text-muted-foreground truncate max-w-60">
                    {entry.notes}
                  </div>
                )}
                {entry.supervisor && (
                  <div className="text-xs text-blue-600">
                    {entry.supervisor}
                  </div>
                )}
              </div>
              <div className="text-lg font-semibold">
                {Math.round(entry.hours * 10) / 10}h
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}