/**
 * User Experience Monitoring and Performance Tracking
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'keyboard' | 'navigation' | 'error';
  element?: string;
  page: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private sessionId: string;
  private userId?: string;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring() {
    // Track page load performance
    this.trackPagePerformance();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track JavaScript errors
    this.trackErrors();
    
    // Track network performance
    this.trackNetworkMetrics();
    
    // Periodic metrics collection
    this.startPeriodicCollection();
  }

  private trackPagePerformance() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
            this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
            this.recordMetric('first_contentful_paint', this.getFirstContentfulPaint());
            this.recordMetric('time_to_interactive', this.getTimeToInteractive());
          }
        }, 100);
      });
    }
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  private getTimeToInteractive(): number {
    // Simplified TTI calculation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.domInteractive - navigation.fetchStart : 0;
  }

  private trackUserInteractions() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.recordInteraction('click', {
        element: this.getElementSelector(target),
        page: window.location.pathname,
        x: event.clientX,
        y: event.clientY
      });
    });

    // Track scrolling
    let scrollTimeout: number | null = null;
    let scrollStart = Date.now();
    
    document.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        const scrollDuration = Date.now() - scrollStart;
        this.recordInteraction('scroll', {
          page: window.location.pathname,
          scrollY: window.scrollY,
          duration: scrollDuration
        });
        scrollStart = Date.now();
      }, 150);
    });

    // Track page navigation
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - this.startTime;
      this.recordInteraction('navigation', {
        page: window.location.pathname,
        duration: timeOnPage,
        type: 'page_exit'
      });
      this.flushMetrics();
    });
  }

  private trackErrors() {
    window.addEventListener('error', (event) => {
      this.recordInteraction('error', {
        page: window.location.pathname,
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordInteraction('error', {
        page: window.location.pathname,
        type: 'promise_rejection',
        reason: String(event.reason)
      });
    });
  }

  private trackNetworkMetrics() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resource = entry as PerformanceResourceTiming;
              
              // Track API calls
              if (resource.name.includes('/api/')) {
                this.recordMetric('api_response_time', resource.responseEnd - resource.requestStart, {
                  endpoint: new URL(resource.name).pathname,
                  method: 'unknown', // Can't detect method from Performance API
                  size: resource.transferSize
                });
              }
            }
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  private startPeriodicCollection() {
    setInterval(() => {
      // Collect memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize);
        this.recordMetric('memory_total', memory.totalJSHeapSize);
      }

      // Flush metrics periodically
      if (this.metrics.length > 50 || this.interactions.length > 20) {
        this.flushMetrics();
      }
    }, 30000); // Every 30 seconds
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      metadata
    });
  }

  public recordInteraction(type: UserInteraction['type'], data: Partial<UserInteraction>) {
    this.interactions.push({
      type,
      page: window.location.pathname,
      timestamp: Date.now(),
      ...data
    });
  }

  public async flushMetrics() {
    if (this.metrics.length === 0 && this.interactions.length === 0) return;

    try {
      const payload = {
        sessionId: this.sessionId,
        userId: this.userId,
        metrics: [...this.metrics],
        interactions: [...this.interactions],
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timestamp: Date.now()
      };

      // Send to analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Clear local storage
      this.metrics = [];
      this.interactions = [];
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  public getSessionSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      metricsCount: this.metrics.length,
      interactionsCount: this.interactions.length
    };
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common measurements
export function measureAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = Date.now();
  
  return operation()
    .then((result) => {
      performanceMonitor.recordMetric(name, Date.now() - start, {
        ...metadata,
        status: 'success'
      });
      return result;
    })
    .catch((error) => {
      performanceMonitor.recordMetric(name, Date.now() - start, {
        ...metadata,
        status: 'error',
        error: error.message
      });
      throw error;
    });
}

export function measureSyncOperation<T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, any>
): T {
  const start = Date.now();
  
  try {
    const result = operation();
    performanceMonitor.recordMetric(name, Date.now() - start, {
      ...metadata,
      status: 'success'
    });
    return result;
  } catch (error) {
    performanceMonitor.recordMetric(name, Date.now() - start, {
      ...metadata,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}