import { useState, useRef } from 'react';
import {
  Camera,
  Link2,
  ChefHat,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  X,
  Globe,
  Users,
  Lock,
  ChevronDown,
  Search,
  Clock,
  Upload,
  Loader2,
} from 'lucide-react';
import { cn, getImageUrl } from '../../lib/utils';
import { useCreateSocialPost } from '../../hooks/useSocialPosts';
import { useRecipes } from '../../hooks';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import type { SocialPostType, SocialPostVisibility } from '../../types/social-post';

const postTypes: { type: SocialPostType; label: string; icon: React.FC<{ className?: string }>; placeholder: string }[] = [
  {
    type: 'GENERAL',
    label: 'Discussion',
    icon: MessageSquare,
    placeholder: 'Share your culinary adventure...',
  },
  {
    type: 'COOKING_UPDATE',
    label: 'Made This',
    icon: ChefHat,
    placeholder: "What did you cook today? Link a recipe below!",
  },
  {
    type: 'QUESTION',
    label: 'Question',
    icon: HelpCircle,
    placeholder: 'Ask the community for help...',
  },
  {
    type: 'TIP',
    label: 'Tip',
    icon: Lightbulb,
    placeholder: 'Share a cooking tip or trick...',
  },
  {
    type: 'PHOTO',
    label: 'Photo',
    icon: Camera,
    placeholder: 'Share a food photo...',
  },
];

const visibilityOptions: { value: SocialPostVisibility; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'FOLLOWERS', label: 'Followers', icon: Users },
  { value: 'PRIVATE', label: 'Only Me', icon: Lock },
];

interface SocialPostComposerProps {
  onPostCreated?: () => void;
}

