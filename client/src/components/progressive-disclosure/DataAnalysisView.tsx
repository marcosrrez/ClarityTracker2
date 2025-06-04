import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Info, BookOpen, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/firebase';

interface DataAnalysisProps {
  dataPoint: string;
  context: any;
  onBack: () => void;
  onLearnMore: (topic: string, context: any) => void;
}

interface AnalysisData {
  personalAnalysis: string;
  patterns: string[];
  recommendations: string[];
  benchmarks: {
    target: number;
    current: number;
    progress: number;
  };
  educationalTopics: Array<{
    title: string;
    description: string;
    relevance: string;
    topic: string;
  }>;
}

export function DataAnalysisView({ dataPoint, context, onBack, onLearnMore }: DataAnalysisProps) {
  const { user } = useUser();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchAnalysis();
    }
  }, [user?.uid, dataPoint, context]);

  const fetchAnalysis = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/progressive-disclosure/data-analysis/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPoint, context })
      });
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDataPointTitle = () => {
    switch (dataPoint) {
      case 'total_hours':
        return `${context.category.replace('_', ' ')} Analysis`;
      case 'recent_entry':
        return `Entry from ${context.entry.date}`;
      case 'insight':
        return 'Professional Insight Analysis';
      default:
        return 'Data Analysis';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-full" />
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
          <h1 className="text-xl font-bold text-foreground">{getDataPointTitle()}</h1>
          <p className="text-sm text-muted-foreground">
            Personal data analysis and professional insights
          </p>
        </div>
      </div>

      {/* Main Analysis Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Your Data Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataPoint === 'total_hours' && (
            <div className="text-3xl font-bold text-foreground">
              {context.value} hours
              <Badge className="ml-3" variant={context.trend === 'up' ? 'default' : 'secondary'}>
                {context.trend}
              </Badge>
            </div>
          )}
          
          {dataPoint === 'recent_entry' && (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{context.entry.hours} hours</div>
              <div className="text-sm text-muted-foreground">
                Logged on {context.entry.date}
              </div>
              {context.entry.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{context.entry.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert">
            <p>{analysis?.personalAnalysis}</p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Benchmark */}
      {analysis?.benchmarks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Progress Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Progress</span>
              <span className="text-sm text-muted-foreground">
                {analysis.benchmarks.current} / {analysis.benchmarks.target}
              </span>
            </div>
            <Progress value={analysis.benchmarks.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              You're {analysis.benchmarks.progress}% toward your licensing requirements
            </p>
          </CardContent>
        </Card>
      )}

      {/* Patterns Identified */}
      {analysis?.patterns && analysis.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Patterns in Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.patterns.map((pattern, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-purple-900 dark:text-purple-100">{pattern}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Professional Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Content Links */}
      {analysis?.educationalTopics && analysis.educationalTopics.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <BookOpen className="h-5 w-5" />
              Learn More About This
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.educationalTopics.map((topic, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                onClick={() => onLearnMore(topic.topic, { ...topic, dataPoint, context })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {topic.title}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      {topic.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {topic.relevance}
                    </Badge>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-blue-600 mt-1 flex-shrink-0" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}