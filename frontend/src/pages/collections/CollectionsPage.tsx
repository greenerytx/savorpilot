import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen,
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Globe,
  ChefHat,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button, Card, Input, Badge, useConfirm, useToast } from '../../components/ui';
import { useGroups, useCreateGroup, useDeleteGroup, useSmartCollections, useInitSystemCollections } from '../../hooks';
import { SmartCollectionCard, CreateSmartCollectionModal } from '../../components/collections';
import type { RecipeGroup, CreateGroupDto } from '../../types/recipe';

// Demo data for UI preview
const USE_DEMO_DATA = false;

const demoCollections: RecipeGroup[] = [
  {
    id: '1',
    userId: 'demo-user',
    name: 'Weeknight Dinners',
    description: 'Quick and easy meals for busy weekdays',
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipeCount: 12,
    recipePreview: [
      { id: '1', title: 'Pasta Carbonara', imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200' },
      { id: '2', title: 'Chicken Stir Fry', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200' },
      { id: '3', title: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200' },
    ],
  },
  {
    id: '2',
    userId: 'demo-user',
    name: 'Holiday Favorites',
    description: 'Special recipes for festive occasions',
    coverImage: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=400',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipeCount: 8,
    recipePreview: [
      { id: '4', title: 'Roast Turkey', imageUrl: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=200' },
      { id: '5', title: 'Pumpkin Pie', imageUrl: 'https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=200' },
    ],
  },
  {
    id: '3',
    userId: 'demo-user',
    name: 'Healthy Eats',
    description: 'Nutritious and delicious recipes',
    coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipeCount: 15,
    recipePreview: [
      { id: '6', title: 'Greek Salad', imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200' },
      { id: '7', title: 'Quinoa Bowl', imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=200' },
      { id: '8', title: 'Smoothie', imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200' },
    ],
  },
  {
    id: '4',
    userId: 'demo-user',
    name: 'Baking Projects',
    description: 'Breads, pastries, and sweet treats',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipeCount: 6,
    recipePreview: [],
  },
];

export function CollectionsPage() {
  const { t } = useTranslation('collections');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Hooks for real data
  const { data: groupsData, isLoading } = useGroups({ search: searchQuery });
  const { data: smartCollections, isLoading: loadingSmartCollections } = useSmartCollections();
  const initSystemCollections = useInitSystemCollections();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();

  // Use demo or real data
  const collections = USE_DEMO_DATA ? demoCollections : (groupsData?.data || []);

  // Filter smart collections by search
  const filteredSmartCollections = (smartCollections || []).filter((sc) =>
    sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter collections by search
  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create collection
  const handleCreateCollection = async (data: CreateGroupDto) => {
    try {
      const newGroup = await createGroup.mutateAsync(data);
      setShowCreateModal(false);
      navigate(`/collections/${newGroup.id}`);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  // Handle delete collection
  const handleDeleteCollection = async (id: string) => {
    const confirmed = await confirm({
      title: t('confirm.deleteTitle'),
      message: t('confirm.deleteMessage'),
      confirmText: t('confirm.deleteButton'),
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteGroup.mutateAsync(id);
      setActiveMenu(null);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error(t('errors.failedToDelete'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">{t('title')}</h1>
          <p className="text-neutral-600">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSmartModal(true)}>
            <Sparkles className="w-4 h-4" />
            {t('actions.smartCollection')}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            {t('actions.newCollection')}
          </Button>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {USE_DEMO_DATA && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm">
            {t('demo.banner')}
          </p>
        </div>
      )}

      {/* Smart Collections Section */}
      {filteredSmartCollections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-900">{t('smart.title')}</h2>
              <Badge variant="secondary" className="text-xs">{t('smart.autoUpdated')}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSmartCollections.map((sc) => (
              <SmartCollectionCard key={sc.id} collection={sc} />
            ))}
          </div>
        </div>
      )}

      {/* Initialize Smart Collections Prompt */}
      {!loadingSmartCollections && smartCollections?.length === 0 && (
        <Card className="p-6 bg-gradient-to-br from-primary-50 to-purple-50 border-primary-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900">{t('smart.tryTitle')}</h3>
              <p className="text-sm text-neutral-600 mt-1">
                {t('smart.tryDescription')}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => initSystemCollections.mutate()}
                  disabled={initSystemCollections.isPending}
                >
                  {initSystemCollections.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('smart.settingUp')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('smart.setupDefaults')}
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSmartModal(true)}>
                  {t('smart.createCustom')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Manual Collections Header */}
      {filteredCollections.length > 0 && filteredSmartCollections.length > 0 && (
        <div className="flex items-center gap-2 pt-4">
          <FolderOpen className="w-5 h-5 text-neutral-500" />
          <h2 className="text-lg font-semibold text-neutral-900">{t('manual.title')}</h2>
        </div>
      )}

      {/* Empty State */}
      {filteredCollections.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('empty.title')}</h3>
          <p className="text-neutral-600 mb-6">
            {t('empty.description')}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            {t('actions.createCollection')}
          </Button>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredCollections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onNavigate={() => navigate(`/collections/${collection.id}`)}
              onEdit={() => navigate(`/collections/${collection.id}/edit`)}
              onDelete={() => handleDeleteCollection(collection.id)}
              isMenuOpen={activeMenu === collection.id}
              onMenuToggle={() => setActiveMenu(activeMenu === collection.id ? null : collection.id)}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredCollections.length > 0 && (
        <div className="space-y-3">
          {filteredCollections.map((collection) => (
            <CollectionListItem
              key={collection.id}
              collection={collection}
              onNavigate={() => navigate(`/collections/${collection.id}`)}
              onEdit={() => navigate(`/collections/${collection.id}/edit`)}
              onDelete={() => handleDeleteCollection(collection.id)}
              isMenuOpen={activeMenu === collection.id}
              onMenuToggle={() => setActiveMenu(activeMenu === collection.id ? null : collection.id)}
            />
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCollection}
          isLoading={createGroup.isPending}
        />
      )}

      {/* Create Smart Collection Modal */}
      <CreateSmartCollectionModal
        isOpen={showSmartModal}
        onClose={() => setShowSmartModal(false)}
      />
    </div>
  );
}

// Collection Card Component
interface CollectionCardProps {
  collection: RecipeGroup;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

function CollectionCard({ collection, onNavigate, onEdit, onDelete, isMenuOpen, onMenuToggle }: CollectionCardProps) {
  const { t } = useTranslation('collections');
  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={onNavigate}>
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-200">
        {collection.coverImage ? (
          <img
            src={collection.coverImage}
            alt={collection.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-16 h-16 text-primary-400" />
          </div>
        )}

        {/* Recipe Preview Overlay */}
        {collection.recipePreview && collection.recipePreview.length > 0 && (
          <div className="absolute bottom-2 left-2 flex -space-x-3">
            {collection.recipePreview.slice(0, 3).map((recipe, idx) => (
              <div
                key={recipe.id}
                className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-neutral-100"
                style={{ zIndex: 3 - idx }}
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-neutral-400" />
                  </div>
                )}
              </div>
            ))}
            {(collection.recipeCount || 0) > 3 && (
              <div className="w-10 h-10 rounded-lg border-2 border-white bg-neutral-800 flex items-center justify-center text-white text-xs font-medium">
                +{(collection.recipeCount || 0) - 3}
              </div>
            )}
          </div>
        )}

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-neutral-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onEdit}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {t('actions.edit')}
              </button>
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('actions.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 line-clamp-1">{collection.name}</h3>
          {collection.isPublic ? (
            <Globe className="w-4 h-4 text-primary-500 flex-shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          )}
        </div>
        {collection.description && (
          <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{collection.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            {t('card.recipes', { count: collection.recipeCount || 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}

// Collection List Item Component
interface CollectionListItemProps {
  collection: RecipeGroup;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

function CollectionListItem({ collection, onNavigate, onEdit, onDelete, isMenuOpen, onMenuToggle }: CollectionListItemProps) {
  const { t } = useTranslation('collections');
  return (
    <Card
      className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onNavigate}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0 overflow-hidden">
        {collection.coverImage ? (
          <img
            src={collection.coverImage}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-primary-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-900 truncate">{collection.name}</h3>
          {collection.isPublic ? (
            <Badge variant="primary" className="text-xs">{t('card.public')}</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">{t('card.private')}</Badge>
          )}
        </div>
        {collection.description && (
          <p className="text-sm text-neutral-600 truncate mt-0.5">{collection.description}</p>
        )}
        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            {t('card.recipes', { count: collection.recipeCount || 0 })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {t('card.updated', { date: new Date(collection.updatedAt).toLocaleDateString() })}
          </span>
        </div>
      </div>

      {/* Menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {t('actions.edit')}
            </button>
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('actions.delete')}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// Create Collection Modal Component
interface CreateCollectionModalProps {
  onClose: () => void;
  onCreate: (data: CreateGroupDto) => void;
  isLoading: boolean;
}

function CreateCollectionModal({ onClose, onCreate, isLoading }: CreateCollectionModalProps) {
  const { t } = useTranslation('collections');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() || undefined, isPublic });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('create.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('create.nameLabel')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('create.namePlaceholder')}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('create.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('create.descriptionPlaceholder')}
              className="w-full p-3 border border-neutral-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-primary-500' : 'bg-neutral-200'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-neutral-900">{t('create.publicLabel')}</p>
              <p className="text-xs text-neutral-500">{t('create.publicDescription')}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('create.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading} className="flex-1">
              {isLoading ? t('create.creating') : t('create.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
