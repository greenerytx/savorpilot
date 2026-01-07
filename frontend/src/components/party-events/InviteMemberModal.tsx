import { useState, useEffect } from 'react';
import { X, Loader2, UserPlus, Search, User, Users } from 'lucide-react';
import { Button, Input, Card } from '../ui';
import { useInviteMember } from '../../hooks/usePartyEvents';
import { useToast } from '../ui';
import { EventMemberRole } from '../../services/party-events.service';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

interface SearchUser {
  id: string;
  email: string;
  name: string;
}

type InviteMode = 'user' | 'guest';

export function InviteMemberModal({
  isOpen,
  onClose,
  eventId,
}: InviteMemberModalProps) {
  const toast = useToast();
  const inviteMember = useInviteMember();

  const [mode, setMode] = useState<InviteMode>('user');

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  // Guest form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('👤');
  const [role, setRole] = useState<EventMemberRole>(EventMemberRole.GUEST);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get<SearchUser[]>(`/sharing/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'user') {
      if (!selectedUser) return;

      try {
        await inviteMember.mutateAsync({
          eventId,
          dto: {
            userId: selectedUser.id,
            avatarEmoji,
            role,
          },
        });
        toast.success(`${selectedUser.name} invited!`);
        handleClose();
      } catch {
        toast.error('Failed to invite user');
      }
    } else {
      if (!name.trim()) return;

      try {
        await inviteMember.mutateAsync({
          eventId,
          dto: {
            name: name.trim(),
            email: email.trim() || undefined,
            avatarEmoji,
            role,
          },
        });
        toast.success('Guest invited!');
        handleClose();
      } catch {
        toast.error('Failed to invite guest');
      }
    }
  };

  const handleClose = () => {
    setMode('user');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setName('');
    setEmail('');
    setAvatarEmoji('👤');
    setRole(EventMemberRole.GUEST);
    onClose();
  };

  const memberEmojis = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👱', '👴', '👵'];

  const isValid = mode === 'user' ? !!selectedUser : !!name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-neutral-800">Invite to Event</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="p-4 border-b bg-neutral-50">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('user');
                setSelectedUser(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors',
                mode === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <User className="w-4 h-4" />
              App User
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('guest');
                setSearchQuery('');
                setSearchResults([]);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors',
                mode === 'guest'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <Users className="w-4 h-4" />
              Guest
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {mode === 'user' ? (
            <>
              {/* User Search */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Search by Email
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Enter email address..."
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="mt-2 border rounded-lg overflow-hidden bg-white shadow-sm">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery(user.email);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{user.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && !selectedUser && (
                  <p className="mt-2 text-sm text-neutral-500">No users found</p>
                )}

                {/* Selected User */}
                {selectedUser && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-lg font-medium text-primary-700">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{selectedUser.name}</p>
                      <p className="text-xs text-neutral-500">{selectedUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery('');
                      }}
                      className="p-1 hover:bg-primary-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-primary-600" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Guest name"
                  required
                />
              </div>

              {/* Guest Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email (optional)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>
            </>
          )}

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {memberEmojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setAvatarEmoji(e)}
                  className={cn(
                    'w-10 h-10 text-xl rounded-lg border-2 transition-colors',
                    avatarEmoji === e
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Role
            </label>
            <div className="flex gap-2">
              {[
                { value: EventMemberRole.GUEST, label: 'Guest' },
                { value: EventMemberRole.CONTRIBUTOR, label: 'Contributor' },
                { value: EventMemberRole.CO_HOST, label: 'Co-Host' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    role === r.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-neutral-50">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || inviteMember.isPending}
          >
            {inviteMember.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Invite
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default InviteMemberModal;
