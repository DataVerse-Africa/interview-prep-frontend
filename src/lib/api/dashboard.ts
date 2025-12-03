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
  getUserSessions: async (userId: string): Promise<SessionSummary[]> => {
    return apiClient.get<SessionSummary[]>(`/api/dashboard/users/${userId}/sessions`);
  },

  getSessionDetails: async (userId: string, sessionId: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/users/${userId}/sessions/${sessionId}`);
  },

  getUserPerformance: async (userId: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/users/${userId}/performance`);
  },

  getUserProgress: async (userId: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/users/${userId}/progress`);
  },

  getUserInsights: async (userId: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/users/${userId}/insights`);
  },

  getTimeAnalytics: async (userId: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/users/${userId}/time-analytics`);
  },

  getTopicAnalytics: async (userId: string, topicName: string): Promise<any> => {
    return apiClient.get<any>(`/api/dashboard/users/${userId}/topic-analytics/${topicName}`);
  },
};


