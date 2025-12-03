import { apiClient } from './client';

export interface ApplicationSessionCreate {
  onboarding_id: string;
  session_name?: string | null;
  resume_uri?: string | null;
  job_description_uri?: string | null;
}

export interface ApplicationSessionResponse {
  id: string;
  user_id: string;
  onboarding_id: string;
  session_name?: string | null;
  resume_uri?: string | null;
  job_description_uri?: string | null;
  resume_version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DailyPlanResponse {
  id: string;
  user_id: string;
  session_id?: string | null;
  plan_date: string;
  questions: DailyQuestion[];
}

export interface DailyQuestion {
  id: string;
  question_data: Record<string, any>;
  difficulty: string;
  topic: string;
}

export const sessionsApi = {
  getDailyPlan: async (): Promise<DailyPlanResponse> => {
    return apiClient.get<DailyPlanResponse>('/api/sessions/today');
  },

  listApplicationSessions: async (): Promise<ApplicationSessionResponse[]> => {
    return apiClient.get<ApplicationSessionResponse[]>('/api/sessions/applications');
  },

  createApplicationSession: async (
    payload: ApplicationSessionCreate
  ): Promise<ApplicationSessionResponse> => {
    return apiClient.post<ApplicationSessionResponse>(
      '/api/sessions/applications',
      payload
    );
  },

  getApplicationSession: async (sessionId: string): Promise<ApplicationSessionResponse> => {
    return apiClient.get<ApplicationSessionResponse>(
      `/api/sessions/applications/${sessionId}`
    );
  },

  getLatestApplicationSession: async (): Promise<ApplicationSessionResponse> => {
    return apiClient.get<ApplicationSessionResponse>('/api/sessions/applications/latest');
  },
};


