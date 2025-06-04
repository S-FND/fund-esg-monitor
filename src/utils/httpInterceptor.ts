
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { config } from "@/config";

interface RequestConfig extends RequestInit {
  url: string;
  requiresAuth?: boolean;
  params?: Record<string, string>;
  useApiUrl?: boolean;
}

interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * HTTP Client with interceptor capabilities for handling authentication and errors
 */
export class HttpClient {
  private static instance: HttpClient;
  private baseApiUrl: string;

  private constructor() {
    this.baseApiUrl = config.apiUrl;
    
    if (config.debug) {
      console.log(`HTTP Client initialized for ${config.environment} environment`);
      console.log(`Base API URL: ${this.baseApiUrl}`);
    }
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Makes an HTTP request with interceptor functionality
   */
  public async request<T = any>(requestConfig: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const { url, requiresAuth = true, params, useApiUrl = true, ...options } = requestConfig;
      
      // Build the final URL - use API base URL if useApiUrl is true and URL is relative
      let finalUrl = url;
      if (useApiUrl && !url.startsWith('http')) {
        finalUrl = `${this.baseApiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      
      // Add query params if provided
      if (params) {
        finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}`;
      }

      // Clone headers to avoid modifying the original
      const headers = new Headers(options.headers || {});
      
      // Add auth token if required
      if (requiresAuth) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        } else if (config.debug) {
          console.warn('Auth token required but not available');
        }
      }

      // Set content type if not present and we have a body
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (config.debug) {
        console.log(`Making ${options.method || 'GET'} request to: ${finalUrl}`);
      }

      // Make the request with modified headers
      const response = await fetch(finalUrl, {
        ...options,
        headers
      });

      // Handle HTTP error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle different error status codes
        switch (response.status) {
          case 401:
            toast({
              title: "Authentication Error",
              description: "Your session has expired. Please login again.",
              variant: "destructive"
            });
            break;
            
          case 403:
            toast({
              title: "Access Denied",
              description: "You don't have permission to access this resource.",
              variant: "destructive"
            });
            break;
            
          case 404:
            toast({
              title: "Not Found",
              description: "The requested resource was not found.",
              variant: "destructive"
            });
            break;
            
          case 500:
          case 502:
          case 503:
            toast({
              title: "Server Error",
              description: "Something went wrong on our end. Please try again later.",
              variant: "destructive"
            });
            break;
            
          default:
            toast({
              title: "Request Failed",
              description: errorData.message || `Error: ${response.status}`,
              variant: "destructive"
            });
        }
        
        return { 
          data: null, 
          error: new Error(errorData.message || `Request failed with status ${response.status}`) 
        };
      }

      // Parse response data
      const data = await response.json().catch(() => ({}));
      
      return { data, error: null };
      
    } catch (error) {
      // Handle network or other errors
      if (config.debug) {
        console.error('Request error:', error);
      }
      
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Please check your internet connection.",
        variant: "destructive"
      });
      
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  }

  // Convenience methods
  public async get<T = any>(url: string, requestConfig?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', ...requestConfig });
  }

  public async post<T = any>(url: string, data?: any, requestConfig?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...requestConfig 
    });
  }

  public async put<T = any>(url: string, data?: any, requestConfig?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined, 
      ...requestConfig 
    });
  }

  public async delete<T = any>(url: string, requestConfig?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', ...requestConfig });
  }
}

// Export a singleton instance
export const http = HttpClient.getInstance();