export function SocialPostComposer({ onPostCreated }: SocialPostComposerProps) {
  const { user } = useAuthStore();
  const createMutation = useCreateSocialPost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<SocialPostType>('GENERAL');
  const [visibility, setVisibility] = useState<SocialPostVisibility>('PUBLIC');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: string; title: string; imageUrl?: string } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');

  // Fetch user's recipes for the selector
  const { data: recipesData } = useRecipes({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
  const recipes = recipesData?.data || [];
  const filteredRecipes = recipes.filter(r =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const selectedPostType = postTypes.find((pt) => pt.type === postType) || postTypes[0];
  const selectedVisibility = visibilityOptions.find((v) => v.value === visibility) || visibilityOptions[0];
  const VisibilityIcon = selectedVisibility.icon;

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      await createMutation.mutateAsync({
        postType,
        content: content.trim(),
        imageUrl: imageUrl || undefined,
        recipeId: selectedRecipe?.id,
        visibility,
      });

      // Reset form
      setContent('');
      setPostType('GENERAL');
      setImageUrl('');
      setShowImageOptions(false);
      setShowUrlInput(false);
      setSelectedRecipe(null);
      setIsExpanded(false);
      onPostCreated?.();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleCameraClick = () => {
    setIsExpanded(true);
    if (imageUrl) {
      // If there's already an image, clear it
      setImageUrl('');
      setShowImageOptions(false);
      setShowUrlInput(false);
    } else {
      // Show image options dropdown
      setShowImageOptions(!showImageOptions);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowImageOptions(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<{ imageUrl: string }>('/image-proxy/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageUrl(response.data.imageUrl);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlOption = () => {
    setShowImageOptions(false);
    setShowUrlInput(true);
  };

  const handleUploadOption = () => {
    setShowImageOptions(false);
    fileInputRef.current?.click();
  };

  const handleRecipeLinkClick = () => {
    setIsExpanded(true);
    setShowRecipeSelector(!showRecipeSelector);
  };

  const handleSelectRecipe = (recipe: { id: string; title: string; imageUrl?: string }) => {
    setSelectedRecipe(recipe);
    setShowRecipeSelector(false);
    setRecipeSearch('');
  };

  const handleRemoveRecipe = () => {
    setSelectedRecipe(null);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setShowUrlInput(false);
    setShowImageOptions(false);
  };

  const getAuthorInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.[0] || '?'}${user.lastName?.[0] || '?'}`.toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-4 transition-shadow hover:shadow-md">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-coral-600 flex items-center justify-center text-white font-bold shrink-0">
          {getAuthorInitials()}
        </div>

        <div className="flex-1">
          {/* Post Type Selector - Show when expanded */}
          {isExpanded && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {postTypes.map((pt) => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.type}
                    onClick={() => setPostType(pt.type)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                      postType === pt.type
                        ? 'bg-primary-900 text-white'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {pt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input */}
          <textarea
            placeholder={selectedPostType.placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 3 : 1}
            className="w-full bg-primary-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-coral-500 transition-all placeholder:text-primary-400 resize-none"
          />

          {/* Image URL Input */}
          {isExpanded && showUrlInput && !imageUrl && (
            <div className="mt-2 relative">
              <input
                type="url"
                placeholder="Paste image URL here..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-primary-50 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-coral-500 pr-10"
                autoFocus
              />
              <button
                onClick={() => setShowUrlInput(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Uploading indicator */}
          {isUploading && (
            <div className="mt-2 flex items-center gap-2 text-sm text-primary-500 bg-primary-50 rounded-lg px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading image...
            </div>
          )}

          {/* Preview Image */}
          {imageUrl && !isUploading && (
            <div className="mt-2 relative rounded-lg overflow-hidden max-h-48">
              <img
                src={imageUrl.startsWith('/') ? getImageUrl(imageUrl) : imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImageUrl('')}
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Recipe Selector Dropdown */}
          {isExpanded && showRecipeSelector && (
            <div className="mt-2 bg-primary-50 rounded-lg p-3 border border-primary-100">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  type="text"
                  placeholder="Search your recipes..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="w-full bg-white border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-coral-500"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredRecipes.length === 0 ? (
                  <p className="text-sm text-primary-400 text-center py-4">
                    {recipes.length === 0 ? 'No recipes yet' : 'No matching recipes'}
                  </p>
                ) : (
                  filteredRecipes.slice(0, 10).map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe({
                        id: recipe.id,
                        title: recipe.title,
                        imageUrl: recipe.imageUrl,
                      })}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-200 shrink-0">
                        {recipe.imageUrl ? (
                          <img
                            src={getImageUrl(recipe.imageUrl)}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-primary-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-900 truncate">{recipe.title}</p>
                        {recipe.totalTimeMinutes && (
                          <p className="text-xs text-primary-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {recipe.totalTimeMinutes}m
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowRecipeSelector(false)}
                className="mt-2 w-full text-xs text-primary-500 hover:text-primary-700 py-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Selected Recipe Preview */}
          {selectedRecipe && !showRecipeSelector && (
            <div className="mt-2 flex items-center gap-3 bg-coral-50 rounded-lg p-2 border border-coral-100">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-coral-200 shrink-0">
                {selectedRecipe.imageUrl ? (
                  <img
                    src={getImageUrl(selectedRecipe.imageUrl)}
                    alt={selectedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-coral-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-coral-600 font-medium">Linked Recipe</p>
                <p className="text-sm font-semibold text-primary-900 truncate">{selectedRecipe.title}</p>
              </div>
              <button
                onClick={handleRemoveRecipe}
                className="p-1 text-coral-400 hover:text-coral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Prompt to link recipe for "Made This" posts */}
          {isExpanded && postType === 'COOKING_UPDATE' && !selectedRecipe && !showRecipeSelector && (
            <button
              onClick={() => setShowRecipeSelector(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm text-coral-600 bg-coral-50 hover:bg-coral-100 rounded-lg border border-dashed border-coral-200 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Link a recipe you made (optional)
            </button>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2">
              {/* Camera button with dropdown */}
              <div className="relative">
                <button
                  onClick={handleCameraClick}
                  disabled={isUploading}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    showImageOptions || imageUrl
                      ? 'text-coral-500 bg-coral-50'
                      : 'text-primary-400 hover:text-coral-500 hover:bg-coral-50',
                    isUploading && 'opacity-50 cursor-not-allowed'
                  )}
                  title="Add photo"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Image options dropdown */}
                {showImageOptions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowImageOptions(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-primary-100 py-1 z-20">
                      <button
                        onClick={handleUploadOption}
                        className="w-full px-3 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload from device
                      </button>
                      <button
                        onClick={handleUrlOption}
                        className="w-full px-3 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        Paste image URL
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleRecipeLinkClick}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  showRecipeSelector || selectedRecipe
                    ? 'text-coral-500 bg-coral-50'
                    : 'text-primary-400 hover:text-coral-500 hover:bg-coral-50'
                )}
                title="Link recipe"
              >
                <Link2 className="w-5 h-5" />
              </button>

              {/* Visibility Selector */}
              {isExpanded && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <VisibilityIcon className="w-3.5 h-3.5" />
                    {selectedVisibility.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showVisibilityMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowVisibilityMenu(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-primary-100 py-1 z-20">
                        {visibilityOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setVisibility(option.value);
                                setShowVisibilityMenu(false);
                              }}
                              className={cn(
                                'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-50',
                                visibility === option.value
                                  ? 'text-coral-600 font-medium'
                                  : 'text-primary-700'
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!content.trim() || createMutation.isPending || isUploading}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-bold transition-colors',
                content.trim() && !createMutation.isPending && !isUploading
                  ? 'bg-primary-900 text-white hover:bg-primary-800'
                  : 'bg-primary-200 text-primary-400 cursor-not-allowed'
              )}
            >
              {createMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
