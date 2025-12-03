
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://interview-prep-api.dataverseafrica.org';

export interface ApiError {
  error: string;
  message: string;
  detail?: any;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public data: ApiError
  ) {
    super(data.message || 'API request failed');
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  setAdminToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('admin_token', token);
        // Use admin token for requests
        this.token = token;
      } else {
        localStorage.removeItem('admin_token');
      }
    }
  }

  getAdminToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Check for admin token first, then regular token
    const adminToken = this.getAdminToken();
    const tokenToUse = adminToken || this.token;
    
    if (tokenToUse) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${tokenToUse}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear token and user data
      this.setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_data');
        // Dispatch event to notify auth context
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw new ApiClientError(401, {
        error: 'unauthorized',
        message: 'Session expired. Please sign in again.',
      });
    }

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: 'unknown_error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw new ApiClientError(response.status, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | null>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
    };
    
    if (data && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }
    
    return this.request<T>(endpoint, options);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: 'unknown_error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw new ApiClientError(response.status, errorData);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }
}

export const apiClient = new ApiClient();

