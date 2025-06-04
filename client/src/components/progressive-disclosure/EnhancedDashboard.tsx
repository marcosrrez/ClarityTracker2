import { useEffect, useState } from 'react';
import { useUser } from '@/lib/firebase';
import { ProgressiveMetricCard } from './ProgressiveMetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardMetrics {
  supervisionHours: number;
  directClientHours: number;
  professionalDevelopmentHours: number;
  totalEntries: number;
}

export function EnhancedDashboard() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    supervisionHours: 0,
    directClientHours: 0,
    professionalDevelopmentHours: 0,
    totalEntries: 0
  });
  const [isSeeded, setIsSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchMetrics();
    }
  }, [user?.uid]);

  const fetchMetrics = async () => {
    if (!user?.uid) return;
    
    try {
      // Fetch supervision metrics
      const supervisionResponse = await fetch(`/api/supervision/metrics/${user.uid}`);
      const supervisionData = await supervisionResponse.json();
      
      // Fetch log entries for other metrics
      const entriesResponse = await fetch(`/api/log-entries?userId=${user.uid}`);
      const entriesData = await entriesResponse.json();
      
      const entries = entriesData.entries || [];
      
      const directClientHours = entries.reduce((sum: number, entry: any) => 
        sum + (entry.clientContactHours || 0), 0);
      const professionalDevelopmentHours = entries.reduce((sum: number, entry: any) => 
        sum + (entry.professionalDevelopmentHours || 0), 0);
      
      setMetrics({
        supervisionHours: supervisionData.totalSupervisionHours || 0,
        directClientHours,
        professionalDevelopmentHours,
        totalEntries: entries.length
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const seedEducationalContent = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/progressive-disclosure/seed-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsSeeded(true);
      }
    } catch (error) {
      console.error('Error seeding content:', error);
    } finally {
      setSeeding(false);
    }
  };

  const generateInsights = async () => {
    if (!user?.uid) return;
    
    try {
      await fetch(`/api/progressive-disclosure/generate-insights/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  if (!user?.uid) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view your enhanced dashboard</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enhanced Progress Dashboard</h1>
          <p className="text-muted-foreground">Interactive insights and educational content</p>
        </div>
        
        <div className="flex gap-2">
          {!isSeeded && (
            <Button 
              onClick={seedEducationalContent} 
              disabled={seeding}
              variant="outline"
              size="sm"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {seeding ? 'Setting up...' : 'Setup Content'}
            </Button>
          )}
          
          <Button 
            onClick={generateInsights} 
            variant="outline"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Progressive Disclosure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProgressiveMetricCard
          title="Supervision Hours"
          value={`${metrics.supervisionHours}`}
          subtitle="hours completed"
          category="supervision_hours"
          userId={user.uid}
          className="hover:shadow-lg"
        />
        
        <ProgressiveMetricCard
          title="Direct Client Hours"
          value={`${metrics.directClientHours}`}
          subtitle="hours logged"
          category="direct_hours"
          userId={user.uid}
          className="hover:shadow-lg"
        />
        
        <ProgressiveMetricCard
          title="Professional Development"
          value={`${metrics.professionalDevelopmentHours}`}
          subtitle="hours completed"
          category="professional_development"
          userId={user.uid}
          className="hover:shadow-lg"
        />
      </div>

      {/* Information Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Lightbulb className="h-5 w-5" />
            Progressive Disclosure System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-blue-800 dark:text-blue-200">
            Each metric card above provides three levels of information:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">Level 1: Overview</Badge>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Basic metric display with your current progress
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">Level 2: Context</Badge>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Personalized insights and progress analysis
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">Level 3: Education</Badge>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Targeted learning resources and guidance
              </p>
            </div>
          </div>
          
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Click "View Progress Insights" on any card to explore deeper levels of information tailored to your progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}