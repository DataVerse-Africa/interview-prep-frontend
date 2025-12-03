import { apiClient } from './client';

export interface DailyPlanResponse {
  id: string;
  user_id: string;
  plan_date: string;
  questions: DailyQuestion[];
}

export interface DailyQuestion {
  id: string;
  question?: string; // For questions API
  question_data?: Record<string, any>; // For sessions API
  difficulty: string;
  topic: string;
  expected_answer?: string | null;
  evaluation_criteria?: string[] | null;
  keywords?: string[] | null;
}

export interface UserAnswerSubmission {
  question_id: string;
  answer_text: string;
  time_taken_seconds: number;
}

export interface BatchAnswerSubmission {
  answers: UserAnswerSubmission[];
  difficulty: string;
}

export interface UserAnswerResult {
  score: number;
  feedback: string;
  is_correct: boolean;
  concepts_covered: string[];
  areas_for_improvement: string[];
  next_recommended_difficulty: string;
}

export interface DifficultyProgress {
  difficulty: string;
  total: number;
  answered: number;
  unanswered: number;
  average_score?: number | null;
}

export const questionsApi = {
  getQuestionsForSessionDay: async (
    userId: string,
    sessionId: string,
    dayNumber: number
  ): Promise<DailyPlanResponse> => {
    return apiClient.get<DailyPlanResponse>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions`
    );
  },

  generateQuestionsForSessionDay: async (
    userId: string,
    sessionId: string,
    dayNumber: number
  ): Promise<DailyPlanResponse> => {
    return apiClient.post<DailyPlanResponse>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions/generate`
    );
  },

  getQuestionsForDifficulty: async (
    userId: string,
    sessionId: string,
    dayNumber: number,
    difficulty: string
  ): Promise<DailyQuestion[]> => {
    return apiClient.get<DailyQuestion[]>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions/difficulty/${difficulty}`
    );
  },

  getQuestionsWithAnswersForDifficulty: async (
    userId: string,
    sessionId: string,
    dayNumber: number,
    difficulty: string
  ): Promise<any[]> => {
    return apiClient.get<any[]>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions/difficulty/${difficulty}/answers`
    );
  },

  submitDifficultyAnswers: async (
    userId: string,
    sessionId: string,
    dayNumber: number,
    difficulty: string,
    payload: BatchAnswerSubmission
  ): Promise<UserAnswerResult[]> => {
    return apiClient.post<UserAnswerResult[]>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions/difficulty/${difficulty}/answers`,
      payload
    );
  },

  getDifficultyProgress: async (
    userId: string,
    sessionId: string,
    dayNumber: number,
    difficulty: string
  ): Promise<DifficultyProgress> => {
    return apiClient.get<DifficultyProgress>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions/difficulty/${difficulty}/progress`
    );
  },

  submitQuestionAnswer: async (
    userId: string,
    sessionId: string,
    dayNumber: number,
    questionId: string,
    payload: { answer_text: string; time_taken_seconds?: number }
  ): Promise<UserAnswerResult> => {
    return apiClient.post<UserAnswerResult>(
      `/api/questions/users/${userId}/sessions/${sessionId}/days/${dayNumber}/questions/${questionId}/answer`,
      {
        answer_text: payload.answer_text,
        time_taken_seconds: payload.time_taken_seconds || 0,
      }
    );
  },
};


