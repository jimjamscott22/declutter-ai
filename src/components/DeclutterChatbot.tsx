import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Building2,
  Trash2,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  CornerDownLeft,
  ChevronDown,
  Info
} from 'lucide-react';
import { ChatMessage, ChatModel, ChatRole, RoomAnalysisResult } from '../types';

interface DeclutterChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  roomContext: RoomAnalysisResult | null;
  imageBase64: string | null;
}

export const DeclutterChatbot: React.FC<DeclutterChatbotProps> = ({
  isOpen,
  onClose,
  roomContext,
  imageBase64,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('coach');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Model associated with each role
  const getModelForRole = (role: ChatRole): ChatModel => {
    switch (role) {
      case 'architect':
        return 'gemini-3.5-flash'; // High-performance spatial reasoning
      case 'sprint':
        return 'gemini-3.1-flash-lite'; // Fast triage and quick tasks
      case 'coach':
      default:
        return 'gemini-3.5-flash'; // General coaching tasks
    }
  };

  // Initial welcome message tailored to the current room
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting = roomContext
        ? `Hello! I see you're working on your **${roomContext.roomType}** (Clutter Score: ${roomContext.clutterScore}/100). I'm ready to guide you through clearing this space. What would you like to tackle first?`
        : `Welcome to DeclutterAI! I'm your AI organizing assistant. You can upload a room photo for tailored advice, or ask me any questions about decluttering, storage hacks, or tackling overwhelming clutter.`;

      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: initialGreeting,
          timestamp: Date.now(),
          modelUsed: getModelForRole(selectedRole),
          roleUsed: selectedRole,
        },
      ]);
    }
  }, [roomContext]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const activeModel = getModelForRole(selectedRole);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: activeModel,
          role: selectedRole,
          roomContext: roomContext
            ? {
                roomType: roomContext.roomType,
                clutterScore: roomContext.clutterScore,
                roomSummary: roomContext.roomSummary,
              }
            : null,
          imageBase64: imageBase64 || null,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "I've analyzed your question and am ready for next steps.",
        timestamp: Date.now(),
        modelUsed: data.modelUsed || activeModel,
        roleUsed: data.roleUsed || selectedRole,
      };

      setMessages([...newHistory, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I ran into an issue connecting to Gemini: ${err.message}. Please try again or switch to another assistant role.`,
        timestamp: Date.now(),
        modelUsed: getModelForRole(selectedRole),
        roleUsed: selectedRole,
      };
      setMessages([...newHistory, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. I am ready as your **${
          selectedRole === 'architect'
            ? 'Master Space Architect (Gemini 3.5 Flash)'
            : selectedRole === 'sprint'
            ? '5-Minute Sprint Organizer (Gemini 3.1 Flash-Lite)'
            : 'Mindful Declutter Coach (Gemini 3.5 Flash)'
        }**. What would you like help with?`,
        timestamp: Date.now(),
        modelUsed: getModelForRole(selectedRole),
        roleUsed: selectedRole,
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded
          ? 'inset-4 sm:inset-8'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[88vh]'
      } flex flex-col rounded-2xl border border-stone-200/90 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/95`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 px-4 py-3 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-xs">
            {selectedRole === 'architect' ? (
              <Building2 className="h-4 w-4" />
            ) : selectedRole === 'sprint' ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                DeclutterAI Multi-Role Chat
              </h3>
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                {getModelForRole(selectedRole)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {selectedRole === 'architect'
                ? 'Complex spatial layout & deep planning'
                : selectedRole === 'sprint'
                ? 'Snappy 5-minute triage & speed tips'
                : 'Mindful organizing & KonMari coach'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 transition"
            title="Clear Chat History"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 transition"
            title="Close Chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Role / Model Switcher Bar */}
      <div className="border-b border-stone-200/80 bg-stone-50/80 px-3 py-2 dark:border-stone-800 dark:bg-stone-950/50">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5">
          <span>AI SPECIALIST PERSONA &amp; ENGINE:</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedRole('architect')}
            className={`flex flex-col items-center rounded-lg p-1.5 text-center transition ${
              selectedRole === 'architect'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300'
            }`}
          >
            <span className="flex items-center gap-1 text-[11px]">
              <Building2 className="h-3 w-3" /> Space Architect
            </span>
            <span className={`text-[9px] ${selectedRole === 'architect' ? 'text-teal-100' : 'text-stone-400'}`}>
              gemini-3.5-flash
            </span>
          </button>

          <button
            onClick={() => setSelectedRole('coach')}
            className={`flex flex-col items-center rounded-lg p-1.5 text-center transition ${
              selectedRole === 'coach'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300'
            }`}
          >
            <span className="flex items-center gap-1 text-[11px]">
              <Sparkles className="h-3 w-3" /> Mindful Coach
            </span>
            <span className={`text-[9px] ${selectedRole === 'coach' ? 'text-teal-100' : 'text-stone-400'}`}>
              gemini-3.5-flash
            </span>
          </button>

          <button
            onClick={() => setSelectedRole('sprint')}
            className={`flex flex-col items-center rounded-lg p-1.5 text-center transition ${
              selectedRole === 'sprint'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300'
            }`}
          >
            <span className="flex items-center gap-1 text-[11px]">
              <Zap className="h-3 w-3" /> Sprint Triage
            </span>
            <span className={`text-[9px] ${selectedRole === 'sprint' ? 'text-teal-100' : 'text-stone-400'}`}>
              3.1-flash-lite
            </span>
          </button>
        </div>
      </div>

      {/* Message Thread (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                  isUser
                    ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                    : 'bg-teal-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end text-right' : ''}`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-stone-100 text-stone-900 rounded-tl-none dark:bg-stone-800 dark:text-stone-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-normal">
                    {message.content}
                  </div>
                </div>

                {!isUser && message.modelUsed && (
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-stone-400">
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {message.roleUsed === 'architect'
                        ? 'Master Space Architect'
                        : message.roleUsed === 'sprint'
                        ? '5-Min Sprint Engine'
                        : 'Mindful Declutter Coach'}
                    </span>
                    <span>•</span>
                    <span>{message.modelUsed}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white animate-pulse">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-stone-100 px-4 py-3 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] font-medium text-stone-400">
                  Thinking with {getModelForRole(selectedRole)}...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-stone-100 bg-stone-50/50 p-2 dark:border-stone-800 dark:bg-stone-950/40">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            'What should I tackle in the first 10 minutes?',
            'Where do I store all these tangled cables?',
            'Help me decide what to donate vs keep',
            'Suggest zero-cost DIY organizers',
            'How do I maintain this daily in 60 seconds?',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:border-teal-400 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t border-stone-200/80 p-3 dark:border-stone-800">
        <div className="flex items-end gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-1.5 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 dark:border-stone-700 dark:bg-stone-800">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedRole === 'architect'
                ? 'Ask about layout, spatial planning, furniture placement...'
                : selectedRole === 'sprint'
                ? 'Ask for a quick keep/toss rule or 5-minute blitz...'
                : 'Ask how to declutter, organize sentimental items...'
            }
            className="w-full resize-none border-none bg-transparent px-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden dark:text-stone-100"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
