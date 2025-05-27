import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';

let sessionId: string | null = null;

// Generate session ID once per browser session
if (typeof window !== 'undefined' && !sessionId) {
  sessionId = sessionStorage.getItem('clarity-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('clarity-session-id', sessionId);
  }
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const lastPage = useRef<string>('');

  const trackEvent = async (event: string, page?: string, metadata?: any) => {
    if (!user || !sessionId) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          sessionId,
          event,
          page,
          metadata,
        }),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.debug('Analytics tracking failed:', error);
    }
  };

  const trackPageView = (page: string) => {
    if (lastPage.current !== page) {
      lastPage.current = page;
      trackEvent('page_view', page);
    }
  };

  const trackEntryAdded = (entryType: string, wordCount?: number) => {
    trackEvent('entry_added', 'add-entry', { entryType, wordCount });
  };

  const trackAIAnalysis = (analysisType: string, notesLength?: number) => {
    trackEvent('ai_analysis', 'ai-analysis', { analysisType, notesLength });
  };

  const trackFeatureUsed = (feature: string, page: string, metadata?: any) => {
    trackEvent('feature_used', page, { feature, ...metadata });
  };

  const trackSettingsChanged = (setting: string, value: any) => {
    trackEvent('settings_changed', 'settings', { setting, value });
  };

  const trackTimeSpent = (page: string, seconds: number) => {
    trackEvent('time_spent', page, { seconds });
  };

  return {
    trackEvent,
    trackPageView,
    trackEntryAdded,
    trackAIAnalysis,
    trackFeatureUsed,
    trackSettingsChanged,
    trackTimeSpent,
  };
};

// Hook for tracking page time
export const usePageTimeTracking = (pageName: string) => {
  const { trackTimeSpent } = useAnalytics();
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent > 5) { // Only track if user spent more than 5 seconds
        trackTimeSpent(pageName, timeSpent);
      }
    };
  }, [pageName, trackTimeSpent]);
};