import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, BookOpen, TrendingUp, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UserProgressInsight, EducationalContent } from '@shared/schema';

interface ProgressiveMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  category: string;
  userId: string;
  className?: string;
}

interface DisclosureLevel {
  level: number;
  title: string;
  content: React.ReactNode;
}

export function ProgressiveMetricCard({ 
  title, 
  value, 
  subtitle, 
  category, 
  userId, 
  className = "" 
}: ProgressiveMetricCardProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [insights, setInsights] = useState<UserProgressInsight[]>([]);
  const [educationalContent, setEducationalContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(false);

  const trackInteraction = async (componentType: string, interactionType: 'click' | 'drill_down' | 'educational_view', level: number) => {
    try {
      await fetch('/api/progressive-disclosure/track-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          componentType,
          interactionType,
          level,
          metadata: { category, title }
        })
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/progressive-disclosure/insights/${userId}?category=${category}&limit=5`);
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationalContent = async (level: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/progressive-disclosure/educational-content/${category}?level=${level}&targetAudience=lac`);
      const data = await response.json();
      setEducationalContent(data.content || []);
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = async () => {
    const nextLevel = currentLevel + 1;
    await trackInteraction(`${category}_card`, 'drill_down', nextLevel);
    
    if (nextLevel === 1) {
      await fetchInsights();
    } else if (nextLevel === 2) {
      await fetchEducationalContent();
      await trackInteraction(`${category}_card`, 'educational_view', nextLevel);
    }
    
    setCurrentLevel(nextLevel);
  };

  const handleBack = () => {
    setCurrentLevel(Math.max(0, currentLevel - 1));
  };

  const disclosureLevels: DisclosureLevel[] = [
    {
      level: 0,
      title: 'Metric Overview',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{value}</div>
            {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
          </div>
          
          <Button 
            onClick={handleDrillDown}
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Progress Insights
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
      )
    },
    {
      level: 1,
      title: 'Progress Context',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-foreground">{value}</div>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">Loading insights...</div>
          ) : (
            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{insight.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={insight.priority >= 3 ? 'default' : 'secondary'} className="text-xs">
                            {insight.insightType}
                          </Badge>
                          {insight.priority >= 3 && <Target className="h-3 w-3 text-orange-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  No insights available yet. Keep logging your progress!
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleBack} variant="outline" size="sm" className="flex-1">
              Back
            </Button>
            <Button onClick={handleDrillDown} variant="outline" size="sm" className="flex-1" disabled={loading}>
              <BookOpen className="h-4 w-4 mr-2" />
              Learn More
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </div>
      )
    },
    {
      level: 2,
      title: 'Educational Resources',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">{title}</div>
            <div className="text-sm text-muted-foreground">Educational Content</div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">Loading content...</div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {educationalContent.length > 0 ? (
                educationalContent.map((content) => (
                  <div key={content.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{content.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {content.contentType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                      {content.content.split('\n').map((paragraph, idx) => {
                        if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith(':**')) {
                          return <h5 key={idx} className="font-semibold mt-3 mb-1 text-foreground">{paragraph.replace(/\*\*/g, '')}</h5>;
                        }
                        if (paragraph.trim().startsWith('- ')) {
                          return <li key={idx} className="ml-4">{paragraph.substring(2)}</li>;
                        }
                        return paragraph.trim() ? <p key={idx} className="mb-2">{paragraph}</p> : null;
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  Educational content will be available soon.
                </div>
              )}
            </div>
          )}

          <Button onClick={handleBack} variant="outline" size="sm" className="w-full">
            Back to Insights
          </Button>
        </div>
      )
    }
  ];

  const currentLevelData = disclosureLevels[currentLevel];

  return (
    <Card className={`transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {currentLevelData.title}
        </CardTitle>
        {currentLevel === 0 && (
          <div className="text-sm text-muted-foreground">{title}</div>
        )}
      </CardHeader>
      <CardContent>
        {currentLevelData.content}
      </CardContent>
    </Card>
  );
}