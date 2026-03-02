import { useState } from 'react';
import { MetricDetailView } from '../progressive-disclosure/MetricDetailView';
import { DataAnalysisView } from '../progressive-disclosure/DataAnalysisView';
import { EducationalContentView } from '../progressive-disclosure/EducationalContentView';
import { useUser } from '@/lib/firebase';
import { useLocation } from 'wouter';

interface ClickableMetricCardProps {
  children: React.ReactNode;
  category: string;
  value: number;
  className?: string;
}

type NavigationState = {
  level: 'overview' | 'detail' | 'analysis' | 'education';
  dataPoint?: string;
  context?: any;
  topic?: string;
};

export function ClickableMetricCard({ 
  children, 
  category, 
  value, 
  className = "" 
}: ClickableMetricCardProps) {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [navigation, setNavigation] = useState<NavigationState>({ level: 'overview' });

  const handleCardClick = () => {
    if (user?.uid) {
      // Special handling for supervision network - navigate to supervisors page
      if (category === 'supervision_network') {
        setLocation('/supervisors');
        return;
      }
      setNavigation({ level: 'detail' });
    }
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

  // Overview Level - Your existing beautiful component
  if (navigation.level === 'overview') {
    return (
      <div 
        className={`cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
        onClick={handleCardClick}
      >
        {children}
      </div>
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