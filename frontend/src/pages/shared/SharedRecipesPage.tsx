import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Search,
  Grid,
  List,
  Users,
  Clock,
  ChefHat,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit3,
  RefreshCw,
  Calendar,
  Trash2,
  MoreHorizontal,
  User,
} from 'lucide-react';
import { Button, Card, Input, Badge, useConfirm, useToast } from '../../components/ui';
import { RecipeCard } from '../../components/recipes/RecipeCard';
import {
  useRecipesSharedWithMe,
  useRecipesSharedByMe,
  useRevokeRecipeShare,
} from '../../hooks';
import type { SharedRecipe } from '../../services/share.service';

type ShareTab = 'with-me' | 'by-me';

export function SharedRecipesPage() {
  const confirmDialog = useConfirm();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ShareTab>('with-me');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: sharedWithMe, isLoading: loadingWithMe } = useRecipesSharedWithMe();
  const { data: sharedByMe, isLoading: loadingByMe } = useRecipesSharedByMe();
  const revokeShare = useRevokeRecipeShare();

  const shares = activeTab === 'with-me' ? sharedWithMe : sharedByMe;
  const isLoading = activeTab === 'with-me' ? loadingWithMe : loadingByMe;

  // Filter by search
  const filteredShares = (shares || []).filter(
    (share) =>
      share.recipeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.sharedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.sharedWithName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRevoke = async (shareId: string) => {
    const confirmed = await confirmDialog({
      title: 'Revoke Share',
      message: 'Are you sure you want to revoke this share?',
      confirmText: 'Revoke',
      variant: 'warning',
    });

    if (confirmed) {
      try {
        await revokeShare.mutateAsync(shareId);
      } catch (error) {
        toast.error('Failed to revoke share');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Shared Recipes</h1>
          <p className="text-neutral-600">Manage recipes shared with you and by you</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('with-me')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'with-me'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          Shared with Me
          {sharedWithMe && sharedWithMe.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sharedWithMe.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('by-me')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'by-me'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Shared by Me
          {sharedByMe && sharedByMe.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sharedByMe.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'with-me'
                ? 'Search by recipe or person who shared...'
                : 'Search by recipe or person you shared with...'
            }
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredShares.length === 0 && (
        <Card className="p-12 text-center">
          <Share2 className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {activeTab === 'with-me' ? 'No shared recipes yet' : "You haven't shared any recipes"}
          </h3>
          <p className="text-neutral-600 mb-6">
            {activeTab === 'with-me'
              ? 'When someone shares a recipe with you, it will appear here'
              : 'Share your recipes with friends and family to see them here'}
          </p>
          <Link to="/recipes">
            <Button variant="outline">Browse Your Recipes</Button>
          </Link>
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && filteredShares.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShares.map((share) => (
            <SharedRecipeCard
              key={share.id}
              share={share}
              isOwner={activeTab === 'by-me'}
              onRevoke={() => handleRevoke(share.id)}
              isRevoking={revokeShare.isPending}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && filteredShares.length > 0 && (
        <div className="space-y-3">
          {filteredShares.map((share) => (
            <SharedRecipeListItem
              key={share.id}
              share={share}
              isOwner={activeTab === 'by-me'}
              onRevoke={() => handleRevoke(share.id)}
              isRevoking={revokeShare.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Shared Recipe Card Component
interface SharedRecipeCardProps {
  share: SharedRecipe;
  isOwner: boolean;
  onRevoke: () => void;
  isRevoking: boolean;
}

function SharedRecipeCard({ share, isOwner, onRevoke, isRevoking }: SharedRecipeCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="overflow-hidden group">
      <Link to={`/recipes/${share.recipeId}`}>
        {/* Image */}
        <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 relative">
          {share.recipeImage ? (
            <img
              src={share.recipeImage}
              alt={share.recipeName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-primary-400" />
            </div>
          )}

          {/* Permissions badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {share.canEdit && (
              <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                Edit
              </span>
            )}
            {share.canReshare && (
              <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Reshare
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
            {share.recipeName}
          </h3>

          {/* Shared info */}
          <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary-600" />
            </div>
            <span className="truncate">
              {isOwner ? `Shared with ${share.sharedWithName}` : `From ${share.sharedByName}`}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
            <Calendar className="w-3 h-3" />
            {new Date(share.sharedAt).toLocaleDateString()}
          </div>
        </div>
      </Link>

      {/* Actions (only for owner) */}
      {isOwner && (
        <div className="px-4 pb-4 relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute bottom-12 left-4 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onRevoke();
                  }}
                  disabled={isRevoking}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Revoke Access
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// Shared Recipe List Item Component
function SharedRecipeListItem({ share, isOwner, onRevoke, isRevoking }: SharedRecipeCardProps) {
  return (
    <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <Link to={`/recipes/${share.recipeId}`} className="flex-shrink-0">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
          {share.recipeImage ? (
            <img
              src={share.recipeImage}
              alt={share.recipeName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary-400" />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link to={`/recipes/${share.recipeId}`}>
          <h3 className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors truncate">
            {share.recipeName}
          </h3>
        </Link>

        {/* Shared info */}
        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-primary-600" />
          </div>
          <span className="truncate">
            {isOwner ? `Shared with ${share.sharedWithName}` : `From ${share.sharedByName}`}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
          {/* Permissions */}
          <div className="flex gap-1">
            {share.canEdit && (
              <Badge variant="secondary" className="text-xs">
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Badge>
            )}
            {share.canReshare && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                Reshare
              </Badge>
            )}
            {!share.canEdit && !share.canReshare && (
              <Badge variant="secondary" className="text-xs">View only</Badge>
            )}
          </div>

          {/* Date */}
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <Calendar className="w-3 h-3" />
            {new Date(share.sharedAt).toLocaleDateString()}
          </span>

          {/* Viewed indicator */}
          {share.viewedAt && !isOwner && (
            <span className="text-xs text-green-600">Viewed</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {isOwner && (
        <button
          onClick={onRevoke}
          disabled={isRevoking}
          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Revoke access"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </Card>
  );
}
