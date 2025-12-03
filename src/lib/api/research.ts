import { apiClient } from './client';

export const researchApi = {
  getResearchTopics: async (userId: string, sessionId: string): Promise<any> => {
    return apiClient.get<any>(`/api/research/${userId}/sessions/${sessionId}/topics`);
  },

  runResearchWorkflow: async (userId: string, sessionId: string): Promise<any> => {
    return apiClient.post<any>(`/api/research/${userId}/sessions/${sessionId}`, {});
  },

  getResearchResults: async (
    userId: string,
    sessionId: string,
    limit: number = 5
  ): Promise<any> => {
    return apiClient.get<any>(`/api/research/${userId}/sessions/${sessionId}/results`, {
      limit,
    });
  },
};

