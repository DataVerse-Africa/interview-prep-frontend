import { apiClient } from './client';

export interface SessionSummary {
  session_id: string;
  session_name?: string | null;
  created_at: string;
  status: string;
  total_days: number;
  completed_days: number;
  overall_completion_rate: number;
  average_score: number;
  last_activity?: string | null;
}

export const dashboardApi = {
  // GET /api/sessions - user_id from JWT (updated endpoint)
  getUserSessions: async (): Promise<SessionSummary[]> => {
    // New sessions endpoint returns { sessions: [], total: number }
    const response = await apiClient.get<{ sessions: SessionSummary[]; total: number }>(`/api/sessions`);
    return response.sessions;
  },

  // GET /api/sessions/{session_id} - user_id from JWT (updated endpoint)
  getSessionDetails: async (sessionId: string): Promise<any> => {
    return apiClient.get<any>(`/api/sessions/${sessionId}`);
  },

  // GET /api/dashboard/performance - user_id from JWT
  getUserPerformance: async (): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/performance`);
  },

  // GET /api/dashboard/progress - user_id from JWT
  getUserProgress: async (): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/progress`);
  },

  // GET /api/dashboard/insights - user_id from JWT
  getUserInsights: async (): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/insights`);
  },

  // GET /api/dashboard/time-analytics - user_id from JWT
  getTimeAnalytics: async (): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/time-analytics`);
  },

  // GET /api/dashboard/topic-analytics/{topic_name} - user_id from JWT
  getTopicAnalytics: async (topicName: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/topic-analytics/${topicName}`);
  },
};
