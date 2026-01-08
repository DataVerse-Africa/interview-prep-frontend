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
  Sparkles
} from "lucide-react";
import { chatApi, ChatMessage as ApiChatMessage } from "@/lib/api/chat";

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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Build history from previous messages (excluding initial message)
      const history: ApiChatMessage[] = messages
        .slice(1) // Skip initial greeting
        .map(m => ({ role: m.role, content: m.content }));

      // Add the current user message
      history.push({ role: 'user', content: userMessage.content });

      // Call the API
      const response = await chatApi.sendMessage({
        message: userMessage.content,
        context_type: contextType,
        session_id: sessionId || null,
        day_number: dayNumber || null,
        history: history.slice(-10), // Last 10 messages for context
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback response on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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
              <div>
                <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
                <p className="text-xs text-gray-500">
                  {contextType === "session" ? "Session Coach" : "Always here to help"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
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

                <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
                  <div
                    className={`rounded-2xl px-3 py-2 ${message.role === "user"
                        ? "bg-[hsl(220,71%,38%)] text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                      }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
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
                  <div className="flex gap-1">
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
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
                  disabled={isTyping}
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
        </Card>
      )}
    </>
  );
}
