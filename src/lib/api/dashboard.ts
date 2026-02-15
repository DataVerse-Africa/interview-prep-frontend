import { apiClient } from './client';

export interface SessionSummary {
  session_id: string;
  id?: string;
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
    return (response.sessions || []).map((session: any) => ({
      ...session,
      session_id: session.session_id || session.id,
    }));
  },

  // GET /api/sessions/{session_id} - user_id from JWT (updated endpoint)
  getSessionDetails: async (sessionId: string): Promise<any> => {
    return apiClient.get<any>(`/api/sessions/${sessionId}`);
  },

  // Backend does not currently expose /api/dashboard/* endpoints.
  // Return null to avoid guaranteed 404s until those routes exist.
  getUserPerformance: async (): Promise<any> => {
    return null;
  },

  getUserProgress: async (): Promise<any> => {
    return null;
  },

  getUserInsights: async (): Promise<any> => {
    return null;
  },

  getTimeAnalytics: async (): Promise<any> => {
    return null;
  },

  getTopicAnalytics: async (topicName: string): Promise<any> => {
    void topicName;
    return null;
  },
};
