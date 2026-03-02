import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Lightbulb, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface UsageStats {
  used: number;
  remaining: number;
  limit: number;
  resetTime: string;
}

interface UsageStatsProps {
  className?: string;
  compact?: boolean;
}

export function UsageStats({ className = '', compact = false }: UsageStatsProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/ai/usage-stats/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user?.uid]);

  useEffect(() => {
    if (!stats?.resetTime) return;

    const updateTimeUntilReset = () => {
      const now = new Date();
      const reset = new Date(stats.resetTime);
      const diff = reset.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('Resetting soon...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilReset(`${minutes}m`);
      }
    };

    updateTimeUntilReset();
    const interval = setInterval(updateTimeUntilReset, 60000);

    return () => clearInterval(interval);
  }, [stats?.resetTime]);

  if (!stats) return null;

  const usagePercentage = (stats.used / stats.limit) * 100;
  const isLimitReached = stats.remaining === 0;
  const isNearLimit = usagePercentage > 80;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-1">
          {isLimitReached ? (
            <Lightbulb className="h-4 w-4 text-amber-500" />
          ) : (
            <Zap className="h-4 w-4 text-blue-500" />
          )}
          <span className="text-gray-600 dark:text-gray-400">
            {stats.remaining} AI messages left
          </span>
        </div>
        {isLimitReached && (
          <Badge variant="secondary" className="text-xs">
            Knowledge Base Active
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-blue-500" />
          AI Usage Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Messages Used</span>
            <span className="font-medium">{stats.used} / {stats.limit}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${isNearLimit ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Remaining</span>
            </div>
            <div className="font-medium text-blue-600 dark:text-blue-400">
              {stats.remaining}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Resets in</span>
            </div>
            <div className="font-medium text-gray-700 dark:text-gray-300">
              {timeUntilReset}
            </div>
          </div>
        </div>

        {isLimitReached && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Knowledge Base Active
                </div>
                <div className="text-amber-700 dark:text-amber-300">
                  Dinger is now using the comprehensive counseling knowledge base with expert theories and techniques.
                </div>
              </div>
            </div>
          </div>
        )}

        {isNearLimit && !isLimitReached && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Approaching Daily Limit
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  When your AI messages are used up, Dinger will seamlessly switch to the expert counseling knowledge base.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}