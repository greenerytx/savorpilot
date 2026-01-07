import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Instagram,
  RefreshCw,
  Search,
  Grid,
  List,
  CheckSquare,
  Square,
  Trash2,
  Download,
  ChevronDown,
  X,
  Loader2,
  Filter,
  HelpCircle,
  Puzzle,
} from 'lucide-react';
import { Button, Input, Card, useToast } from '../../components/ui';
import {
  useSavedPosts,
  useSavedPostFilters,
  useDismissPosts,
  useRestorePost,
  useBulkImport,
  useDeletePosts,
  useDeleteAllByStatus,
} from '../../hooks/useInstagram';
import { instagramService } from '../../services/instagram.service';
import { SavedPostCard, ImportModal, ImportProgressModal, ExtensionHelpModal, CaptionPreviewModal } from '../../components/instagram';
import { useBackgroundJobs } from '../../contexts/BackgroundJobsContext';
import type { SavedInstagramPost, SavedPostStatus, SavedPostsQuery, SortField, SortOrder } from '../../types/instagram';

type TabStatus = 'all' | 'in_progress' | SavedPostStatus;

const TAB_KEYS: TabStatus[] = ['all', 'PENDING', 'in_progress', 'IMPORTED', 'DISMISSED'];

// Maximum posts allowed per bulk import (must match backend limit)
const BULK_IMPORT_LIMIT = 50;

