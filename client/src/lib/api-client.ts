/**
 * Enhanced API client with error handling, timeouts, and retry logic
 */

export interface ApiError extends Error {
  status?: number;
  code?: string;
  retryAfter?: number;
  details?: any;
}

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      signal,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    // Create timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
    
    // Combine timeout signal with any provided signal
    const combinedSignal = signal ? this.combineSignals([signal, timeoutController.signal]) : timeoutController.signal;

    const requestOptions: RequestInit = {
      ...fetchOptions,
      signal: combinedSignal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...fetchOptions.headers,
      },
    };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await this.handleErrorResponse(response);
          
          // Don't retry on client errors (4xx), except for 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }
          
          lastError = error;
          
          // If we have retries left and this is a retryable error
          if (attempt < retries && this.isRetryableError(response.status)) {
            await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }
          
          throw error;
        }

        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          return await response.json();
        }
        
        return await response.text() as T;
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof DOMException && error.name === 'AbortError') {
          const timeoutError: ApiError = new Error(
            signal?.aborted ? 'Request was cancelled' : 'Request timed out'
          );
          timeoutError.code = 'TIMEOUT';
          throw timeoutError;
        }
        
        if (error instanceof Error && 'status' in error) {
          lastError = error as ApiError;
          
          // Only retry on network errors or 5xx errors
          if (attempt < retries && (error as ApiError).status === undefined) {
            await this.delay(retryDelay * (attempt + 1));
            continue;
          }
        }
        
        throw error;
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private async handleErrorResponse(response: Response): Promise<ApiError> {
    const error: ApiError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;

    try {
      const errorData = await response.json();
      error.message = errorData.message || errorData.error || error.message;
      error.code = errorData.code;
      error.details = errorData.details;
      error.retryAfter = errorData.retryAfter;
    } catch {
      // If we can't parse the error response, use the default message
    }

    return error;
  }

  private isRetryableError(status?: number): boolean {
    if (!status) return true; // Network errors are retryable
    
    return (
      status === 429 || // Rate limit
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504    // Gateway Timeout
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private combineSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    
    return controller.signal;
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create default client instance
export const apiClient = new ApiClient();

// Export convenience functions that use the default client
export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) => apiClient.get<T>(endpoint, options),
  post: <T>(endpoint: string, data?: any, options?: ApiRequestOptions) => apiClient.post<T>(endpoint, data, options),
  put: <T>(endpoint: string, data?: any, options?: ApiRequestOptions) => apiClient.put<T>(endpoint, data, options),
  patch: <T>(endpoint: string, data?: any, options?: ApiRequestOptions) => apiClient.patch<T>(endpoint, data, options),
  delete: <T>(endpoint: string, options?: ApiRequestOptions) => apiClient.delete<T>(endpoint, options),
};

// Enhanced fetch wrapper for React Query
export async function apiRequest<T = any>(
  url: string, 
  config: RequestInit & ApiRequestOptions = {}
): Promise<T> {
  return apiClient.request<T>(url, config);
}

// Error classification utilities
export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && 
    (error.name === 'TypeError' || (error as ApiError).code === 'TIMEOUT');
}

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const apiError = error as ApiError;
  return (
    isNetworkError(error) ||
    apiError.status === 429 ||
    apiError.status === 502 ||
    apiError.status === 503 ||
    apiError.status === 504
  );
}

export function isClientError(error: unknown): boolean {
  return error instanceof Error && 
    typeof (error as ApiError).status === 'number' &&
    (error as ApiError).status! >= 400 && 
    (error as ApiError).status! < 500;
}

export function isServerError(error: unknown): boolean {
  return error instanceof Error && 
    typeof (error as ApiError).status === 'number' &&
    (error as ApiError).status! >= 500;
}