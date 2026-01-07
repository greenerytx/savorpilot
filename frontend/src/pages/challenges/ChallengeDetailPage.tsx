import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, formatDistanceToNow, isFuture } from 'date-fns';
import {
  Trophy,
  Clock,
  Users,
  ArrowLeft,
  Loader2,
  Camera,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  useChallengeDetail,
  useChallengeEntries,
  useChallengeLeaderboard,
  useSubmitEntry,
  useVoteForEntry,
  useRemoveVote,
} from '../../hooks/useChallenges';
import { ChallengeEntryCard } from '../../components/challenges';
import { Button, Card, Dialog } from '../../components/ui';
import type { ChallengeStatus } from '../../types/challenges.types';
import { cn, getImageUrl } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

const statusConfig: Record<ChallengeStatus, { label: string; color: string }> = {
  UPCOMING: { label: 'Starting Soon', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  VOTING: { label: 'Voting Open', color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Completed', color: 'bg-neutral-100 text-neutral-700' },
};

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');

  const { data: challenge, isLoading: isLoadingChallenge } = useChallengeDetail(id!);
  const {
    data: entriesData,
    isLoading: isLoadingEntries,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChallengeEntries(id!);
  const { data: leaderboard } = useChallengeLeaderboard(id!, 5);

  const submitEntry = useSubmitEntry();
  const voteForEntry = useVoteForEntry();
  const removeVote = useRemoveVote();

  const entries = entriesData?.pages.flatMap((p) => p.items) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !photoUrl.trim()) return;

    try {
      await submitEntry.mutateAsync({
        challengeId: id,
        dto: {
          photoUrl: photoUrl.trim(),
          caption: caption.trim() || undefined,
        },
      });
      setShowSubmitModal(false);
      setPhotoUrl('');
      setCaption('');
    } catch (error) {
      console.error('Failed to submit entry:', error);
    }
  };

  const handleVote = (entryId: string) => {
    if (!id) return;
    voteForEntry.mutate({ challengeId: id, entryId });
  };

  const handleUnvote = (entryId: string) => {
    if (!id) return;
    removeVote.mutate({ challengeId: id, entryId });
  };

  if (isLoadingChallenge) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Challenge not found</p>
          <Link to="/challenges" className="text-primary-600 hover:underline mt-2 inline-block">
            Back to challenges
          </Link>
        </Card>
      </div>
    );
  }

  const status = statusConfig[challenge.status];
  const canSubmit = challenge.status === 'ACTIVE' && user && !challenge.hasUserEntered;
  const canVote = (challenge.status === 'ACTIVE' || challenge.status === 'VOTING') && user;

  const getTimeInfo = () => {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const votingEndDate = new Date(challenge.votingEndDate);

    if (challenge.status === 'UPCOMING' && isFuture(startDate)) {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    }
    if (challenge.status === 'ACTIVE' && isFuture(endDate)) {
      return `Submissions close ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
    if (challenge.status === 'VOTING' && isFuture(votingEndDate)) {
      return `Voting ends ${formatDistanceToNow(votingEndDate, { addSuffix: true })}`;
    }
    return `Ended ${format(votingEndDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back link */}
      <Link
        to="/challenges"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to challenges
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        {/* Cover */}
        <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-600">
          {challenge.coverImage ? (
            <img
              src={getImageUrl(challenge.coverImage)}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {challenge.emoji ? (
                <span className="text-7xl">{challenge.emoji}</span>
              ) : (
                <Trophy className="h-20 w-20 text-white/50" />
              )}
            </div>
          )}
          <div className="absolute top-4 right-4">
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', status.color)}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">{challenge.title}</h1>
          <p className="text-muted-foreground mt-1">{challenge.theme}</p>

          {challenge.description && (
            <p className="mt-4 text-muted-foreground">{challenge.description}</p>
          )}

          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{challenge.entryCount} entries</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTimeInfo()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-6">
            {canSubmit && (
              <Button onClick={() => setShowSubmitModal(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Submit Entry
              </Button>
            )}
            {challenge.hasUserEntered && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You've entered!</span>
              </div>
            )}
            {challenge.status === 'UPCOMING' && (
              <p className="text-muted-foreground text-sm">
                Submissions open {formatDistanceToNow(new Date(challenge.startDate), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main entries */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold">Entries</h2>

          {isLoadingEntries ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No entries yet</p>
              {canSubmit && (
                <p className="text-sm mt-1">Be the first to submit!</p>
              )}
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entries.map((entry, index) => (
                  <ChallengeEntryCard
                    key={entry.id}
                    entry={entry}
                    challengeId={id!}
                    canVote={canVote || false}
                    onVote={handleVote}
                    onUnvote={handleUnvote}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </h2>

          {leaderboard && leaderboard.length > 0 ? (
            <Card className="divide-y">
              {leaderboard.map((entry) => (
                <div key={entry.id} className="p-3 flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      entry.rank === 1 && 'bg-yellow-100 text-yellow-700',
                      entry.rank === 2 && 'bg-neutral-200 text-neutral-700',
                      entry.rank === 3 && 'bg-amber-100 text-amber-700',
                      entry.rank > 3 && 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {entry.rank}
                  </div>
                  <img
                    src={getImageUrl(entry.photoUrl)}
                    alt=""
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.author?.firstName} {entry.author?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.voteCount} votes
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <Card className="p-4 text-center text-muted-foreground text-sm">
              No entries to rank yet
            </Card>
          )}
        </div>
      </div>

      {/* Submit Entry Modal */}
      <Dialog
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Entry"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Photo URL *</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-muted-foreground">
              Share a photo of your creation for this challenge
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Caption (optional)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={500}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!photoUrl.trim() || submitEntry.isPending}
              className="flex-1"
            >
              {submitEntry.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