export function SavedPostsPage() {
  const { t } = useTranslation('instagram');
  const navigate = useNavigate();
  const toast = useToast();

  // Tab labels with translations
  const tabs = useMemo(() => [
    { value: 'all' as TabStatus, label: t('savedPosts.tabs.all') },
    { value: 'PENDING' as TabStatus, label: t('savedPosts.tabs.pending') },
    { value: 'in_progress' as TabStatus, label: t('savedPosts.tabs.inProgress') },
    { value: 'IMPORTED' as TabStatus, label: t('savedPosts.tabs.imported') },
    { value: 'DISMISSED' as TabStatus, label: t('savedPosts.tabs.dismissed') },
  ], [t]);

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('fetchedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  // Selection state
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Modal state
  const [importingPost, setImportingPost] = useState<SavedInstagramPost | null>(null);
  const [bulkImportJobId, setBulkImportJobId] = useState<string | null>(null);
  const [showExtensionHelp, setShowExtensionHelp] = useState(false);

  // Preview modal state - supports navigation across all pending posts
  const [previewingPostId, setPreviewingPostId] = useState<string | null>(null);
  const [allPendingIds, setAllPendingIds] = useState<string[]>([]);
  const [previewPost, setPreviewPost] = useState<SavedInstagramPost | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const postCacheRef = useRef<Map<string, SavedInstagramPost>>(new Map());

  // Refs to avoid stale closures in callbacks
  const previewingPostIdRef = useRef<string | null>(null);
  const allPendingIdsRef = useRef<string[]>([]);
  const selectedPostsRef = useRef<Set<string>>(new Set());

  // Build query
  const query: SavedPostsQuery = useMemo(
    () => ({
      // For 'in_progress' tab, we query PENDING posts and filter client-side
      status: activeTab === 'all' ? undefined : (activeTab === 'in_progress' ? 'PENDING' : activeTab),
      search: searchQuery || undefined,
      ownerUsername: selectedUsername || undefined,
      collectionName: selectedCollection || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 20,
    }),
    [activeTab, searchQuery, selectedUsername, selectedCollection, sortBy, sortOrder, page]
  );

  // Fetch data
  const { data: postsData, isLoading, isError, refetch } = useSavedPosts(query);
  // Pass active tab to filters hook so author/collection counts reflect current tab
  const { data: filters } = useSavedPostFilters(activeTab === 'all' ? undefined : activeTab);

  // Background jobs (for in-progress filtering)
  const { inProgressPostIds, hasActiveJobs, addBackgroundJob } = useBackgroundJobs();

  // Filter posts based on in-progress state
  const filteredPosts = useMemo(() => {
    if (!postsData?.posts) return [];

    if (activeTab === 'in_progress') {
      // Show only posts that are currently being imported
      return postsData.posts.filter(post => inProgressPostIds.has(post.id));
    }

    if (activeTab === 'PENDING') {
      // Hide posts that are being imported from Pending view
      return postsData.posts.filter(post => !inProgressPostIds.has(post.id));
    }

    // For other tabs, show all posts
    return postsData.posts;
  }, [postsData?.posts, activeTab, inProgressPostIds]);

  // Mutations
  const dismissPosts = useDismissPosts();
  const restorePost = useRestorePost();
  const bulkImport = useBulkImport();
  const deletePosts = useDeletePosts();
  const deleteAllByStatus = useDeleteAllByStatus();

  // Confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllStatus, setDeleteAllStatus] = useState<string | null>(null);
  const [isSelectingAll, setIsSelectingAll] = useState(false);

  // Selection handlers
  const handleSelectPost = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedPosts);
    if (selected) {
      // Enforce bulk import limit
      if (newSelected.size >= BULK_IMPORT_LIMIT) {
        toast.error(`Maximum ${BULK_IMPORT_LIMIT} posts can be selected for bulk import`);
        return;
      }
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedPosts(newSelected);
  };

  const handleSelectAllOnPage = () => {
    if (!filteredPosts.length) return;
    const pendingPosts = filteredPosts.filter((p) => p.status === 'PENDING' && !inProgressPostIds.has(p.id));
    if (selectedPosts.size === pendingPosts.length) {
      setSelectedPosts(new Set());
    } else {
      // Limit to BULK_IMPORT_LIMIT
      const idsToSelect = pendingPosts.slice(0, BULK_IMPORT_LIMIT).map((p) => p.id);
      if (pendingPosts.length > BULK_IMPORT_LIMIT) {
        toast.info(`Selected first ${BULK_IMPORT_LIMIT} posts (maximum for bulk import)`);
      }
      setSelectedPosts(new Set(idsToSelect));
    }
  };

  const handleSelectAllPending = async () => {
    setIsSelectingAll(true);
    try {
      const result = await instagramService.getPostIdsByFilters({ status: 'PENDING' });
      // Limit to BULK_IMPORT_LIMIT
      const idsToSelect = result.ids.slice(0, BULK_IMPORT_LIMIT);
      if (result.ids.length > BULK_IMPORT_LIMIT) {
        toast.info(`Selected first ${BULK_IMPORT_LIMIT} of ${result.ids.length} posts (maximum for bulk import)`);
      }
      setSelectedPosts(new Set(idsToSelect));
    } catch (error) {
      console.error('Failed to select all:', error);
    } finally {
      setIsSelectingAll(false);
    }
  };

  const handleSelectAllFiltered = async () => {
    setIsSelectingAll(true);
    try {
      const result = await instagramService.getPostIdsByFilters({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
        ownerUsername: selectedUsername || undefined,
        collectionName: selectedCollection || undefined,
      });
      // Limit to BULK_IMPORT_LIMIT
      const idsToSelect = result.ids.slice(0, BULK_IMPORT_LIMIT);
      if (result.ids.length > BULK_IMPORT_LIMIT) {
        toast.info(`Selected first ${BULK_IMPORT_LIMIT} of ${result.ids.length} posts (maximum for bulk import)`);
      }
      setSelectedPosts(new Set(idsToSelect));
    } catch (error) {
      console.error('Failed to select all filtered:', error);
    } finally {
      setIsSelectingAll(false);
    }
  };

  const clearSelection = () => {
    setSelectedPosts(new Set());
    setSelectMode(false);
  };

  // Action handlers
  const handleDismissSelected = () => {
    if (selectedPosts.size === 0) return;
    dismissPosts.mutate(Array.from(selectedPosts), {
      onSuccess: () => clearSelection(),
    });
  };

  const handleDeleteSelected = () => {
    if (selectedPosts.size === 0) return;
    deletePosts.mutate(Array.from(selectedPosts), {
      onSuccess: () => {
        clearSelection();
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleDeleteAllByStatus = (status: string) => {
    deleteAllByStatus.mutate(status, {
      onSuccess: () => {
        setShowDeleteAllConfirm(false);
        setDeleteAllStatus(null);
      },
    });
  };

  const handleBulkImport = () => {
    if (selectedPosts.size === 0) return;

    // Validate limit before sending
    if (selectedPosts.size > BULK_IMPORT_LIMIT) {
      toast.error(`Maximum ${BULK_IMPORT_LIMIT} posts can be imported at once. Please deselect some posts.`);
      return;
    }

    // Send all selected post IDs - backend validates they are PENDING
    const postIds = Array.from(selectedPosts);

    bulkImport.mutate(
      { postIds },
      {
        onSuccess: (data) => {
          // Add to background tracking immediately so posts move to "In Progress" tab
          addBackgroundJob(data.jobId, 'import', postIds);
          setBulkImportJobId(data.jobId);
          clearSelection();
        },
        onError: (error: any) => {
          // Show error message to user
          const message = error?.response?.data?.message || error.message || 'Failed to start bulk import';
          toast.error(message);
          console.error('Bulk import failed:', message);
        },
      }
    );
  };

  const handleImportSuccess = (recipeId: string) => {
    setImportingPost(null);
    navigate(`/recipes/${recipeId}`);
  };

  const handleClearFilters = () => {
    setSelectedUsername(null);
    setSelectedCollection(null);
    setSearchQuery('');
    setSortBy('fetchedAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = selectedUsername || selectedCollection || searchQuery || sortBy !== 'fetchedAt' || sortOrder !== 'desc';

  // Keep refs in sync with state to avoid stale closures
  useEffect(() => {
    previewingPostIdRef.current = previewingPostId;
  }, [previewingPostId]);

  useEffect(() => {
    allPendingIdsRef.current = allPendingIds;
  }, [allPendingIds]);

  useEffect(() => {
    selectedPostsRef.current = selectedPosts;
  }, [selectedPosts]);

  // Redirect away from "in_progress" tab when there are no active jobs
  useEffect(() => {
    if (activeTab === 'in_progress' && !hasActiveJobs) {
      setActiveTab('PENDING');
    }
  }, [activeTab, hasActiveJobs]);

  // Preview modal helpers - supports navigation across ALL pending posts
  const previewIndex = useMemo(
    () => allPendingIds.indexOf(previewingPostId || ''),
    [allPendingIds, previewingPostId]
  );

  // Load a post and set it as the preview post
  const loadAndSetPreviewPost = useCallback(async (postId: string) => {
    // Check cache first
    const cached = postCacheRef.current.get(postId);
    if (cached) {
      setPreviewPost(cached);
      return cached;
    }

    // Check if in current page data
    const pagePost = postsData?.posts.find(p => p.id === postId);
    if (pagePost) {
      postCacheRef.current.set(postId, pagePost);
      setPreviewPost(pagePost);
      return pagePost;
    }

    // Fetch from API
    setIsLoadingPreview(true);
    try {
      const post = await instagramService.getSavedPost(postId);
      postCacheRef.current.set(postId, post);
      setPreviewPost(post);
      return post;
    } catch (error) {
      console.error('Failed to load post:', error);
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  }, [postsData?.posts]);

  // Open preview - fetch all pending IDs and load the clicked post
  const openPreview = useCallback(async (postId: string) => {
    setPreviewingPostId(postId);
    previewingPostIdRef.current = postId;
    setIsLoadingPreview(true);

    try {
      // Load the clicked post
      await loadAndSetPreviewPost(postId);

      // Fetch ALL pending post IDs (no filters - navigate through everything)
      console.log('[openPreview] Fetching all pending post IDs...');
      const result = await instagramService.getPostIdsByFilters({
        status: 'PENDING',
      });
      console.log('[openPreview] Got pending IDs:', result.count, result.ids);
      setAllPendingIds(result.ids);
      allPendingIdsRef.current = result.ids;
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [loadAndSetPreviewPost]);

  // Navigate to next/prev post - uses refs to avoid stale closures
  const handlePreviewNext = useCallback(async () => {
    const currentPostId = previewingPostIdRef.current;
    const pendingIds = allPendingIdsRef.current;
    const currentIdx = pendingIds.indexOf(currentPostId || '');

    if (currentIdx < pendingIds.length - 1) {
      const nextId = pendingIds[currentIdx + 1];
      setPreviewingPostId(nextId);
      previewingPostIdRef.current = nextId;
      await loadAndSetPreviewPost(nextId);
    }
  }, [loadAndSetPreviewPost]);

  const handlePreviewPrev = useCallback(async () => {
    const currentPostId = previewingPostIdRef.current;
    const pendingIds = allPendingIdsRef.current;
    const currentIdx = pendingIds.indexOf(currentPostId || '');

    if (currentIdx > 0) {
      const prevId = pendingIds[currentIdx - 1];
      setPreviewingPostId(prevId);
      previewingPostIdRef.current = prevId;
      await loadAndSetPreviewPost(prevId);
    }
  }, [loadAndSetPreviewPost]);

  // Dismiss and advance - uses refs to avoid stale closures
  const handlePreviewDismiss = useCallback(async () => {
    const currentPostId = previewingPostIdRef.current;
    const pendingIds = allPendingIdsRef.current;

    if (!currentPostId) return;

    const currentIdx = pendingIds.indexOf(currentPostId);

    // Remove from pending IDs list
    const newPendingIds = pendingIds.filter(id => id !== currentPostId);
    setAllPendingIds(newPendingIds);
    allPendingIdsRef.current = newPendingIds;

    dismissPosts.mutate([currentPostId]);

    // Auto-advance to next, or prev, or close
    if (currentIdx < newPendingIds.length && newPendingIds.length > 0) {
      const nextId = newPendingIds[currentIdx];
      setPreviewingPostId(nextId);
      previewingPostIdRef.current = nextId;
      await loadAndSetPreviewPost(nextId);
    } else if (newPendingIds.length > 0) {
      const prevId = newPendingIds[newPendingIds.length - 1];
      setPreviewingPostId(prevId);
      previewingPostIdRef.current = prevId;
      await loadAndSetPreviewPost(prevId);
    } else {
      setPreviewingPostId(null);
      previewingPostIdRef.current = null;
      setPreviewPost(null);
    }
  }, [dismissPosts, loadAndSetPreviewPost]);

  // Add to queue and advance - uses refs to avoid stale closures
  const handlePreviewAddToQueue = useCallback(async () => {
    const currentPostId = previewingPostIdRef.current;
    const pendingIds = allPendingIdsRef.current;

    if (!currentPostId) return;

    // Check bulk import limit
    if (selectedPostsRef.current.size >= BULK_IMPORT_LIMIT) {
      toast.error(`Maximum ${BULK_IMPORT_LIMIT} posts can be selected for bulk import`);
      return;
    }

    const currentIdx = pendingIds.indexOf(currentPostId);
    console.log('[Queue] Current index:', currentIdx, 'of', pendingIds.length);

    // Add to selection using ref for immediate update (avoids React batching delays)
    const newSet = new Set(selectedPostsRef.current);
    newSet.add(currentPostId);
    selectedPostsRef.current = newSet;
    console.log('[Queue] Adding:', currentPostId, 'New size:', newSet.size);

    // Update state for React to re-render
    setSelectedPosts(newSet);
    setSelectMode(true);

    // Auto-advance to next only (don't go backwards - that causes bouncing)
    if (currentIdx < pendingIds.length - 1) {
      const nextId = pendingIds[currentIdx + 1];
      setPreviewingPostId(nextId);
      previewingPostIdRef.current = nextId;
      await loadAndSetPreviewPost(nextId);
    } else {
      // At the last post - close the modal
      console.log('[Queue] At last post, closing modal');
      setPreviewingPostId(null);
      previewingPostIdRef.current = null;
      setPreviewPost(null);
    }
  }, [loadAndSetPreviewPost, toast]);

  // Import single post
  const handlePreviewImport = useCallback(() => {
    if (!previewPost) return;
    setPreviewingPostId(null);
    setImportingPost(previewPost);
  }, [previewPost]);

  // Clear preview when closing modal
  const handleClosePreview = useCallback(() => {
    setPreviewingPostId(null);
    previewingPostIdRef.current = null;
    setPreviewPost(null);
    setAllPendingIds([]);
    allPendingIdsRef.current = [];
    postCacheRef.current.clear();
  }, []);

  // Get count for current tab
  const getTabCount = (status: TabStatus) => {
    if (status === 'in_progress') {
      return inProgressPostIds.size > 0 ? inProgressPostIds.size : null;
    }
    if (!filters) return null;
    if (status === 'all') {
      return filters.statusCounts.reduce((sum, s) => sum + s.count, 0);
    }
    const count = filters.statusCounts.find((s) => s.status === status)?.count || 0;
    // Subtract in-progress posts from PENDING count
    if (status === 'PENDING') {
      return Math.max(0, count - inProgressPostIds.size);
    }
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">{t('savedPosts.title')}</h1>
          <p className="text-neutral-600">{t('savedPosts.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowExtensionHelp(true)}>
            <Puzzle className="w-4 h-4" />
            {t('savedPosts.getExtension')}
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('savedPosts.refresh')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <div className="flex gap-2 flex-1">
          {tabs
            .filter((tab) => tab.value !== 'in_progress' || hasActiveJobs)
            .map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.value
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
                {getTabCount(tab.value) !== null && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    tab.value === 'in_progress'
                      ? 'bg-primary-100 text-primary-600 animate-pulse'
                      : 'bg-neutral-100'
                  }`}>
                    {getTabCount(tab.value)}
                  </span>
                )}
              </button>
            ))}
        </div>
        {/* Quick actions based on active tab */}
        {activeTab === 'DISMISSED' && (getTabCount('DISMISSED') || 0) > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDeleteAllStatus('DISMISSED');
              setShowDeleteAllConfirm(true);
            }}
            className="text-red-600 border-red-200 hover:bg-red-50 mb-1"
          >
            <Trash2 className="w-4 h-4" />
            {t('savedPosts.deleteAllDismissed')}
          </Button>
        )}
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t('savedPosts.searchPlaceholder')}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters || hasActiveFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : ''}
          >
            <Filter className="w-4 h-4" />
            {t('savedPosts.filters')}
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) clearSelection();
            }}
            className={selectMode ? 'bg-primary-50 border-primary-200 text-primary-600' : ''}
          >
            {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {t('savedPosts.select')}
          </Button>
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

      {/* Filters panel */}
      {showFilters && filters && (
        <Card className="p-4 flex items-center gap-4 flex-wrap">
          {/* Username filter */}
          <div className="relative">
            <select
              value={selectedUsername || ''}
              onChange={(e) => {
                setSelectedUsername(e.target.value || null);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">{t('savedPosts.filterOptions.allAccounts')}</option>
              {filters.usernames.map((u) => (
                <option key={u.username} value={u.username}>
                  @{u.username} ({u.count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Collection filter */}
          {filters.collections.length > 0 && (
            <div className="relative">
              <select
                value={selectedCollection || ''}
                onChange={(e) => {
                  setSelectedCollection(e.target.value || null);
                  setPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">{t('savedPosts.filterOptions.allCollections')}</option>
                {filters.collections.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          )}

          {/* Sort by */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{t('savedPosts.sort.label')}</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortField);
                  setPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="fetchedAt">{t('savedPosts.sort.dateAdded')}</option>
                <option value="postedAt">{t('savedPosts.sort.datePosted')}</option>
                <option value="ownerUsername">{t('savedPosts.sort.account')}</option>
                <option value="likeCount">{t('savedPosts.sort.likes')}</option>
                <option value="commentCount">{t('savedPosts.sort.comments')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border rounded-lg bg-white hover:bg-neutral-50 text-sm"
              title={sortOrder === 'asc' ? t('savedPosts.sort.ascending') : t('savedPosts.sort.descending')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
              {t('savedPosts.clearFilters')}
            </button>
          )}
        </Card>
      )}

      {/* Selection actions */}
      {selectMode && (
        <Card className="p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-neutral-700">
            {selectedPosts.size} / {BULK_IMPORT_LIMIT} {t('savedPosts.selection.selected', { count: selectedPosts.size }).replace(/^\d+\s*/, '')}
            {selectedPosts.size >= BULK_IMPORT_LIMIT && (
              <span className="ml-2 text-amber-600">(limit reached)</span>
            )}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAllOnPage}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {selectedPosts.size === filteredPosts.filter((p) => p.status === 'PENDING' && !inProgressPostIds.has(p.id)).length
                ? t('savedPosts.selection.deselectPage')
                : t('savedPosts.selection.selectPage')}
            </button>
            <span className="text-neutral-300">|</span>
            {hasActiveFilters ? (
              <button
                onClick={handleSelectAllFiltered}
                disabled={isSelectingAll}
                className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {isSelectingAll ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('savedPosts.selection.loading')}
                  </span>
                ) : (
                  t('savedPosts.selection.selectAllFiltered', { count: postsData?.total || 0 })
                )}
              </button>
            ) : (
              <button
                onClick={handleSelectAllPending}
                disabled={isSelectingAll}
                className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {isSelectingAll ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('savedPosts.selection.loading')}
                  </span>
                ) : (
                  t('savedPosts.selection.selectAllPending', { count: filters?.statusCounts.find(s => s.status === 'PENDING')?.count || 0 })
                )}
              </button>
            )}
            {selectedPosts.size > 0 && (
              <>
                <span className="text-neutral-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  {t('savedPosts.selection.clearSelection')}
                </button>
              </>
            )}
          </div>
          <div className="flex-1" />
          {selectedPosts.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtensionHelp(true)}
                title={t('savedPosts.actions.reloadImagesTitle')}
              >
                <RefreshCw className="w-4 h-4" />
                {t('savedPosts.actions.reloadImages')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissSelected}
                disabled={dismissPosts.isPending}
              >
                <X className="w-4 h-4" />
                {t('savedPosts.actions.dismiss')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletePosts.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                {t('savedPosts.actions.delete')}
              </Button>
              <Button size="sm" onClick={handleBulkImport} disabled={bulkImport.isPending}>
                {bulkImport.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {t('savedPosts.actions.importSelected')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">{t('savedPosts.error.title')}</h3>
          <p className="mt-1 text-neutral-500 mb-4">{t('savedPosts.error.message')}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('savedPosts.error.tryAgain')}
          </Button>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !isError && postsData?.posts.length === 0 && (
        <Card className="p-12 text-center">
          <Instagram className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('savedPosts.empty.title')}</h3>
          <p className="text-neutral-600 mb-6">
            {hasActiveFilters
              ? t('savedPosts.empty.withFilters')
              : t('savedPosts.empty.noFilters')}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={handleClearFilters}>
              {t('savedPosts.clearFilters')}
            </Button>
          ) : (
            <Button onClick={() => setShowExtensionHelp(true)}>
              <Puzzle className="w-4 h-4" />
              {t('savedPosts.empty.getChromeExtension')}
            </Button>
          )}
        </Card>
      )}

      {/* All posts on this page are being imported */}
      {!isLoading && !isError && postsData && postsData.posts.length > 0 && filteredPosts.length === 0 && activeTab === 'PENDING' && hasActiveJobs && (
        <Card className="p-12 text-center">
          <Loader2 className="w-16 h-16 mx-auto text-primary-400 mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {t('savedPosts.importing.title', { count: inProgressPostIds.size })}
          </h3>
          <p className="text-neutral-600 mb-6">
            {t('savedPosts.importing.message')}
          </p>
          {postsData.totalPages > 1 && (
            <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= postsData.totalPages}>
              {t('savedPosts.importing.viewOtherPages')}
            </Button>
          )}
        </Card>
      )}

      {/* Posts grid/list */}
      {!isLoading && !isError && filteredPosts.length > 0 && (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
            }
          >
            {filteredPosts.map((post) => (
              <SavedPostCard
                key={post.id}
                post={post}
                isSelected={selectedPosts.has(post.id)}
                onSelect={selectMode && activeTab !== 'in_progress' ? handleSelectPost : undefined}
                onImport={(p) => setImportingPost(p)}
                onDismiss={(id) => dismissPosts.mutate([id])}
                onRestore={(id) => restorePost.mutate(id)}
                onPreview={openPreview}
                onReloadImage={() => setShowExtensionHelp(true)}
              />
            ))}
          </div>

          {/* Pagination */}
          {postsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('savedPosts.pagination.previous')}
              </Button>
              <span className="text-sm text-neutral-600">
                {t('savedPosts.pagination.page', { current: page, total: postsData.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === postsData.totalPages}
                onClick={() => setPage((p) => Math.min(postsData.totalPages, p + 1))}
              >
                {t('savedPosts.pagination.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Caption Preview Modal - page level with navigation across ALL pending posts */}
      {(previewPost || isLoadingPreview) && (
        <CaptionPreviewModal
          post={previewPost!}
          isOpen={!!previewingPostId}
          onClose={handleClosePreview}
          onImport={handlePreviewImport}
          onDismiss={handlePreviewDismiss}
          onAddToQueue={handlePreviewAddToQueue}
          onImportQueue={() => {
            handleClosePreview();
            handleBulkImport();
          }}
          onNext={handlePreviewNext}
          onPrev={handlePreviewPrev}
          hasNext={previewIndex < allPendingIds.length - 1}
          hasPrev={previewIndex > 0}
          currentIndex={previewIndex}
          totalCount={allPendingIds.length}
          queueSize={selectedPosts.size}
          isLoading={isLoadingPreview}
          isInQueue={previewingPostId ? selectedPosts.has(previewingPostId) : false}
        />
      )}

      {/* Import Modal */}
      {importingPost && (
        <ImportModal
          post={importingPost}
          isOpen={!!importingPost}
          onClose={() => setImportingPost(null)}
          onSuccess={handleImportSuccess}
        />
      )}

      {/* Bulk Import Progress Modal */}
      {bulkImportJobId && (
        <ImportProgressModal
          jobId={bulkImportJobId}
          isOpen={!!bulkImportJobId}
          onClose={() => {
            setBulkImportJobId(null);
            refetch();
          }}
        />
      )}

      {/* Extension Help Modal */}
      <ExtensionHelpModal
        isOpen={showExtensionHelp}
        onClose={() => setShowExtensionHelp(false)}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('savedPosts.confirm.deleteTitle', { count: selectedPosts.size })}
            </h3>
            <p className="text-neutral-600 mb-6">
              {t('savedPosts.confirm.deleteMessage')}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletePosts.isPending}
              >
                {t('savedPosts.confirm.cancel')}
              </Button>
              <Button
                onClick={handleDeleteSelected}
                disabled={deletePosts.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletePosts.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {t('savedPosts.confirm.deletePosts')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      {showDeleteAllConfirm && deleteAllStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('savedPosts.confirm.deleteAllTitle', { status: deleteAllStatus.toLowerCase() })}
            </h3>
            <p className="text-neutral-600 mb-6">
              {t('savedPosts.confirm.deleteAllMessage', { status: deleteAllStatus })}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteAllConfirm(false);
                  setDeleteAllStatus(null);
                }}
                disabled={deleteAllByStatus.isPending}
              >
                {t('savedPosts.confirm.cancel')}
              </Button>
              <Button
                onClick={() => handleDeleteAllByStatus(deleteAllStatus)}
                disabled={deleteAllByStatus.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteAllByStatus.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {t('savedPosts.confirm.deleteAll')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
