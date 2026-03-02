import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  ArrowRight,
  X
} from "lucide-react";
import { ClickableAIInsightCard } from './ClickableAIInsightCard';

interface SmartInsight {
  id: string;
  type: 'pattern_alert' | 'growth_observation' | 'supervision_prep' | 'milestone';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionUrl?: string;
  canDismiss: boolean;
  createdAt: Date;
}

export function SmartInsightsCard() {
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  // Fetch enhanced smart insights from Clinical Intelligence Platform
  const { data: insights, isLoading } = useQuery<SmartInsight[]>({
    queryKey: ['/api/ai/enhanced-smart-insights', 'demo-user'],
    refetchInterval: 30000, // Check for new insights every 30 seconds
  });

  const activeInsights = insights?.filter(insight => 
    !dismissedInsights.includes(insight.id)
  ) || [];

  const handleDismiss = (insightId: string) => {
    setDismissedInsights(prev => [...prev, insightId]);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern_alert': return AlertCircle;
      case 'growth_observation': return TrendingUp;
      case 'supervision_prep': return Users;
      case 'milestone': return CheckCircle;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type: string, urgency: string) => {
    if (urgency === 'high') return 'border-l-red-500 bg-red-50';
    if (type === 'growth_observation') return 'border-l-green-500 bg-green-50';
    if (type === 'supervision_prep') return 'border-l-blue-500 bg-blue-50';
    if (type === 'milestone') return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-gray-500 bg-gray-50';
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm text-gray-600">Analyzing your progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeInsights.length === 0) {
    return null; // Don't show the card if no insights
  }

  const cardContent = (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-black font-bold">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeInsights.slice(0, 3).map((insight) => {
          const Icon = getInsightIcon(insight.type);
          
          return (
            <div
              key={insight.id}
              className={`border-l-4 rounded-lg p-4 ${getInsightColor(insight.type, insight.urgency)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="h-4 w-4 mt-0.5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-black text-sm mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {insight.message}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {insight.urgency === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Needs attention
                        </Badge>
                      )}
                      {insight.actionUrl && (
                        <Link href={insight.actionUrl}>
                          <Button variant="outline" size="sm" className="text-xs">
                            {insight.actionLabel || 'View details'}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                
                {insight.canDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(insight.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        
        {activeInsights.length > 3 && (
          <div className="pt-2 border-t">
            <Link href="/intelligence-hub">
              <Button variant="ghost" className="w-full text-sm">
                <Lightbulb className="h-4 w-4 mr-2" />
                View all insights ({activeInsights.length})
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ClickableAIInsightCard 
      category="ai_insights" 
      value={activeInsights.length}
    >
      {cardContent}
    </ClickableAIInsightCard>
  );
}