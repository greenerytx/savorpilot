import { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Instagram,
  Youtube,
  Globe,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  urlImportService,
  UrlSource,
  ExtractionMethod,
  getSourceLabel,
  getExtractionMethodLabel,
  type SourceDetectionResult,
  type ExtractionResult,
} from '../../services/url-import.service';

interface UniversalUrlInputProps {
  onExtract: (result: ExtractionResult) => void;
  onError?: (error: string) => void;
  initialUrl?: string;
  showPreview?: boolean;
}

/**
 * Facebook icon component (Lucide doesn't have one)
 */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * TikTok icon component
 */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

/**
 * Get icon for source type
 */
function getSourceIcon(source: UrlSource, className: string = 'h-5 w-5') {
  switch (source) {
    case UrlSource.INSTAGRAM:
      return <Instagram className={`${className} text-pink-500`} />;
    case UrlSource.FACEBOOK:
      return <FacebookIcon className={`${className} text-blue-600`} />;
    case UrlSource.YOUTUBE:
      return <Youtube className={`${className} text-red-500`} />;
    case UrlSource.TIKTOK:
      return <TikTokIcon className={`${className} text-neutral-900`} />;
    case UrlSource.RECIPE_SITE:
      return <Sparkles className={`${className} text-amber-500`} />;
    case UrlSource.PDF:
      return <FileText className={`${className} text-red-600`} />;
    default:
      return <Globe className={`${className} text-neutral-500`} />;
  }
}

/**
 * UniversalUrlInput Component
 *
 * A smart URL input that:
 * - Auto-detects source as user types (Instagram, Facebook, YouTube, Website)
 * - Shows source badge with icon
 * - Indicates known recipe sites with high success rates
 * - Uses multi-tier extraction pipeline (free methods first)
 */
export function UniversalUrlInput({
  onExtract,
  onError,
  initialUrl = '',
  showPreview = true,
}: UniversalUrlInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<SourceDetectionResult | null>(null);
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);

  // Detect source as user types (debounced)
  useEffect(() => {
    if (!url.trim()) {
      setSourceInfo(null);
      return;
    }

    // Add protocol if missing for detection
    let urlToDetect = url.trim();
    if (!urlToDetect.startsWith('http://') && !urlToDetect.startsWith('https://')) {
      urlToDetect = `https://${urlToDetect}`;
    }

    const detected = urlImportService.detectSourceLocal(urlToDetect);
    setSourceInfo(detected);
    setError(null);
  }, [url]);

  // Handle extraction
  const handleExtract = useCallback(async () => {
    if (!url.trim()) return;

    // Add protocol if missing
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }

    setIsLoading(true);
    setError(null);
    setLastResult(null);

    try {
      const result = await urlImportService.extractFromUrl(fullUrl);

      setLastResult(result);

      if (result.success && result.recipe) {
        onExtract(result);
      } else if (result.requiresManualInput) {
        setError(result.error || 'Could not extract recipe. Please paste the content manually.');
        onError?.(result.error || 'Manual input required');
      } else {
        setError(result.error || 'Extraction failed');
        onError?.(result.error || 'Extraction failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [url, onExtract, onError]);

  // Submit on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      e.preventDefault();
      handleExtract();
    }
  };

  // Validate URL format
  const isValidUrl = useCallback((value: string): boolean => {
    if (!value.trim()) return false;
    let urlToCheck = value.trim();
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = `https://${urlToCheck}`;
    }
    try {
      new URL(urlToCheck);
      return true;
    } catch {
      return false;
    }
  }, []);

  const showValidation = url.length > 5 && !isValidUrl(url);
  const canSubmit = url.trim() && isValidUrl(url) && !isLoading;

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="relative">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a recipe URL (Instagram, Facebook, YouTube, or any website)..."
          disabled={isLoading}
          leftIcon={
            sourceInfo ? (
              getSourceIcon(sourceInfo.source)
            ) : (
              <Link2 className="h-5 w-5 text-neutral-400" />
            )
          }
          className={showValidation ? 'border-amber-500' : ''}
        />

        {/* Source Badge */}
        {sourceInfo && url.trim() && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Badge
              variant={sourceInfo.isKnownRecipeSite ? 'success' : 'secondary'}
              className="text-xs"
            >
              {sourceInfo.siteName || getSourceLabel(sourceInfo.source)}
              {sourceInfo.isKnownRecipeSite && (
                <CheckCircle className="h-3 w-3 ml-1" />
              )}
            </Badge>
          </div>
        )}
      </div>

      {/* Validation Warning */}
      {showValidation && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Please enter a valid URL
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Known Recipe Site Hint */}
      {sourceInfo?.isKnownRecipeSite && !isLoading && !lastResult && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>{sourceInfo.siteName}</strong> is a known recipe site with structured data.
              Extraction should be fast and free!
            </span>
          </p>
        </div>
      )}

      {/* Social Media Hints */}
      {sourceInfo?.source === UrlSource.FACEBOOK && !isLoading && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Facebook posts may require manual content paste if the post is private or login-protected.
            </span>
          </p>
        </div>
      )}

      {/* Extraction Result Preview */}
      {showPreview && lastResult && !lastResult.success && lastResult.partialData && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 mb-2">
            Partial data extracted. You may need to fill in missing fields:
          </p>
          <ul className="text-xs text-amber-600 space-y-1">
            {lastResult.partialData.title && <li>• Title: {lastResult.partialData.title}</li>}
            {lastResult.partialData.components?.[0]?.ingredients?.length && (
              <li>• {lastResult.partialData.components[0].ingredients.length} ingredients found</li>
            )}
          </ul>
        </div>
      )}

      {/* Extract Button */}
      <Button
        onClick={handleExtract}
        disabled={!canSubmit}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin me-2" />
            Extracting recipe...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 me-2" />
            Extract Recipe
          </>
        )}
      </Button>

      {/* Extraction Method Badge (after successful extraction) */}
      {lastResult?.success && (
        <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Extracted via {getExtractionMethodLabel(lastResult.extractionMethod)}
          </span>
          <span>
            Confidence: {Math.round(lastResult.confidence * 100)}%
          </span>
          {lastResult.processingTimeMs && (
            <span>
              {lastResult.processingTimeMs}ms
            </span>
          )}
          {lastResult.extractionMethod === ExtractionMethod.AI && lastResult.aiTokensUsed && (
            <span className="text-amber-600">
              ~{lastResult.aiTokensUsed} tokens used
            </span>
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-neutral-500 text-center">
        Supports: Instagram, Facebook, YouTube, TikTok, recipe blogs, and most cooking websites.
        <br />
        Uses free extraction when possible, AI as fallback.
      </p>
    </div>
  );
}
