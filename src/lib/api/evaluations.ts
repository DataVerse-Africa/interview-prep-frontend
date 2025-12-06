import { apiClient } from './client';

export interface EvaluationSubmission {
  answer_text: string;
  time_taken_seconds?: number | null;
}

export interface QuestionAnswerSubmission {
  question_id: string;
  answer_text: string;
  time_taken_seconds?: number | null;
}

export interface DifficultyBucketSubmission {
  difficulty: string;
  answers: QuestionAnswerSubmission[];
}

export interface EvaluationResultOut {
  score: number;
  feedback: string;
  is_correct: boolean;
  concepts_covered: string[];
  areas_for_improvement: string[];
  next_recommended_difficulty: string;
  answered_at: string;
}

export interface QuestionEvaluationResult {
  question_id: string;
  score: number;
  feedback: string;
  is_correct: boolean;
  concepts_covered: string[];
  areas_for_improvement: string[];
}

export interface DifficultyBucketEvaluationOut {
  difficulty: string;
  overall_score: number;
  question_evaluations: QuestionEvaluationResult[];
  bucket_feedback: string;
  next_recommended_difficulty: string;
  evaluated_at: string;
}

export const evaluationsApi = {
  // POST /api/evaluations/sessions/{session_id}/days/{day_number}/questions/{question_id}/evaluate - user_id from JWT
  evaluateAnswer: async (
    sessionId: string,
    dayNumber: number,
    questionId: string,
    payload: EvaluationSubmission
  ): Promise<EvaluationResultOut> => {
    return apiClient.post<EvaluationResultOut>(
      `/api/evaluations/sessions/${sessionId}/days/${dayNumber}/questions/${questionId}/evaluate`,
      payload
    );
  },

  // GET /api/evaluations/sessions/{session_id}/days/{day_number}/questions/{question_id}/evaluation - user_id from JWT
  getEvaluation: async (
    sessionId: string,
    dayNumber: number,
    questionId: string
  ): Promise<EvaluationResultOut> => {
    return apiClient.get<EvaluationResultOut>(
      `/api/evaluations/sessions/${sessionId}/days/${dayNumber}/questions/${questionId}/evaluation`
    );
  },

  // POST /api/evaluations/sessions/{session_id}/days/{day_number}/questions/{question_id}/reevaluate - user_id from JWT
  reevaluateAnswer: async (
    sessionId: string,
    dayNumber: number,
    questionId: string
  ): Promise<EvaluationResultOut> => {
    return apiClient.post<EvaluationResultOut>(
      `/api/evaluations/sessions/${sessionId}/days/${dayNumber}/questions/${questionId}/reevaluate`
    );
  },

  // POST /api/evaluations/sessions/{session_id}/days/{day_number}/questions/difficulty/{difficulty}/evaluate - user_id from JWT
  evaluateDifficultyBucket: async (
    sessionId: string,
    dayNumber: number,
    difficulty: string,
    payload: DifficultyBucketSubmission
  ): Promise<DifficultyBucketEvaluationOut> => {
    return apiClient.post<DifficultyBucketEvaluationOut>(
      `/api/evaluations/sessions/${sessionId}/days/${dayNumber}/questions/difficulty/${difficulty}/evaluate`,
      payload
    );
  },

  // GET /api/evaluations/sessions/{session_id}/days/{day_number}/questions/difficulty/{difficulty}/evaluation - user_id from JWT
  getDifficultyBucketEvaluation: async (
    sessionId: string,
    dayNumber: number,
    difficulty: string
  ): Promise<DifficultyBucketEvaluationOut> => {
    return apiClient.get<DifficultyBucketEvaluationOut>(
      `/api/evaluations/sessions/${sessionId}/days/${dayNumber}/questions/difficulty/${difficulty}/evaluation`
    );
  },
};
