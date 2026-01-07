import { apiClient } from './client';

export interface AdminStats {
  total_users: number;
  total_sessions: number;
  total_questions: number;
  active_users: number;
}

export interface AdminSystemStats {
  total_users: number;
  total_sessions: number;
  total_questions: number;
  active_users: number;
  total_answers: number;
  average_score: number;
  total_practice_days: number;
  total_streaks: number;
}

export interface UserActivityStats {
  user_id: string;
  email: string;
  created_at: string;
  last_login?: string | null;
  is_active: boolean;
  total_sessions: number;
  total_questions_answered: number;
  average_score: number;
  current_streak: number;
  longest_streak: number;
  total_practice_days: number;
}

export interface UserListResponse {
  users: UserActivityStats[];
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

export interface QuestionPerformanceStats {
  question_id: string;
  question_text: string;
  topic: string;
  difficulty: string;
  times_answered: number;
  average_score: number;
  correct_rate: number;
}

export interface TopicAnalytics {
  topic: string;
  total_questions: number;
  times_answered: number;
  average_score: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface RoleAnalytics {
  role: string;
  user_count: number;
  total_sessions: number;
  average_score: number;
  most_common_topics: string[];
}

export interface KeywordAnalytics {
  keyword: string;
  frequency: number;
  associated_roles: string[];
  trend: 'up' | 'down' | 'stable';
}

export interface PeakUsageAnalytics {
  peak_hour: number;
  peak_day: string;
  hourly_distribution: Array<{ hour: number; count: number }>;
  daily_distribution: Array<{ day: string; count: number }>;
}

export interface SystemHealthMetrics {
  database_status: 'healthy' | 'degraded' | 'down';
  api_response_time_ms: number;
  active_connections: number;
  error_rate: number;
  uptime_seconds: number;
}

export interface AdminDashboardCharts {
  user_growth: Array<{ date: string; count: number }>;
  session_activity: Array<{ date: string; count: number }>;
  score_distribution: Array<{ range: string; count: number }>;
  topic_popularity: Array<{ topic: string; count: number }>;
  role_distribution: Array<{ role: string; count: number }>;
}

export interface AdminUserDetails {
  user_id: string;
  email: string;
  created_at: string;
  last_login?: string | null;
  is_active: boolean;
  total_sessions: number;
  total_questions_answered: number;
  average_score: number;
  current_streak: number;
  longest_streak: number;
  total_practice_days: number;
  sessions: Array<{
    session_id: string;
    session_name: string;
    role: string;
    status: string;
    created_at: string;
    total_questions: number;
    answered_questions: number;
    average_score: number;
  }>;
}

export interface UserSessionAnalytics {
  user_id: string;
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_questions: number;
  answered_questions: number;
  average_score: number;
  current_streak: number;
  longest_streak: number;
  sessions: Array<{
    session_id: string;
    session_name: string;
    role: string;
    status: string;
    created_at: string;
    total_questions: number;
    answered_questions: number;
    average_score: number;
  }>;
}

export const adminApi = {
  login: async (email: string, password: string): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/api/admin/login', {
      email,
      password,
    });
    if (response.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', response.access_token);
      }
    }
    return response;
  },

  // Get admin dashboard summary
  getSummary: async (): Promise<AdminSystemStats> => {
    return apiClient.get<AdminSystemStats>('/api/admin/summary');
  },

  // Get admin dashboard statistics (alias for getSummary)
  getStats: async (): Promise<AdminStats> => {
    const summary = await apiClient.get<AdminSystemStats>('/api/admin/summary');
    return {
      total_users: summary.total_users,
      total_sessions: summary.total_sessions,
      total_questions: summary.total_questions,
      active_users: summary.active_users,
    };
  },

  // Get list of users with activity stats
  getUsers: async (
    page: number = 1,
    pageSize: number = 50,
    statusFilter?: string
  ): Promise<UserListResponse> => {
    const params: Record<string, string> = {
      limit: pageSize.toString(),
      offset: ((page - 1) * pageSize).toString(),
    };
    if (statusFilter) {
      params.status_filter = statusFilter;
    }
    return apiClient.get<UserListResponse>('/api/admin/users', params);
  },

  // Get user details
  getUserDetails: async (userId: string): Promise<AdminUserDetails> => {
    return apiClient.get<AdminUserDetails>(`/api/admin/users/${userId}`);
  },

  // Get user session analytics
  getUserSessionAnalytics: async (userId: string): Promise<UserSessionAnalytics> => {
    return apiClient.get<UserSessionAnalytics>(`/api/admin/users/${userId}/sessions`);
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

  // Block user
  blockUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/api/admin/users/${userId}/block`, {});
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/api/admin/users/${userId}/unblock`, {});
  },

  // Question Performance Analytics
  getQuestionAnalytics: async (
    limit: number = 50,
    difficultyFilter?: string,
    topicFilter?: string
  ): Promise<QuestionPerformanceStats[]> => {
    const params: Record<string, string> = {
      limit: limit.toString(),
    };
    if (difficultyFilter) {
      params.difficulty_filter = difficultyFilter;
    }
    if (topicFilter) {
      params.topic_filter = topicFilter;
    }
    return apiClient.get<QuestionPerformanceStats[]>('/api/admin/analytics/questions', params);
  },

  // Topic Analytics
  getTopicAnalytics: async (): Promise<TopicAnalytics[]> => {
    return apiClient.get<TopicAnalytics[]>('/api/admin/analytics/topics');
  },

  // Role Analytics
  getRoleAnalytics: async (): Promise<RoleAnalytics[]> => {
    return apiClient.get<RoleAnalytics[]>('/api/admin/analytics/roles');
  },

  // Keyword Analytics
  getKeywordAnalytics: async (): Promise<KeywordAnalytics[]> => {
    return apiClient.get<KeywordAnalytics[]>('/api/admin/analytics/keywords');
  },

  // Peak Usage Analytics
  getPeakUsageAnalytics: async (): Promise<PeakUsageAnalytics> => {
    return apiClient.get<PeakUsageAnalytics>('/api/admin/analytics/peak-usage');
  },

  // Dashboard Charts
  getDashboardCharts: async (): Promise<AdminDashboardCharts> => {
    return apiClient.get<AdminDashboardCharts>('/api/admin/analytics/charts');
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealthMetrics> => {
    return apiClient.get<SystemHealthMetrics>('/api/admin/system/health');
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
