import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { MetricDetailView } from './MetricDetailView';
import { DataAnalysisView } from './DataAnalysisView';
import { EducationalContentView } from './EducationalContentView';

interface ProgressiveMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  category: string;
  userId: string;
  className?: string;
}

type NavigationState = {
  level: 'overview' | 'detail' | 'analysis' | 'education';
  dataPoint?: string;
  context?: any;
  topic?: string;
};

export function ProgressiveMetricCardNew({ 
  title, 
  value, 
  subtitle, 
  category, 
  userId, 
  className = "" 
}: ProgressiveMetricCardProps) {
  const [navigation, setNavigation] = useState<NavigationState>({ level: 'overview' });

  const handleCardClick = () => {
    setNavigation({ level: 'detail' });
  };

  const handleBack = () => {
    if (navigation.level === 'detail') {
      setNavigation({ level: 'overview' });
    } else if (navigation.level === 'analysis') {
      setNavigation({ level: 'detail' });
    } else if (navigation.level === 'education') {
      setNavigation({ level: 'analysis', dataPoint: navigation.dataPoint, context: navigation.context });
    }
  };

  const handleDrillDown = (dataPoint: string, context: any) => {
    setNavigation({ level: 'analysis', dataPoint, context });
  };

  const handleLearnMore = (topic: string, context: any) => {
    setNavigation({ level: 'education', topic, context, dataPoint: navigation.dataPoint });
  };

  // Overview Level - Simple metric card
  if (navigation.level === 'overview') {
    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${className}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
              <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detail Level - Detailed metrics view
  if (navigation.level === 'detail') {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <MetricDetailView
            category={category}
            onBack={handleBack}
            onDrillDown={handleDrillDown}
          />
        </div>
      </div>
    );
  }

  // Analysis Level - Data point analysis
  if (navigation.level === 'analysis') {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <DataAnalysisView
            dataPoint={navigation.dataPoint!}
            context={navigation.context}
            onBack={handleBack}
            onLearnMore={handleLearnMore}
          />
        </div>
      </div>
    );
  }

  // Education Level - Full educational content
  if (navigation.level === 'education') {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <EducationalContentView
            topic={navigation.topic!}
            context={navigation.context}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  return null;
}