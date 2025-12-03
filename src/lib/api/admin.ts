import { apiClient } from './client';

export interface AdminStats {
  total_users: number;
  total_sessions: number;
  total_questions: number;
  active_users: number;
}

export interface UserListResponse {
  users: Array<{
    user_id: string;
    email: string;
    created_at: string;
    last_login?: string | null;
    is_active: boolean;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export interface SessionListResponse {
  sessions: Array<{
    id: string;
    user_id: string;
    session_name: string;
    created_at: string;
    status: string;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export interface AdminLoginResponse {
  access_token: string;
  admin: {
    admin_id: string;
    email: string;
  };
}

export const adminApi = {
  // Admin login
  login: async (email: string, password: string): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/api/admin/login', {
      email,
      password,
    });
    if (response.access_token) {
      // Store admin token separately
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', response.access_token);
      }
    }
    return response;
  },

  // Get admin dashboard statistics
  getStats: async (): Promise<AdminStats> => {
    return apiClient.get<AdminStats>('/api/admin/summary');
  },

  // Get list of users
  getUsers: async (page: number = 1, pageSize: number = 20): Promise<UserListResponse> => {
    return apiClient.get<UserListResponse>('/api/admin/users', {
      page: page.toString(),
      page_size: pageSize.toString(),
    });
  },

  // Get user details
  getUserDetails: async (userId: string): Promise<any> => {
    return apiClient.get<any>(`/api/admin/users/${userId}`);
  },

  // Get list of sessions
  getSessions: async (page: number = 1, pageSize: number = 20): Promise<SessionListResponse> => {
    return apiClient.get<SessionListResponse>('/api/admin/sessions', {
      page: page.toString(),
      page_size: pageSize.toString(),
    });
  },

  // Get session details
  getSessionDetails: async (sessionId: string): Promise<any> => {
    return apiClient.get<any>(`/api/admin/sessions/${sessionId}`);
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/api/admin/users/${userId}/delete`, {});
  },

  // Block user
  blockUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/api/admin/users/${userId}/block`, {});
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/api/admin/users/${userId}/unblock`, {});
  },

  // Get admin token
  getAdminToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  },

  // Clear admin token
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  },
};

