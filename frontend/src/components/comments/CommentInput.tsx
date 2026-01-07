import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '../ui';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  submitLabel?: string;
  showCancel?: boolean;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  isLoading = false,
  autoFocus = false,
  initialValue = '',
  submitLabel = 'Post',
  showCancel = false,
}: CommentInputProps) {
  const [content, setContent] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (trimmedContent && !isLoading) {
      onSubmit(trimmedContent);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    // Cancel on Escape if showCancel is true
    if (e.key === 'Escape' && showCancel && onCancel) {
      onCancel();
    }
  };

  const isValid = content.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="w-full min-h-[80px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        maxLength={2000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/2000
        </span>
        <div className="flex gap-2">
          {showCancel && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!isValid || isLoading}
          >
            <Send className="h-4 w-4 mr-1" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
