import React, { useState } from 'react';
import { Star, Globe, Users, Lock, Loader2, X } from 'lucide-react';
import type { PostVisibility, CreateCookingPostDto } from '../../types/cooking-posts.types';
import { useCreateCookingPost } from '../../hooks/useCookingPosts';
import { Dialog, Button } from '../ui';
import { cn } from '../../lib/utils';

interface CreateCookingPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  onSuccess?: () => void;
}

const visibilityOptions: { value: PostVisibility; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'PUBLIC', label: 'Public', icon: <Globe className="h-4 w-4" />, description: 'Anyone can see' },
  { value: 'FOLLOWERS', label: 'Followers', icon: <Users className="h-4 w-4" />, description: 'Only your followers' },
  { value: 'PRIVATE', label: 'Private', icon: <Lock className="h-4 w-4" />, description: 'Only you' },
];

export function CreateCookingPostModal({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
  onSuccess,
}: CreateCookingPostModalProps) {
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>('FOLLOWERS');
  const [photoUrl, setPhotoUrl] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const createPost = useCreateCookingPost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dto: CreateCookingPostDto = {
      recipeId,
      caption: caption.trim() || undefined,
      rating: rating || undefined,
      visibility,
      photoUrl: photoUrl.trim() || undefined,
    };

    try {
      await createPost.mutateAsync(dto);
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleClose = () => {
    setCaption('');
    setRating(null);
    setVisibility('FOLLOWERS');
    setPhotoUrl('');
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="I Made This!">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipe being cooked */}
        <div className="p-3 bg-neutral-100 rounded-lg">
          <p className="text-sm text-neutral-500">You made:</p>
          <p className="font-medium">{recipeTitle}</p>
        </div>

        {/* Photo URL (placeholder for file upload) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Photo URL (optional)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {photoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPhotoUrl('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            Share a photo of your creation
          </p>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? null : star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    (hoverRating !== null ? star <= hoverRating : star <= (rating || 0))
                      ? 'text-yellow-500 fill-current'
                      : 'text-neutral-300'
                  )}
                />
              </button>
            ))}
            {rating && (
              <span className="ml-2 text-sm text-neutral-500">
                {rating} out of 5
              </span>
            )}
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Caption (optional)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your thoughts, tips, or modifications..."
            maxLength={1000}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-neutral-500 text-right">
            {caption.length}/1000
          </p>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Who can see this?</label>
          <div className="space-y-2">
            {visibilityOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  visibility === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="sr-only"
                />
                {option.icon}
                <div className="flex-1">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-neutral-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={createPost.isPending} className="flex-1">
            {createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
