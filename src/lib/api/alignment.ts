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
  // POST /api/alignment - user_id from JWT
  generateAlignmentReport: async (
    sessionId?: string | null
  ): Promise<AlignmentReportResponse> => {
    const endpoint = sessionId
      ? `/api/alignment?session_id=${sessionId}`
      : `/api/alignment`;
    return apiClient.post<AlignmentReportResponse>(endpoint, {});
  },

  // GET /api/alignment/latest - user_id from JWT
  getLatestAlignmentReport: async (
    sessionId?: string | null
  ): Promise<AlignmentReportResponse> => {
    return apiClient.get<AlignmentReportResponse>(
      `/api/alignment/latest`,
      sessionId ? { session_id: sessionId } : {}
    );
  },

  // GET /api/alignment/sessions - user_id from JWT
  listAlignmentSessions: async (): Promise<AlignmentSessionResponse[]> => {
    return apiClient.get<AlignmentSessionResponse[]>(`/api/alignment/sessions`);
  },

  // GET /api/alignment/sessions/latest - user_id from JWT
  getAlignmentForLatestSession: async (): Promise<AlignmentReportResponse> => {
    return apiClient.get<AlignmentReportResponse>(
      `/api/alignment/sessions/latest`
    );
  },

  // GET /api/alignment/sessions/{session_id} - user_id from JWT
  getAlignmentForSession: async (
    sessionId: string
  ): Promise<AlignmentReportResponse> => {
    return apiClient.get<AlignmentReportResponse>(
      `/api/alignment/sessions/${sessionId}`
    );
  },
};
