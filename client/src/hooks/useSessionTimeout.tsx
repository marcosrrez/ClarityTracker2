import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
  user?: any; // Pass user from AuthContext
  logout?: () => Promise<void>; // Pass logout function from AuthContext
}

export const useSessionTimeout = ({
  timeoutMinutes = 20,
  warningMinutes = 2,
  onWarning,
  onTimeout,
  enabled = true,
  user,
  logout,
}: UseSessionTimeoutOptions = {}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Only set timers if user is logged in and feature is enabled
    if (!user || !enabled) {
      return;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    
    lastActivityRef.current = Date.now();

    // Set warning timer
    if (warningMs > 0 && onWarning) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, warningMs);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      try {
        if (logout) {
          await logout();
        }
        if (onTimeout) {
          onTimeout();
        }
      } catch (error) {
        console.error('Auto-logout failed:', error);
      }
    }, timeoutMs);
  }, [user, enabled, timeoutMinutes, warningMinutes, onWarning, onTimeout, logout]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if it's been more than 30 seconds since last activity
    // This prevents excessive timer resets
    if (timeSinceLastActivity > 30000) {
      resetTimers();
    }
  }, [resetTimers]);

  // Activity event listeners
  useEffect(() => {
    if (!user || !enabled) {
      return;
    }

    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add throttled event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timers
    resetTimers();

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, enabled, handleActivity, resetTimers]);

  // Reset timers when user logs in
  useEffect(() => {
    if (user && enabled) {
      resetTimers();
    }
  }, [user, enabled, resetTimers]);

  return {
    resetTimers,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
      return Math.max(0, remaining);
    },
    getLastActivity: () => lastActivityRef.current,
  };
};