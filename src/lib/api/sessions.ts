import { apiClient } from './client';
import type { Session, CreateSessionPayload, UpdateSessionPayload } from '@/types/session';

// Response types
interface ListSessionsResponse {
  sessions: Session[];
  total: number;
}

// Legacy types for backward compatibility
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
  /**
   * POST /api/sessions - Create a new session
   */
  createSession: async (payload: CreateSessionPayload): Promise<Session> => {
    return apiClient.post<Session>('/api/sessions', payload);
  },

  /**
   * GET /api/sessions - List all sessions
   */
  listSessions: async (includeArchived: boolean = false): Promise<Session[]> => {
    const response = await apiClient.get<ListSessionsResponse>(
      `/api/sessions${includeArchived ? '?include_archived=true' : ''}`
    );
    return response.sessions;
  },

  /**
   * GET /api/sessions/latest - Get latest session
   */
  getLatestSession: async (): Promise<Session> => {
    return apiClient.get<Session>('/api/sessions/latest');
  },

  /**
   * GET /api/sessions/{session_id} - Get session details
   */
  getSession: async (sessionId: string): Promise<Session> => {
    return apiClient.get<Session>(`/api/sessions/${sessionId}`);
  },

  /**
   * PATCH /api/sessions/{session_id} - Update session
   */
  updateSession: async (sessionId: string, payload: UpdateSessionPayload): Promise<Session> => {
    return apiClient.patch<Session>(`/api/sessions/${sessionId}`, payload);
  },

  /**
   * DELETE /api/sessions/{session_id} - Delete session
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete(`/api/sessions/${sessionId}`);
  },

  /**
   * POST /api/sessions/{session_id}/archive - Archive session
   */
  archiveSession: async (sessionId: string): Promise<Session> => {
    return apiClient.post<Session>(`/api/sessions/${sessionId}/archive`, {});
  },

  /**
   * GET /api/sessions/{session_id}/stats - Get session statistics
   * Returns questions answered, correct answers, completion rate, accuracy, and streak.
   */
  getSessionStats: async (sessionId: string): Promise<SessionStats> => {
    return apiClient.get<SessionStats>(`/api/sessions/${sessionId}/stats`);
  },

  /**
   * GET /api/sessions/{session_id}/evaluations - Get all evaluation results for session
   * Returns all days with questions, answers, scores, and feedback.
   * Does NOT trigger question generation.
   */
  getSessionEvaluations: async (sessionId: string, answeredOnly: boolean = false): Promise<SessionEvaluations> => {
    const params = answeredOnly ? '?answered_only=true' : '';
    return apiClient.get<SessionEvaluations>(`/api/sessions/${sessionId}/evaluations${params}`);
  },

  // Legacy methods for backward compatibility
  getDailyPlan: async (): Promise<DailyPlanResponse> => {
    return apiClient.get<DailyPlanResponse>('/api/sessions/today');
  },
};

// Session statistics response type
export interface SessionStats {
  session_id: string;
  session_name: string;
  role: string;
  status: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  completion_rate: number;
  accuracy_rate: number;
  current_streak: number;
  total_practice_days: number;
}

// Session evaluations response type
export interface SessionEvaluationQuestion {
  question_id: string;
  difficulty: string;
  topic: string;
  question_text: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  score: number;
  feedback: string;
  is_answered: boolean;
}

export interface SessionEvaluationDay {
  day_number: number;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  average_score: number;
  questions: SessionEvaluationQuestion[];
}

export interface SessionEvaluations {
  session_id: string;
  session_name: string;
  total_days: number;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  overall_score: number;
  days: SessionEvaluationDay[];
}

