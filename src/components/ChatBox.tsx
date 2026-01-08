"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Send,
  User,
  X,
  Sparkles,
  Clock,
  Plus,
  MessageSquare
} from "lucide-react";
import { chatApi, ChatMessage as ApiChatMessage, WebSocketClient, ConversationSummary } from "@/lib/api/chat";
import { apiClient } from "@/lib/api/client";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatBoxProps {
  className?: string;
  sessionId?: string;
  dayNumber?: number;
  contextType?: "general" | "session";
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    content: "Hi there! I'm your AI interview preparation assistant. I can help you with:\n\n• Your practice session progress\n• Understanding quiz results and feedback\n• Areas where you can improve\n• Career development advice\n\nWhat would you like to know?",
    role: 'assistant',
    timestamp: new Date()
  }
];

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatBox({
  className = "",
  sessionId,
  dayNumber,
  contextType = "general"
}: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // History State
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsClient = useRef<WebSocketClient | null>(null);
  const mounted = useRef(false);
  const responseTimeout = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !showHistory) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, showHistory, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      wsClient.current?.disconnect();
      if (responseTimeout.current) clearTimeout(responseTimeout.current);
    };
  }, []);

  // Initialize WS when opening chat
  useEffect(() => {
    if (isOpen && !wsClient.current) {
      const token = apiClient.getToken();
      if (token) {
        const client = new WebSocketClient(token);

        client.onMessage((data) => {
          if (data.type === 'status') {
            setIsTyping(data.status === 'thinking');
          } else if (data.type === 'delta') {
            setIsTyping(false);
            if (responseTimeout.current) {
              clearTimeout(responseTimeout.current);
              responseTimeout.current = null;
            }

            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content + data.content
                };
                return updated;
              } else {
                return [...prev, {
                  id: Date.now().toString(),
                  content: data.content,
                  role: 'assistant',
                  timestamp: new Date()
                }];
              }
            });
          } else if (data.type === 'message') {
            setIsTyping(false);
            if (responseTimeout.current) {
              clearTimeout(responseTimeout.current);
              responseTimeout.current = null;
            }

            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              // If we were streaming, update the last message with final content
              if (lastMsg && lastMsg.role === 'assistant') {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...lastMsg,
                  content: data.content // Ensure final consistency
                };
                return updated;
              } else {
                return [...prev, {
                  id: Date.now().toString(),
                  content: data.content,
                  role: data.role || 'assistant',
                  timestamp: new Date()
                }];
              }
            });

            // Capture conversation ID if newly created
            if (data.conversation_id) {
              setConversationId(prev => {
                if (!prev) {
                  // If we just got a conversation ID, refresh history to show it eventually
                  fetchHistory();
                }
                return data.conversation_id;
              });
            }
          } else if (data.type === 'error') {
            setIsTyping(false);
            if (responseTimeout.current) {
              clearTimeout(responseTimeout.current);
              responseTimeout.current = null;
            }

            const errorMessage: Message = {
              id: Date.now().toString(),
              content: `Error: ${data.content}`,
              role: 'assistant',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        });

        client.connect();
        wsClient.current = client;
      }
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await chatApi.getHistory(contextType);
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  const loadConversation = async (summary: ConversationSummary) => {
    setIsTyping(false); // Reset stuck state
    if (responseTimeout.current) {
      clearTimeout(responseTimeout.current);
      responseTimeout.current = null;
    }
    try {
      // Load messages
      const msgs = await chatApi.getConversationMessages(summary.id);

      const formattedMessages: Message[] = msgs.map((m: ApiChatMessage, i: number) => ({
        id: `${summary.id}-${i}`,
        content: m.content,
        role: m.role,
        timestamp: new Date(summary.updated_at) // Approximate
      }));

      setMessages(formattedMessages);
      setConversationId(summary.id);
      setShowHistory(false);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const startNewChat = () => {
    setMessages(INITIAL_MESSAGES);
    setConversationId(null);
    setShowHistory(false);
    setIsTyping(false);
    if (responseTimeout.current) {
      clearTimeout(responseTimeout.current);
      responseTimeout.current = null;
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    if (!wsClient.current) return; // Should be initialized by useEffect

    if (!wsClient.current.isConnected()) {
      console.log("Reconnecting WS...");
      wsClient.current.connect(); // Helper handles reconnection
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Timeout implementation
    if (responseTimeout.current) clearTimeout(responseTimeout.current);
    responseTimeout.current = setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Something went wrong. Please try again later.",
        role: 'assistant',
        timestamp: new Date()
      }]);
      responseTimeout.current = null;
    }, 60000);

    try {
      // Build previous history for context if needed (not strictly needed with conversation_id)
      // but good for first message in new conversation
      const historyContext: ApiChatMessage[] = conversationId ? [] : messages
        .slice(1)
        .map(m => ({ role: m.role, content: m.content }));

      historyContext.push({ role: 'user', content: userMessage.content });

      wsClient.current?.send({
        message: userMessage.content,
        context_type: contextType,
        session_id: sessionId || null,
        day_number: dayNumber || null,
        conversation_id: conversationId || null,
        history: historyContext.slice(-10)
      });
    } catch (error) {
      console.error("Send error:", error);
      setIsTyping(false);
      if (responseTimeout.current) clearTimeout(responseTimeout.current);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[hsl(220,71%,38%)] text-white shadow-lg hover:bg-[hsl(220,71%,32%)] transition-all duration-200 flex items-center justify-center hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <Card className={`fixed bottom-6 right-6 w-[400px] h-[600px] flex flex-col shadow-2xl border-gray-200 z-50 animate-in slide-in-from-bottom-4 duration-300 ${className}`}>
          {/* Header */}
          <div className="border-b bg-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(220,71%,38%)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {showHistory ? "Chat History" : (conversationId ? "Active Chat" : "New Chat")}
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  {contextType === "session" ? "Session Coach" : "General Assistant"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory ? (
                <button
                  onClick={handleOpenHistory}
                  className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="View History"
                >
                  <Clock className="h-4 w-4 text-gray-500" />
                </button>
              ) : (
                <button
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="Back to Chat"
                >
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                </button>
              )}
              <button
                onClick={startNewChat}
                className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="New Chat"
              >
                <Plus className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-gray-50 relative flex flex-col">
            {showHistory ? (
              // History View
              <div className="absolute inset-0 overflow-y-auto p-4 space-y-2">
                {loadingHistory ? (
                  <div className="flex justify-center p-4"><span className="text-sm text-gray-500">Loading history...</span></div>
                ) : history.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 text-sm">No previous conversations found.</div>
                ) : (
                  history.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${conv.id === conversationId
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                        : "bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm"
                        }`}
                    >
                      <h3 className="font-medium text-gray-900 text-sm truncate">{conv.title || "Untitled Chat"}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 capitalize">{conv.context_type}</span>
                        <span className="text-xs text-gray-400">{new Date(conv.updated_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              // Chat Messages View
              <div className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(220,71%,38%)] flex-shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}

                    <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                      <div
                        className={`rounded-2xl px-3 py-2 ${message.role === "user"
                          ? "bg-[hsl(220,71%,38%)] text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                          }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 px-1">{formatTime(message.timestamp)}</span>
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(220,71%,38%)] flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2">
                      <span className="text-xs text-gray-500 animate-pulse">Assistant is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area (only in chat view) */}
          {!showHistory && (
            <div className="border-t bg-white px-4 py-3 rounded-b-lg">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message..."
                    className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-[hsl(220,71%,38%)] resize-none rounded-lg text-sm"
                    disabled={false}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="h-10 w-10 p-0 bg-[hsl(220,71%,38%)] hover:bg-[hsl(220,71%,32%)] text-white rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
