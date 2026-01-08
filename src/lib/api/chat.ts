import { apiClient } from './client';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    message: string;
    context_type: 'general' | 'session';
    session_id?: string | null;
    day_number?: number | null;
    history?: ChatMessage[];
}

export interface ChatResponse {
    response: string;
}

export const chatApi = {
    /**
     * Send a message to the AI chat assistant.
     * 
     * @param request - The chat request with message and context
     * @returns The assistant's response
     */
    sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
        return apiClient.post<ChatResponse>('/api/chat', request);
    },
};
