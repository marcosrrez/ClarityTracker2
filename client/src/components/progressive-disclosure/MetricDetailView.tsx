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
        .map((entry: any) => ({
          date: entry.dateOfContact ? new Date(entry.dateOfContact.seconds * 1000).toLocaleDateString() : 'N/A',
          hours: entry.clientContactHours || 0,
          notes: entry.notes || 'No session notes recorded',
          type: 'Direct Client Contact'
        }));

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
        .map((entry: any) => ({
          date: entry.dateOfContact ? new Date(entry.dateOfContact.seconds * 1000).toLocaleDateString() : 'N/A',
          hours: entry.supervisionHours || 0,
          notes: entry.supervisionNotes || entry.notes || 'No supervision notes recorded',
          type: 'Clinical Supervision'
        }));

      const averageSession = recentEntries.length > 0 ? 
        (totalHours / recentEntries.length).toFixed(1) : '1.0';
      
      insights = [
        `You've completed ${totalHours} supervision hours total`,
        `Average supervision length: ${averageSession} hours`,
        `${recentEntries.length} supervision sessions recorded`,
        recentEntries.length > 0 ? 
          `Most recent: ${recentEntries[0]?.hours} hours on ${recentEntries[0]?.date}` :
          'No supervision hours logged yet'
      ];
    } else if (category === 'professional_development' || category === 'ai_insights') {
      totalHours = userEntries.reduce((sum: number, entry: any) => 
        sum + (entry.professionalDevelopmentHours || 0), 0);
      
      recentEntries = userEntries
        .filter((entry: any) => entry.professionalDevelopmentHours > 0)
        .slice(0, 10)
        .map((entry: any) => ({
          date: entry.dateOfContact ? new Date(entry.dateOfContact.seconds * 1000).toLocaleDateString() : 'N/A',
          hours: entry.professionalDevelopmentHours || 0,
          notes: entry.notes || 'No development notes recorded',
          type: 'Professional Development'
        }));

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
      case 'direct_hours':
        return 'Direct Client Hours';
      case 'professional_development':
        return 'Professional Development';
      default:
        return 'Metric Details';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'supervision_hours':
        return 'Track your supervision sessions and progress toward licensure requirements';
      case 'direct_hours':
        return 'Monitor your direct client contact hours and therapeutic practice';
      case 'professional_development':
        return 'Document your continuing education and professional growth activities';
      default:
        return 'Detailed view of your professional development metrics';
    }
  };

  if (entriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-muted">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getCategoryTitle(category)}</h1>
          <p className="text-muted-foreground">{getCategoryDescription(category)}</p>
        </div>
      </div>

      {/* Main Metric Card */}
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Total Hours</CardTitle>
            <Badge variant={data?.monthlyTrend === 'up' ? 'default' : 'secondary'}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {data?.monthlyTrend || 'stable'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground mb-2">
            {data?.totalHours || 0}
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            Weekly average: {data?.weeklyAverage || 0} hours
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onDrillDown('total_hours', { 
              value: data?.totalHours, 
              trend: data?.monthlyTrend,
              category 
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
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
              </div>
              <div className="text-lg font-semibold">
                {entry.hours}h
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights */}
      {data?.insights && data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Professional Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.map((insight, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                onClick={() => onDrillDown('insight', { insight, category })}
              >
                <p className="text-sm text-blue-900 dark:text-blue-100">{insight}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-700 dark:text-blue-300">
                  <BookOpen className="h-3 w-3" />
                  Learn more about this insight
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}