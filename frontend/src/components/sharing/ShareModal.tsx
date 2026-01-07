import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Users,
  Trash2,
  Loader2,
  Check,
  Link2,
  Mail,
  Calendar,
  MessageCircle,
  Twitter,
  Facebook,
  ExternalLink,
  User,
  ImageIcon,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../ui';
import {
  useRecipeShares,
  useGroupShares,
  useSmartCollectionShares,
  useShareRecipe,
  useShareGroup,
  useShareSmartCollection,
  useRevokeRecipeShare,
  useRevokeGroupShare,
  useRevokeSmartCollectionShare,
  useUserSearch,
} from '../../hooks';
import type { SharedRecipe, SharedGroup, SharedSmartCollection } from '../../services/share.service';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'recipe' | 'collection' | 'smart-collection';
  itemId: string;
  itemName: string;
  onCreateCard?: () => void; // Optional callback to open the shareable card modal
}

export function ShareModal({ isOpen, onClose, type, itemId, itemName, onCreateCard }: ShareModalProps) {
  const { t } = useTranslation('sharing');
  const [emailInput, setEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canReshare, setCanReshare] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(emailInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailInput]);

  // Queries
  const { data: recipeShares, isLoading: loadingRecipeShares } = useRecipeShares(
    type === 'recipe' ? itemId : ''
  );
  const { data: groupShares, isLoading: loadingGroupShares } = useGroupShares(
    type === 'collection' ? itemId : ''
  );
  const { data: smartCollectionShares, isLoading: loadingSmartCollectionShares } = useSmartCollectionShares(
    type === 'smart-collection' ? itemId : ''
  );
  const { data: searchResults } = useUserSearch(searchQuery);

  // Mutations
  const shareRecipe = useShareRecipe();
  const shareGroup = useShareGroup();
  const shareSmartCollection = useShareSmartCollection();
  const revokeRecipeShare = useRevokeRecipeShare();
  const revokeGroupShare = useRevokeGroupShare();
  const revokeSmartCollectionShare = useRevokeSmartCollectionShare();

  const shares = type === 'recipe'
    ? recipeShares
    : type === 'collection'
      ? groupShares
      : smartCollectionShares;
  const isLoading = type === 'recipe'
    ? loadingRecipeShares
    : type === 'collection'
      ? loadingGroupShares
      : loadingSmartCollectionShares;
  const isSharing = shareRecipe.isPending || shareGroup.isPending || shareSmartCollection.isPending;

  const shareUrl = `${window.location.origin}/${type === 'recipe' ? 'recipes' : type === 'smart-collection' ? 'smart-collections' : 'collections'}/${itemId}`;

  const handleShare = useCallback(async (email: string) => {
    setError(null);
    try {
      if (type === 'recipe') {
        await shareRecipe.mutateAsync({
          recipeId: itemId,
          data: {
            email,
            canEdit,
            canReshare,
            expiresAt: expiresAt || undefined,
          },
        });
      } else if (type === 'collection') {
        await shareGroup.mutateAsync({
          groupId: itemId,
          data: { email },
        });
      } else {
        await shareSmartCollection.mutateAsync({
          collectionId: itemId,
          data: { email },
        });
      }
      setEmailInput('');
      showSuccessToast(t('messages.sharedSuccess'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failedToShare'));
    }
  }, [type, itemId, canEdit, canReshare, expiresAt, shareRecipe, shareGroup, shareSmartCollection]);

  const handleRevoke = useCallback(async (shareId: string) => {
    try {
      if (type === 'recipe') {
        await revokeRecipeShare.mutateAsync(shareId);
      } else if (type === 'collection') {
        await revokeGroupShare.mutateAsync(shareId);
      } else {
        await revokeSmartCollectionShare.mutateAsync(shareId);
      }
    } catch (err) {
      console.error('Failed to revoke share:', err);
    }
  }, [type, revokeRecipeShare, revokeGroupShare, revokeSmartCollectionShare]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    showSuccessToast(t('messages.linkCopied'));
  }, [shareUrl, t]);

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Social share handlers
  const shareText = t('messages.checkThisOut', { type, name: itemName });

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmailShare = () => {
    window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Success Toast */}
        {showSuccess && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20 animate-fade-in">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {type === 'recipe' ? t('modal.shareRecipe') : t('modal.shareCollection', 'Share Collection')}
            </h2>
            <p className="text-sm text-neutral-500 truncate max-w-[300px]">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Share by email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('modal.shareWithSomeone')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={t('modal.emailPlaceholder')}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && emailInput.includes('@')) {
                      handleShare(emailInput);
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => handleShare(emailInput)}
                disabled={!emailInput.includes('@') || isSharing}
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('modal.share')
                )}
              </Button>
            </div>

            {/* Search results dropdown */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-2 border border-neutral-200 rounded-lg divide-y divide-neutral-100 bg-white shadow-lg">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleShare(user.email)}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{user.name}</p>
                      <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Share options (recipe only) */}
          {type === 'recipe' && (
            <div className="space-y-3 p-3 bg-neutral-50 rounded-xl">
              <p className="text-sm font-medium text-neutral-700">{t('options.title')}</p>

              {/* Permissions */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{t('options.canEdit')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canReshare}
                    onChange={(e) => setCanReshare(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{t('options.canReshare')}</span>
                </label>
              </div>

              {/* Expiration */}
              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  {t('options.expiresOn')}
                </label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-neutral-200" />
            <span className="text-xs text-neutral-400 uppercase">{t('social.orShareVia')}</span>
            <div className="flex-1 border-t border-neutral-200" />
          </div>

          {/* Social share buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <Link2 className="w-5 h-5 text-neutral-600" />
              <span className="text-xs text-neutral-600">{t('social.copyLink')}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-neutral-200 hover:bg-green-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs text-neutral-600">{t('social.whatsapp')}</span>
            </button>
            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-neutral-200 hover:bg-sky-50 transition-colors"
            >
              <Twitter className="w-5 h-5 text-sky-500" />
              <span className="text-xs text-neutral-600">{t('social.twitter')}</span>
            </button>
            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-neutral-200 hover:bg-blue-50 transition-colors"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-neutral-600">{t('social.facebook')}</span>
            </button>
          </div>

          {/* Email share button */}
          <Button variant="outline" onClick={handleEmailShare} className="w-full">
            <Mail className="w-4 h-4" />
            {t('social.sendViaEmail')}
          </Button>

          {/* Create Image Card (only for recipes) */}
          {type === 'recipe' && onCreateCard && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onCreateCard();
              }}
              className="w-full border-primary-200 text-primary-600 hover:bg-primary-50"
            >
              <ImageIcon className="w-4 h-4" />
              Create Shareable Image Card
            </Button>
          )}

          {/* Current shares */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">
                {t('sharedWith.title', { count: shares?.length || 0 })}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : shares && shares.length > 0 ? (
              <div className="space-y-2">
                {shares.map((share) => (
                  <ShareItem
                    key={share.id}
                    share={share}
                    onRevoke={() => handleRevoke(share.id)}
                    isRevoking={revokeRecipeShare.isPending || revokeGroupShare.isPending || revokeSmartCollectionShare.isPending}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                {t('sharedWith.notShared')}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('modal.done')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Share item component
interface ShareItemProps {
  share: SharedRecipe | SharedGroup | SharedSmartCollection;
  onRevoke: () => void;
  isRevoking: boolean;
}

function ShareItem({ share, onRevoke, isRevoking }: ShareItemProps) {
  const { t } = useTranslation('sharing');
  const isRecipeShare = 'canEdit' in share;

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 truncate">{share.sharedWithName}</p>
          <p className="text-sm text-neutral-500 truncate">{share.sharedWithEmail}</p>

          {/* Permissions and date */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {isRecipeShare && (share as SharedRecipe).canEdit && (
              <Badge variant="secondary" className="text-xs">{t('sharedWith.edit')}</Badge>
            )}
            {isRecipeShare && (share as SharedRecipe).canReshare && (
              <Badge variant="secondary" className="text-xs">{t('sharedWith.reshare')}</Badge>
            )}
            {isRecipeShare && (share as SharedRecipe).expiresAt && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('sharedWith.expires', { date: new Date((share as SharedRecipe).expiresAt!).toLocaleDateString() })}
              </span>
            )}
            <span className="text-xs text-neutral-400">
              {new Date(share.sharedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onRevoke}
        disabled={isRevoking}
        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
        title={t('sharedWith.removeAccess')}
      >
        {isRevoking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
