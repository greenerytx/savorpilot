import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Search, User, UserPlus } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import {
  useAddMember,
  useUpdateMember,
  useCircleOptions,
} from '../../hooks/useDinnerCircles';
import { userService, type UserSearchResult } from '../../services/user.service';
import type { CircleMember } from '../../services/dinner-circles.service';
import { cn } from '../../lib/utils';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  editMember: CircleMember | null;
  onSuccess: () => void;
}

type MemberType = 'existing' | 'virtual';

const AVATAR_EMOJIS = [
  '👨', '👩', '👧', '👦', '👶',
  '🧑', '👴', '👵', '🧔', '👱',
  '🐶', '🐱', '🐰', '🐻', '🦊',
];

export function AddMemberModal({
  isOpen,
  onClose,
  circleId,
  editMember,
  onSuccess,
}: AddMemberModalProps) {
  // Member type toggle (only for adding, not editing)
  const [memberType, setMemberType] = useState<MemberType>('virtual');

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // Virtual member form state
  const [name, setName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('👤');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [selectedRestrictions, setSelectedRestrictions] = useState<Set<string>>(new Set());
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());

  const { data: options } = useCircleOptions();
  const addMember = useAddMember();
  const updateMember = useUpdateMember();

  const isEditing = !!editMember;

  // Debounced user search
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await userService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (memberType === 'existing' && searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, memberType, searchUsers]);

  // Populate form when editing
  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setAvatarEmoji(editMember.avatarEmoji || '👤');
      setDietaryNotes(editMember.dietaryNotes || '');
      setSelectedRestrictions(new Set(editMember.restrictions));
      setSelectedAllergens(new Set(editMember.allergens));
    } else {
      resetForm();
    }
  }, [editMember]);

  const resetForm = () => {
    setMemberType('virtual');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setName('');
    setAvatarEmoji('👤');
    setDietaryNotes('');
    setSelectedRestrictions(new Set());
    setSelectedAllergens(new Set());
  };

  if (!isOpen) return null;

  const toggleRestriction = (r: string) => {
    const newSet = new Set(selectedRestrictions);
    if (newSet.has(r)) {
      newSet.delete(r);
    } else {
      newSet.add(r);
    }
    setSelectedRestrictions(newSet);
  };

  const toggleAllergen = (a: string) => {
    const newSet = new Set(selectedAllergens);
    if (newSet.has(a)) {
      newSet.delete(a);
    } else {
      newSet.add(a);
    }
    setSelectedAllergens(newSet);
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && editMember) {
        // Update existing member
        await updateMember.mutateAsync({
          circleId,
          memberId: editMember.id,
          dto: {
            name: name.trim(),
            avatarEmoji,
            dietaryNotes: dietaryNotes.trim() || undefined,
            restrictions: Array.from(selectedRestrictions),
            allergens: Array.from(selectedAllergens),
          },
        });
      } else if (memberType === 'existing' && selectedUser) {
        // Add existing user as member
        await addMember.mutateAsync({
          circleId,
          dto: {
            name: selectedUser.name,
            userId: selectedUser.id,
            isVirtual: false,
            restrictions: Array.from(selectedRestrictions),
            allergens: Array.from(selectedAllergens),
            dietaryNotes: dietaryNotes.trim() || undefined,
          },
        });
      } else {
        // Add virtual member
        await addMember.mutateAsync({
          circleId,
          dto: {
            name: name.trim(),
            isVirtual: true,
            avatarEmoji,
            dietaryNotes: dietaryNotes.trim() || undefined,
            restrictions: Array.from(selectedRestrictions),
            allergens: Array.from(selectedAllergens),
          },
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save member:', error);
    }
  };

  const isPending = addMember.isPending || updateMember.isPending;
  const canSubmit = isEditing
    ? name.trim()
    : memberType === 'existing'
      ? selectedUser !== null
      : name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            {isEditing ? 'Edit Member' : 'Add a Member'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member type toggle - only show when adding */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Member Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMemberType('existing');
                      setSelectedUser(null);
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      memberType === 'existing'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <User className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Existing User</div>
                      <div className="text-xs opacity-70">Has an account</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberType('virtual')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      memberType === 'virtual'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <UserPlus className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">New Person</div>
                      <div className="text-xs opacity-70">No account needed</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Existing user search */}
            {!isEditing && memberType === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Search for User
                </label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      {selectedUser.avatarUrl ? (
                        <img
                          src={selectedUser.avatarUrl}
                          alt={selectedUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800">{selectedUser.name}</div>
                      <div className="text-sm text-neutral-500">{selectedUser.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="p-1 hover:bg-primary-100 rounded"
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-10"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
                    )}

                    {/* Search results dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-neutral-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-neutral-800 truncate">{user.name}</div>
                              <div className="text-sm text-neutral-500 truncate">{user.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-center text-neutral-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Virtual member form OR editing form */}
            {(isEditing || memberType === 'virtual') && (
              <>
                {/* Avatar picker */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Choose an avatar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setAvatarEmoji(e)}
                        className={cn(
                          'text-2xl p-2 rounded-lg transition-all',
                          avatarEmoji === e
                            ? 'bg-primary-100 scale-110'
                            : 'hover:bg-neutral-100'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sarah, Tommy, etc."
                    required
                  />
                </div>
              </>
            )}

            {/* Dietary Notes - show for all */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Dietary Notes <span className="text-neutral-400">(optional)</span>
              </label>
              <Input
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g., Prefers mild flavors, picky eater"
              />
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="flex flex-wrap gap-2">
                {options?.restrictions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRestriction(r)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all',
                      selectedRestrictions.has(r)
                        ? 'bg-amber-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Allergies
              </label>
              <div className="flex flex-wrap gap-2">
                {options?.allergens.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergen(a)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all',
                      selectedAllergens.has(a)
                        ? 'bg-red-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
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
                disabled={!canSubmit || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {isEditing ? 'Saving...' : 'Adding...'}
                  </>
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Add Member'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
