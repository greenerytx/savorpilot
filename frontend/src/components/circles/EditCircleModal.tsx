import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { useUpdateCircle } from '../../hooks/useDinnerCircles';
import type { DinnerCircle } from '../../services/dinner-circles.service';

interface EditCircleModalProps {
  isOpen: boolean;
  circle: DinnerCircle | null;
  onClose: () => void;
  onSuccess: (circle: DinnerCircle) => void;
}

const EMOJI_OPTIONS = [
  '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👩‍👧‍👦', '👨‍👧‍👦',
  '🏠', '🍽️', '❤️', '🥗', '🍳',
  '👨‍🍳', '👩‍🍳', '🌮', '🍕', '🥘',
];

export function EditCircleModal({
  isOpen,
  circle,
  onClose,
  onSuccess,
}: EditCircleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('👨‍👩‍👧‍👦');

  const updateCircle = useUpdateCircle();

  // Populate form when circle changes
  useEffect(() => {
    if (circle) {
      setName(circle.name);
      setDescription(circle.description || '');
      setEmoji(circle.emoji || '👨‍👩‍👧‍👦');
    }
  }, [circle]);

  if (!isOpen || !circle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const updated = await updateCircle.mutateAsync({
        id: circle.id,
        dto: {
          name: name.trim(),
          description: description.trim() || undefined,
          emoji,
        },
      });
      onSuccess(updated);
    } catch (error) {
      console.error('Failed to update circle:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Edit Circle
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emoji picker */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Choose an emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      emoji === e
                        ? 'bg-primary-100 scale-110'
                        : 'hover:bg-neutral-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Circle Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Family Dinners"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description <span className="text-neutral-400">(optional)</span>
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Weekly family meal planning"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!name.trim() || updateCircle.isPending}
              >
                {updateCircle.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
