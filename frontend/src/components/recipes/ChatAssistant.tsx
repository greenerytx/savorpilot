import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, ChefHat, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui';
import { useRecipeChat } from '../../hooks';
import { cn } from '../../lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

interface ChatAssistantProps {
  recipeId: string;
  recipeTitle: string;
  className?: string;
}

export function ChatAssistant({ recipeId, recipeTitle, className }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useRecipeChat();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      const conversationHistory = messages.map(({ role, content }) => ({ role, content }));
      const response = await chatMutation.mutateAsync({
        recipeId,
        message: messageText.trim(),
        conversationHistory,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [chatMutation, messages, recipeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI cooking assistant for "${recipeTitle}". Ask me anything about cooking this dish - ingredient substitutions, technique tips, timing questions, or troubleshooting!`,
          suggestions: [
            'What substitutes can I use?',
            'Any tips for this recipe?',
          ],
        },
      ]);
    }
  }, [isOpen, messages.length, recipeTitle]);

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Chat Panel */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 sm:w-96 shadow-xl border-primary-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-amber-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <ChefHat className="w-5 h-5" />
              <span className="font-semibold">AI Chef Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm shadow-sm'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Suggestions */}
                  {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-neutral-100 space-y-1.5">
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Quick questions:
                      </p>
                      {message.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-primary-50 text-primary-700 px-2 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about cooking this recipe..."
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all',
          'bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-600 hover:to-amber-600',
          'text-white hover:scale-105 active:scale-95',
          isOpen && 'rotate-0'
        )}
        title="AI Chef Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
