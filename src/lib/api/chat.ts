import { apiClient, ApiClientError, ApiError } from './client';
import { getWebSocketBaseUrl } from './base-url';

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

type MessageHandler = (message: any) => void;
const CHAT_PROXY_BASE = '/api/proxy/chat';

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

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: MessageHandler[] = [];
    private url: string;
    private messageQueue: any[] = [];

    constructor(token: string) {
        // Construct WS URL from current env or defaults
        const apiBase = getWebSocketBaseUrl();

        this.url = `${apiBase}/api/chat/ws?token=${token}`;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

        console.log('Connecting to WebSocket:', this.url);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.flushQueue();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.forEach(h => h(data));
            } catch (e) {
                console.error('WebSocket parse error:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        this.ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.log('Queueing message, state:', this.ws?.readyState);
            this.messageQueue.push(data);
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.connect();
            }
        }
    }

    private flushQueue() {
        while (this.messageQueue.length > 0) {
            const data = this.messageQueue.shift();
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(data));
            } else {
                // If closed again, push back and stop
                this.messageQueue.unshift(data);
                break;
            }
        }
    }

    onMessage(handler: MessageHandler) {
        this.handlers.push(handler);
        return () => {
            this.handlers = this.handlers.filter(h => h !== handler);
        };
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const chatApi = {
    getHistory: async (contextType?: string): Promise<ConversationSummary[]> => {
        const params = new URLSearchParams();
        if (contextType) params.append('context_type', contextType);
        const query = params.toString();
        const endpoint = query ? `${CHAT_PROXY_BASE}/history?${query}` : `${CHAT_PROXY_BASE}/history`;
        return proxyRequest<ConversationSummary[]>(endpoint, { method: 'GET' });
    },

    getConversationMessages: async (conversationId: string): Promise<ChatMessage[]> => {
        return proxyRequest<ChatMessage[]>(`${CHAT_PROXY_BASE}/history/${conversationId}`, { method: 'GET' });
    },

    sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
        return proxyRequest<ChatResponse>(CHAT_PROXY_BASE, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },
};
