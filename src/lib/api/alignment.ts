import { apiClient } from './client';

export interface AlignmentReportResponse {
  id: string;
  user_id: string;
  onboarding_id: string;
  overall_score: number;
  dimension_scores?: Record<string, number>;
  score_rationales?: Record<string, string>;
  matched_items?: any[];
  gaps?: any[];
  experience_analysis?: Record<string, any>;
  recommendations?: string[];
  raw_context?: Record<string, any>;
  metrics?: Record<string, any>;
  feature_summary?: Record<string, any>;
  resume_improvements?: string[];
  explanation: string;
  created_at: string;
}

export interface AlignmentSessionResponse {
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

export const alignmentApi = {
  generateAlignmentReport: async (
    userId: string,
    sessionId?: string | null
  ): Promise<AlignmentReportResponse> => {
    const endpoint = sessionId
      ? `/api/alignment/${userId}?session_id=${sessionId}`
      : `/api/alignment/${userId}`;
    return apiClient.post<AlignmentReportResponse>(endpoint, {});
  },

  getLatestAlignmentReport: async (
    userId: string,
    sessionId?: string | null
  ): Promise<AlignmentReportResponse> => {
    return apiClient.get<AlignmentReportResponse>(
      `/api/alignment/${userId}/latest`,
      { session_id: sessionId }
    );
  },

  listAlignmentSessions: async (userId: string): Promise<AlignmentSessionResponse[]> => {
    return apiClient.get<AlignmentSessionResponse[]>(`/api/alignment/${userId}/sessions`);
  },

  getAlignmentForLatestSession: async (userId: string): Promise<AlignmentReportResponse> => {
    return apiClient.get<AlignmentReportResponse>(
      `/api/alignment/${userId}/sessions/latest`
    );
  },

  getAlignmentForSession: async (
    userId: string,
    sessionId: string
  ): Promise<AlignmentReportResponse> => {
    return apiClient.get<AlignmentReportResponse>(
      `/api/alignment/${userId}/sessions/${sessionId}`
    );
  },
};

