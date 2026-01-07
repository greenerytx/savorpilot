import { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Download,
  Copy,
  Check,
  Loader2,
  QrCode,
  Palette,
  Share2,
} from 'lucide-react';
import { Button, Card } from '../ui';
import { useToast } from '../ui';
import { ShareableRecipeCard, type CardStyle } from './ShareableRecipeCard';
import type { Recipe } from '../../types/recipe';
import { cn, getImageUrl } from '../../lib/utils';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
}

// Convert image URL to base64 via proxy or canvas
async function imageToBase64(imageUrl: string): Promise<string | null> {
  try {
    // For local uploads, fetch directly from the same origin
    if (imageUrl.includes('/uploads/') || imageUrl.startsWith('/')) {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }

    // For external URLs, use our image proxy to avoid CORS issues
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      // Proxy failed, return null (will show placeholder)
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const CARD_STYLES: { id: CardStyle; name: string; description: string }[] = [
  { id: 'classic', name: 'Classic', description: 'Clean and elegant' },
  { id: 'pinterest', name: 'Pinterest', description: 'Vertical, social-ready' },
  { id: 'modern', name: 'Modern', description: 'Bold and trendy' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and refined' },
];

export function ShareCardModal({ isOpen, onClose, recipe }: ShareCardModalProps) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('classic');
  const [showQR, setShowQR] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const recipeUrl = `${window.location.origin}/recipes/${recipe.id}`;

  // Load image as base64 when modal opens
  useEffect(() => {
    if (!isOpen || !recipe.imageUrl) {
      setImageBase64(null);
      return;
    }

    const loadImage = async () => {
      setIsLoadingImage(true);
      const fullUrl = getImageUrl(recipe.imageUrl);
      if (fullUrl) {
        const base64 = await imageToBase64(fullUrl);
        setImageBase64(base64);
      }
      setIsLoadingImage(false);
    };

    loadImage();
  }, [isOpen, recipe.imageUrl]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);

    try {
      // Wait for any images to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${recipe.title.toLowerCase().replace(/\s+/g, '-')}-recipe-card.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Recipe card downloaded!');
      }, 'image/png');
    } catch (error) {
      console.error('Error generating card:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [recipe.title, toast]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopiedUrl(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [recipeUrl, toast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || `Check out this recipe: ${recipe.title}`,
          url: recipeUrl,
        });
      } catch (err) {
        // User cancelled or share failed - ignore
        if ((err as Error).name !== 'AbortError') {
          handleCopyUrl();
        }
      }
    } else {
      handleCopyUrl();
    }
  }, [recipe.title, recipe.description, recipeUrl, handleCopyUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Share Recipe Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Controls Panel */}
            <div className="lg:w-64 space-y-6">
              {/* Style Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                  <Palette className="w-4 h-4" />
                  Card Style
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {CARD_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        'p-3 rounded-lg border-2 text-left transition-all',
                        selectedStyle === style.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <p className="font-medium text-sm text-neutral-800">{style.name}</p>
                      <p className="text-xs text-neutral-500">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Toggle */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </label>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 flex items-center justify-between transition-all',
                    showQR
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <span className="text-sm text-neutral-700">
                    {showQR ? 'QR code visible' : 'QR code hidden'}
                  </span>
                  <div
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      showQR ? 'bg-primary-500' : 'bg-neutral-200'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                        showQR ? 'translate-x-5' : 'translate-x-1'
                      )}
                    />
                  </div>
                </button>
              </div>

              {/* Quick Share */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Quick Share
                </label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleCopyUrl}
                  >
                    {copiedUrl ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedUrl ? 'Copied!' : 'Copy Link'}
                  </Button>
                  {typeof navigator.share === 'function' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-700 mb-3">Preview</p>
              <div className="bg-neutral-100 rounded-xl p-6 min-h-[400px] flex items-center justify-center overflow-auto">
                {isLoadingImage ? (
                  <div className="flex flex-col items-center gap-3 text-neutral-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Loading image...</p>
                  </div>
                ) : (
                  <div className="transform scale-75 origin-top lg:scale-90">
                    <ShareableRecipeCard
                      ref={cardRef}
                      recipe={recipe}
                      style={selectedStyle}
                      showQR={showQR}
                      qrUrl={recipeUrl}
                      imageDataUrl={imageBase64}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-2 text-center">
                Preview is scaled down. Downloaded image will be full size.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-neutral-50">
          <p className="text-sm text-neutral-500">
            Scan the QR code to view the full recipe
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating || isLoadingImage}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Card
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ShareCardModal;
