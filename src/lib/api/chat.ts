import { apiClient } from './client';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
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

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: MessageHandler[] = [];
    private url: string;

    constructor(token: string) {
        // Construct WS URL from current env or defaults
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

        // Handle http -> ws and https -> wss
        let wsProtocol = 'ws';
        if (apiBase.startsWith('https')) {
            wsProtocol = 'wss';
        } else if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
            // Fallback: if frontend is https, assume wss needed if api base is relative or compatible
            wsProtocol = 'wss';
        }

        const wsBase = apiBase.replace(/^http(s)?/, 'ws$1');
        this.url = `${wsBase}/api/chat/ws?token=${token}`;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

        console.log('Connecting to WebSocket:', this.url);
        this.ws = new WebSocket(this.url);

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
            console.error('WebSocket not connected. State:', this.ws?.readyState);
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
        return apiClient.get<ConversationSummary[]>(`/api/chat/history?${params.toString()}`);
    },

    getConversationMessages: async (conversationId: string): Promise<ChatMessage[]> => {
        return apiClient.get<ChatMessage[]>(`/api/chat/history/${conversationId}`);
    },

    // Fallback/Legacy
    sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
        return apiClient.post<ChatResponse>('/api/chat', request);
    },
};
