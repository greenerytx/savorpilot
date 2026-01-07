import { useState, useRef } from 'react';
import { X, Camera, Check, Share2, Globe, Users, Lock, Image, Loader2 } from 'lucide-react';
import { Button, Card, useToast } from '../ui';
import { useCreateCookingReview } from '../../hooks';
import { REVIEW_TAGS } from '../../services/flavor-dna.service';
import { cookingPostsService } from '../../services/cooking-posts.service';
import type { PostVisibility } from '../../types/cooking-posts.types';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

interface MadeItModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  recipeImageUrl?: string;
  onSuccess?: () => void;
}

const RATING_OPTIONS = [
  { value: 1, emoji: '😕', label: 'Not great' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😍', label: 'Loved it!' },
] as const;

const TAG_LABELS: Record<string, string> = {
  too_salty: '🧂 Too salty',
  too_spicy: '🌶️ Too spicy',
  too_sweet: '🍬 Too sweet',
  too_bland: '😶 Too bland',
  perfect_flavor: '👌 Perfect flavor',
  quick_easy: '⚡ Quick & easy',
  time_consuming: '⏰ Time consuming',
  kids_approved: '👨‍👩‍👧 Kids approved',
  date_night: '💕 Date night worthy',
  meal_prep_friendly: '📦 Meal prep friendly',
  great_leftovers: '🍱 Great leftovers',
  impressive_presentation: '📸 Impressive presentation',
  budget_friendly: '💰 Budget friendly',
  healthy: '🥗 Healthy',
  comfort_food: '🛋️ Comfort food',
  will_modify: '✏️ Will modify next time',
};

const VISIBILITY_OPTIONS: { value: PostVisibility; icon: React.ElementType; label: string }[] = [
  { value: 'PUBLIC', icon: Globe, label: 'Public' },
  { value: 'FOLLOWERS', icon: Users, label: 'Followers' },
  { value: 'PRIVATE', icon: Lock, label: 'Just me' },
];

export function MadeItModal({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
  recipeImageUrl,
  onSuccess,
}: MadeItModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [wouldMakeAgain, setWouldMakeAgain] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'rating' | 'details'>('rating');

  // New: Sharing state
  const [shareToFeed, setShareToFeed] = useState(true);
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReview = useCreateCookingReview();

  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrl(previewUrl);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('type', 'cooking-post');

      const response = await api.post<{ url: string }>('/image-proxy/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.url;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === null) return;

    setIsSubmitting(true);
    try {
      // Upload photo if selected
      let uploadedPhotoUrl: string | null = null;
      if (photoFile) {
        uploadedPhotoUrl = await uploadPhoto();
      }

      // 1. Create the cooking review (for Flavor DNA)
      await createReview.mutateAsync({
        recipeId,
        rating: rating as 1 | 2 | 3 | 4,
        wouldMakeAgain: wouldMakeAgain ?? undefined,
        tags: Array.from(selectedTags),
        notes: notes.trim() || undefined,
        photoUrl: uploadedPhotoUrl ?? undefined,
      });

      // 2. Create cooking post if sharing is enabled
      if (shareToFeed) {
        const caption = notes.trim()
          ? notes.trim()
          : `Just made "${recipeTitle}"! ${RATING_OPTIONS.find(r => r.value === rating)?.emoji || ''}`;

        await cookingPostsService.createPost({
          recipeId,
          photoUrl: uploadedPhotoUrl ?? recipeImageUrl,
          caption,
          rating: rating as 1 | 2 | 3 | 4,
          visibility,
        });

        toast.success('Posted to your feed!');
      } else {
        toast.success('Review saved!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSelect = (value: number) => {
    setRating(value);
    // Auto-advance to details after a short delay
    setTimeout(() => setStep('details'), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        {/* Header with celebration - more compact */}
        <div className="bg-gradient-to-r from-primary-500 to-amber-500 px-6 py-5 text-center text-white flex-shrink-0">
          <div className="text-3xl mb-1">🎉</div>
          <h2 className="text-lg font-bold">Nice work, Chef!</h2>
          <p className="text-white/80 text-xs mt-0.5 truncate">
            You made "{recipeTitle}"
          </p>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {step === 'rating' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-neutral-800 mb-4">
                  How did it turn out?
                </h3>
                <div className="flex justify-center gap-4">
                  {RATING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRatingSelect(option.value)}
                      className={cn(
                        'flex flex-col items-center p-3 rounded-xl transition-all',
                        rating === option.value
                          ? 'bg-primary-100 scale-110'
                          : 'hover:bg-neutral-100 hover:scale-105'
                      )}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <span className="text-xs text-neutral-600 mt-1">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={onClose}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected rating display - inline */}
              <div className="flex items-center justify-center gap-2 pb-3 border-b">
                <span className="text-xl">
                  {RATING_OPTIONS.find((r) => r.value === rating)?.emoji}
                </span>
                <span className="text-sm text-neutral-600">
                  {RATING_OPTIONS.find((r) => r.value === rating)?.label}
                </span>
                <button
                  onClick={() => setStep('rating')}
                  className="ml-2 text-xs text-primary-600 hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Would make again - more compact */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1.5">
                  Would you make this again?
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWouldMakeAgain(true)}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-sm',
                      wouldMakeAgain === true
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Yes
                  </button>
                  <button
                    onClick={() => setWouldMakeAgain(false)}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-sm',
                      wouldMakeAgain === false
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                    No
                  </button>
                </div>
              </div>

              {/* Tags - fewer shown, smaller */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1.5">
                  What stood out? <span className="text-neutral-400 font-normal">(optional)</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {REVIEW_TAGS.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs transition-all',
                        selectedTags.has(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      )}
                    >
                      {TAG_LABELS[tag] || tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Caption */}
              <div>
                <h4 className="font-medium text-neutral-700 mb-2">
                  {shareToFeed ? 'Caption' : 'Notes'} <span className="text-neutral-400 font-normal">(optional)</span>
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={shareToFeed ? "Share your experience..." : "Any modifications or tips for next time..."}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <h4 className="font-medium text-neutral-700 mb-2">
                  Add a photo <span className="text-neutral-400 font-normal">(optional)</span>
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                {photoUrl ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-neutral-100">
                    <img
                      src={photoUrl}
                      alt="Your cooking"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setPhotoUrl(null);
                        setPhotoFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 transition-all"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-sm">Snap your creation</span>
                  </button>
                )}
              </div>

              {/* Share to Feed Toggle */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary-500" />
                    <span className="font-medium text-neutral-700">Share to feed</span>
                  </div>
                  <button
                    onClick={() => setShareToFeed(!shareToFeed)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      shareToFeed ? 'bg-primary-500' : 'bg-neutral-300'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                        shareToFeed ? 'left-[22px]' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>

                {/* Visibility Selector (only if sharing) */}
                {shareToFeed && (
                  <div className="flex gap-2 mt-3">
                    {VISIBILITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setVisibility(opt.value)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm transition-all',
                            visibility === opt.value
                              ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                              : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      {isUploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : shareToFeed ? (
                    <>
                      <Share2 className="w-4 h-4 mr-1" />
                      Share & Save
                    </>
                  ) : (
                    'Save Review'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
