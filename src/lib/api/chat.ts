import { apiClient, ApiClientError, ApiError } from './client';
import { getApiBaseUrl } from './base-url';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string | null;
}

export interface ConversationSummary {
    id: string;
    title: string | null;
    updated_at: string;
    context_type: string;
    session_id?: string | null;
}

export interface ChatRequest {
    message: string;
    context_type: 'general' | 'session';
    session_id?: string | null;
    day_number?: number | null;
    conversation_id?: string | null;
    history?: ChatMessage[];
}

export interface ChatResponse {
    response: string;
    conversation_id?: string | null;
}

// Default to direct backend calls. Use proxy only when explicitly enabled.
const CHAT_USE_PROXY = process.env.NEXT_PUBLIC_CHAT_USE_PROXY === 'true';
const CHAT_API_BASE = CHAT_USE_PROXY
    ? '/api/proxy/chat'
    : `${getApiBaseUrl()}/api/chat`;

const getAuthToken = (): string | null => {
    return apiClient.getAdminToken() || apiClient.getToken();
};

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
    const normalized: Record<string, string> = {};
    if (!headers) return normalized;

    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            normalized[key] = value;
        });
        return normalized;
    }

    if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
            normalized[key] = value;
        });
        return normalized;
    }

    return { ...headers };
};

const buildProxyHeaders = (headers?: HeadersInit): HeadersInit => {
    const merged: Record<string, string> = {
        'Content-Type': 'application/json',
        ...normalizeHeaders(headers),
    };

    const token = getAuthToken();
    if (token && !merged.Authorization) {
        merged.Authorization = `Bearer ${token}`;
    }

    return merged;
};

const parseErrorResponse = async (response: Response): Promise<ApiError> => {
    try {
        const data = await response.json();
        return {
            error: data?.error || 'request_failed',
            message: data?.message || data?.detail || `HTTP ${response.status}`,
            detail: data?.detail,
        };
    } catch {
        return {
            error: 'request_failed',
            message: `HTTP ${response.status}: ${response.statusText}`,
        };
    }
};

const proxyRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(endpoint, {
        ...options,
        cache: options.cache || 'no-store',
        headers: buildProxyHeaders(options.headers),
    });

    if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw new ApiClientError(response.status, errorData);
    }

    if (response.status === 204) {
        return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return {} as T;
};

export const chatApi = {
    getHistory: async (contextType?: string): Promise<ConversationSummary[]> => {
        const params = new URLSearchParams();
        if (contextType) params.append('context_type', contextType);
        const query = params.toString();
        const endpoint = query ? `${CHAT_API_BASE}/history?${query}` : `${CHAT_API_BASE}/history`;
        return proxyRequest<ConversationSummary[]>(endpoint, { method: 'GET' });
    },

    getConversationMessages: async (conversationId: string): Promise<ChatMessage[]> => {
        const normalizedConversationId = conversationId?.trim();
        if (
            !normalizedConversationId ||
            normalizedConversationId === 'undefined' ||
            normalizedConversationId === 'null'
        ) {
            throw new ApiClientError(400, {
                error: 'invalid_conversation_id',
                message: 'Conversation id is invalid.',
            });
        }
        return proxyRequest<ChatMessage[]>(
            `${CHAT_API_BASE}/history/${encodeURIComponent(normalizedConversationId)}`,
            { method: 'GET' }
        );
    },

    sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
        return proxyRequest<ChatResponse>(CHAT_API_BASE, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },
};
