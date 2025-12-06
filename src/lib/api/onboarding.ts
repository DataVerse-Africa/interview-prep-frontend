import { apiClient } from './client';

export interface OnboardingPayload {
  role: string;
  preparation_time_days: number;
  resume_file?: File | null;
  resume_id?: string | null;  // ID of existing resume to use
  session_id?: string | null;  // ID of session to configure
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
  // POST /api/onboarding/ - user_id from JWT
  startOnboarding: async (
    payload: OnboardingPayload
  ): Promise<OnboardingResponse> => {
    const formData = new FormData();
    formData.append('role', payload.role);
    formData.append('preparation_time_days', String(payload.preparation_time_days));

    if (payload.resume_file) {
      formData.append('resume_file', payload.resume_file);
    }
    if (payload.resume_id) {
      formData.append('resume_id', payload.resume_id);
    }
    if (payload.session_id) {
      formData.append('session_id', payload.session_id);
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

    // Debug: Log all form data entries
    console.log('[OnboardingAPI] Sending FormData:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
    });

    return apiClient.postFormData<OnboardingResponse>(
      `/api/onboarding`,
      formData
    );
  },

  // GET /api/onboarding/records - user_id from JWT
  listOnboardingRecords: async (): Promise<OnboardingRecordPayload[]> => {
    return apiClient.get<OnboardingRecordPayload[]>(`/api/onboarding/records`);
  },

  // GET /api/onboarding/latest - user_id from JWT
  getLatestOnboardingRecord: async (): Promise<OnboardingRecordPayload> => {
    return apiClient.get<OnboardingRecordPayload>(`/api/onboarding/latest`);
  },

  // GET /api/onboarding/sessions - user_id from JWT
  getSessions: async (): Promise<any[]> => {
    return apiClient.get<any[]>(`/api/onboarding/sessions`);
  },
};


