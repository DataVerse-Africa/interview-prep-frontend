import { apiClient } from './client';

export interface OnboardingPayload {
  role: string;
  preparation_time_days: number;
  resume_file?: File | null;
  job_description_file?: File | null;
  job_description_text?: string | null;
  notes?: string | null;
}

export interface OnboardingResponse {
  status: string;
  user_id: string;
  session_id?: string | null;
  documents: Record<string, any>;
  resume_uri?: string | null;
  job_description_uri?: string | null;
}

export interface OnboardingRecordPayload {
  id: string;
  user_id: string;
  role: string;
  preparation_time_days: number;
  resume_uri?: string | null;
  job_description_uri?: string | null;
  notes?: string | null;
  documents: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const onboardingApi = {
  startOnboarding: async (
    userId: string,
    payload: OnboardingPayload
  ): Promise<OnboardingResponse> => {
    const formData = new FormData();
    formData.append('role', payload.role);
    formData.append('preparation_time_days', String(payload.preparation_time_days));
    
    if (payload.resume_file) {
      formData.append('resume_file', payload.resume_file);
    }
    if (payload.job_description_file) {
      formData.append('job_description_file', payload.job_description_file);
    }
    if (payload.job_description_text) {
      formData.append('job_description_text', payload.job_description_text);
    }
    if (payload.notes) {
      formData.append('notes', payload.notes);
    }

    return apiClient.postFormData<OnboardingResponse>(
      `/api/onboarding/${userId}`,
      formData
    );
  },

  listOnboardingRecords: async (userId: string): Promise<OnboardingRecordPayload[]> => {
    return apiClient.get<OnboardingRecordPayload[]>(`/api/onboarding/${userId}`);
  },

  getLatestOnboardingRecord: async (userId: string): Promise<OnboardingRecordPayload> => {
    return apiClient.get<OnboardingRecordPayload>(`/api/onboarding/${userId}/latest`);
  },
};


