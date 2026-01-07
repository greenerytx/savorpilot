import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Image, Lock, Globe } from 'lucide-react';
import { Button, Card, Input, useToast } from '../../components/ui';
import { useGroup, useUpdateGroup } from '../../hooks';

export function CollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: collection, isLoading } = useGroup(id || '');
  const updateGroup = useUpdateGroup();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Populate form when collection loads
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setCoverImage(collection.coverImage || '');
      setIsPublic(collection.isPublic);
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id) return;

    try {
      await updateGroup.mutateAsync({
        id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
          isPublic,
        },
      });
      navigate(`/collections/${id}`);
    } catch (error) {
      console.error('Failed to update collection:', error);
      toast.error('Failed to update collection. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Collection not found</h2>
        <Button className="mt-4" onClick={() => navigate('/collections')}>
          Back to Collections
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/collections/${id}`)}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Collection
        </button>
        <h1 className="text-2xl font-display text-primary-900">Edit Collection</h1>
        <div className="w-32" />
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Preview */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cover Image
            </label>
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 mb-3">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-16 h-16 text-primary-400" />
                </div>
              )}
            </div>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Enter a URL for the cover image
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Collection Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weeknight Dinners"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              className="w-full p-3 border border-neutral-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-primary-500" />
              ) : (
                <Lock className="w-5 h-5 text-neutral-500" />
              )}
              <div>
                <p className="font-medium text-neutral-900">
                  {isPublic ? 'Public Collection' : 'Private Collection'}
                </p>
                <p className="text-sm text-neutral-500">
                  {isPublic
                    ? 'Anyone with the link can view this collection'
                    : 'Only you can see this collection'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-primary-500' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/collections/${id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateGroup.isPending}
              className="flex-1"
            >
              {updateGroup.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
