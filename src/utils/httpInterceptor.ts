
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RequestConfig extends RequestInit {
  url: string;
  requiresAuth?: boolean;
  params?: Record<string, string>;
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

  private constructor() {}

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Makes an HTTP request with interceptor functionality
   */
  public async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const { url, requiresAuth = true, params, ...options } = config;
      
      // Build URL with query params if provided
      const finalUrl = params 
        ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}` 
        : url;

      // Clone headers to avoid modifying the original
      const headers = new Headers(options.headers || {});
      
      // Add auth token if required
      if (requiresAuth) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        } else {
          console.warn('Auth token required but not available');
          // Could redirect to login here
        }
      }

      // Set content type if not present and we have a body
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
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
            // Unauthorized - could trigger a sign out
            toast({
              title: "Authentication Error",
              description: "Your session has expired. Please login again.",
              variant: "destructive"
            });
            // Redirect to login or refresh token logic would go here
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
      console.error('Request error:', error);
      
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
  public async get<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url:`https://preprod-api.fandoro.com/${url}`, method: 'GET', headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` }  });
  }

  public async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url:`https://preprod-api.fandoro.com/${url}`, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` } 
    });
  }

  public async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url:`https://preprod-api.fandoro.com/${url}`, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined, 
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` }  
    });
  }

  public async delete<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url:`https://preprod-api.fandoro.com/${url}`, method: 'DELETE', headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` }  });
  }
}

// Export a singleton instance
export const http = HttpClient.getInstance();
