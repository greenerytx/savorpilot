import React, { useState } from 'react';
import { Trophy, Plus, Loader2 } from 'lucide-react';
import { useChallenges, useActiveChallenge } from '../../hooks/useChallenges';
import { ChallengeCard } from '../../components/challenges';
import { Button, Card } from '../../components/ui';
import type { ChallengeStatus } from '../../types/challenges.types';
import { cn } from '../../lib/utils';

const statusFilters: { value: ChallengeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'VOTING', label: 'Voting' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function ChallengesPage() {
  const [statusFilter, setStatusFilter] = useState<ChallengeStatus | 'ALL'>('ALL');

  const {
    data: activeChallenge,
    isLoading: isLoadingActive,
  } = useActiveChallenge();

  const {
    data: challengesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChallenges(statusFilter === 'ALL' ? undefined : statusFilter);

  const challenges = challengesData?.pages.flatMap((p) => p.items) || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Cooking Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Compete with the community and show off your cooking skills
          </p>
        </div>
      </div>

      {/* Active Challenge Hero */}
      {isLoadingActive ? (
        <Card className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </Card>
      ) : activeChallenge ? (
        <Card className="overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-5xl">
                {activeChallenge.emoji || '🏆'}
              </div>
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium mb-2">
                  {activeChallenge.status === 'VOTING' ? 'Vote Now!' : 'Active Challenge'}
                </span>
                <h2 className="text-2xl font-bold">{activeChallenge.title}</h2>
                <p className="text-white/80 mt-1">{activeChallenge.theme}</p>
                {activeChallenge.description && (
                  <p className="text-white/70 mt-2 text-sm">
                    {activeChallenge.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-sm text-white/80">
                    {activeChallenge.entryCount} entries
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.href = `/challenges/${activeChallenge.id}`}
                  >
                    {activeChallenge.status === 'VOTING' ? 'Vote Now' : 'Join Challenge'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No active challenge right now</p>
          <p className="text-sm mt-1">Check back soon for new challenges!</p>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              statusFilter === filter.value
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : challenges.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No challenges found</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
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
  );
}
