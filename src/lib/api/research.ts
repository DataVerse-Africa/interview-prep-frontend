import { apiClient } from './client';

export const researchApi = {
  // GET /api/research/sessions/{session_id}/topics - user_id from JWT
  getResearchTopics: async (sessionId: string): Promise<any> => {
    return apiClient.get<any>(`/api/research/sessions/${sessionId}/topics`);
  },

  // POST /api/research/sessions/{session_id} - user_id from JWT
  runResearchWorkflow: async (sessionId: string): Promise<any> => {
    return apiClient.post<any>(`/api/research/sessions/${sessionId}`, {});
  },

  // GET /api/research/sessions/{session_id}/results - user_id from JWT
  getResearchResults: async (
    sessionId: string,
    limit: number = 5
  ): Promise<any> => {
    return apiClient.get<any>(`/api/research/sessions/${sessionId}/results`, {
      limit,
    });
  },
};
