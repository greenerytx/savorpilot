import { useState } from 'react';
import { Youtube, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface YouTubeUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Input component for submitting YouTube URLs
 */
export function YouTubeUrlInput({
  onSubmit,
  isLoading = false,
  error = null,
}: YouTubeUrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const isValidUrl = (value: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/.test(
      value,
    );
  };

  const showValidation = url.length > 0 && !isValidUrl(url);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube URL (e.g., https://youtube.com/watch?v=...)"
          disabled={isLoading}
          leftIcon={<Youtube className="h-5 w-5 text-red-500" />}
          className={showValidation ? 'border-amber-500' : ''}
        />
      </div>

      {showValidation && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Please enter a valid YouTube URL
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !url.trim() || !isValidUrl(url)}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin me-2" />
            Starting extraction...
          </>
        ) : (
          <>
            <Youtube className="h-4 w-4 me-2" />
            Extract Recipe
          </>
        )}
      </Button>

      <p className="text-xs text-neutral-500 text-center">
        Supports regular YouTube videos, Shorts, and youtu.be links.
        <br />
        Videos up to 60 minutes are supported.
      </p>
    </form>
  );
}
