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

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatBoxProps {
  className?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    content: "Hi there! I'm your AI interview preparation assistant. I can help you with:\n\n• Interview tips and strategies\n• Resume optimization advice\n• Practice question guidance\n• Career development insights\n\nWhat would you like to know?",
    role: 'assistant',
    timestamp: new Date()
  }
];

const INTERVIEW_TIPS = {
  "behavioral": [
    "Use the STAR method: Situation, Task, Action, Result",
    "Prepare 3-5 examples for each competency",
    "Focus on specific achievements, not general responsibilities",
    "Quantify your impact with metrics when possible"
  ],
  "technical": [
    "Explain your thought process, not just the final answer",
    "Ask clarifying questions if the problem is ambiguous",
    "Consider edge cases and error handling",
    "Discuss time/space complexity trade-offs"
  ],
  "system design": [
    "Start with requirements clarification",
    "Discuss scalability, reliability, and maintainability",
    "Consider database choices, caching, and APIs",
    "Address potential bottlenecks and failure points"
  ]
};

const SAMPLE_RESPONSES = {
  "how to prepare": "Great question! Here's a structured approach:\n\n1. **Research the company** - Understand their culture, products, and recent news\n2. **Review the job description** - Identify key skills and requirements\n3. **Practice common questions** - Both technical and behavioral\n4. **Prepare your own questions** - Show genuine interest in the role\n5. **Mock interviews** - Practice with friends or use our platform\n\nStart with our alignment analysis to see how well your resume matches the role!",
  "resume tips": "Here are key resume optimization tips:\n\n• **Tailor for each application** - Customize your resume for the specific role\n• **Use quantifiable achievements** - Include metrics and results\n• **Keep it concise** - Aim for 1-2 pages for most roles\n• **Use action verbs** - Start bullet points with strong verbs\n• **Include relevant keywords** - From the job description\n• **Proofread carefully** - Typos can disqualify you\n\nUse our alignment feature to see how well your resume matches job requirements!",
  "interview anxiety": "It's normal to feel nervous! Here are some strategies:\n\n• **Prepare thoroughly** - Knowledge reduces anxiety\n• **Practice deep breathing** - Take slow breaths before answering\n• **Remember it's a conversation** - Not an interrogation\n• **Focus on your strengths** - You've earned the interview!\n• **Have questions ready** - Shows engagement\n\nOur practice sessions can help you build confidence through repetition.",
  "default": "That's an interesting question! For personalized advice, try our alignment analysis or practice sessions. You can also ask me about:\n\n• Interview preparation strategies\n• Resume optimization tips\n• Behavioral interview techniques\n• Technical interview approaches\n• Career development advice\n\nWhat specific area would you like to focus on?"
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatBox({ className = "" }: ChatBoxProps) {
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

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Check for specific topics
    if (message.includes('behavioral') || message.includes('star method')) {
      return `For behavioral interviews, here are some key tips:\n\n${INTERVIEW_TIPS.behavioral.map(tip => `• ${tip}`).join('\n')}`;
    }

    if (message.includes('technical') || message.includes('coding')) {
      return `For technical interviews:\n\n${INTERVIEW_TIPS.technical.map(tip => `• ${tip}`).join('\n')}`;
    }

    if (message.includes('system design') || message.includes('architecture')) {
      return `For system design interviews:\n\n${INTERVIEW_TIPS.system_design.map(tip => `• ${tip}`).join('\n')}`;
    }

    // Check for common questions
    if (message.includes('prepare') || message.includes('preparation')) {
      return SAMPLE_RESPONSES["how to prepare"];
    }

    if (message.includes('resume') || message.includes('cv')) {
      return SAMPLE_RESPONSES["resume tips"];
    }

    if (message.includes('anxiety') || message.includes('nervous') || message.includes('scared')) {
      return SAMPLE_RESPONSES["interview anxiety"];
    }

    // Default response
    return SAMPLE_RESPONSES["default"];
  };

  const handleSend = () => {
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

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(userMessage.content),
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
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
                <p className="text-xs text-gray-500">Always here to help</p>
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
                    className={`rounded-2xl px-3 py-2 ${
                      message.role === "user"
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
