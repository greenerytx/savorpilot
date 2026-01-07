export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'VOTING' | 'COMPLETED';

export type Challenge = {
  id: string;
  title: string;
  description?: string;
  theme: string;
  emoji?: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  votingEndDate: string;
  status: ChallengeStatus;
  createdById: string;
  createdAt: string;
  entryCount: number;
};

export type ChallengeDetail = Challenge & {
  hasUserEntered: boolean;
  userEntry?: ChallengeEntry;
};

export type ChallengeEntry = {
  id: string;
  challengeId: string;
  photoUrl: string;
  caption?: string;
  voteCount: number;
  createdAt: string;
  isVotedByMe?: boolean;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  photoUrl: string;
  caption?: string;
  voteCount: number;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
};

export type CreateChallengeDto = {
  title: string;
  description?: string;
  theme: string;
  emoji?: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  votingEndDate: string;
};

export type CreateEntryDto = {
  recipeId?: string;
  photoUrl: string;
  caption?: string;
};

export type ChallengesResponse = {
  items: Challenge[];
  nextCursor: string | null;
};

export type EntriesResponse = {
  items: ChallengeEntry[];
  nextCursor: string | null;
};
