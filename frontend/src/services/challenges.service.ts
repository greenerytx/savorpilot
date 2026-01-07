import api from './api';
import type {
  Challenge,
  ChallengeDetail,
  ChallengeEntry,
  ChallengeStatus,
  ChallengesResponse,
  EntriesResponse,
  CreateChallengeDto,
  CreateEntryDto,
  LeaderboardEntry,
} from '../types/challenges.types';

// Re-export types
export type {
  ChallengeStatus,
  Challenge,
  ChallengeDetail,
  ChallengeEntry,
  LeaderboardEntry,
  CreateChallengeDto,
  CreateEntryDto,
  ChallengesResponse,
  EntriesResponse,
} from '../types/challenges.types';

export const challengesService = {
  async getChallenges(params?: { status?: ChallengeStatus; cursor?: string; limit?: number }): Promise<ChallengesResponse> {
    const { data } = await api.get('/challenges', { params });
    return data;
  },

  async getActiveChallenge(): Promise<Challenge | null> {
    const { data } = await api.get('/challenges/active');
    return data;
  },

  async getChallengeById(id: string): Promise<ChallengeDetail> {
    const { data } = await api.get(`/challenges/${id}`);
    return data;
  },

  async createChallenge(dto: CreateChallengeDto): Promise<Challenge> {
    const { data } = await api.post('/challenges', dto);
    return data;
  },

  async submitEntry(challengeId: string, dto: CreateEntryDto): Promise<ChallengeEntry> {
    const { data } = await api.post(`/challenges/${challengeId}/entries`, dto);
    return data;
  },

  async getEntries(challengeId: string, params?: { cursor?: string; limit?: number }): Promise<EntriesResponse> {
    const { data } = await api.get(`/challenges/${challengeId}/entries`, { params });
    return data;
  },

  async voteForEntry(challengeId: string, entryId: string): Promise<{ success: boolean }> {
    const { data } = await api.post(`/challenges/${challengeId}/entries/${entryId}/vote`);
    return data;
  },

  async removeVote(challengeId: string, entryId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/challenges/${challengeId}/entries/${entryId}/vote`);
    return data;
  },

  async getLeaderboard(challengeId: string, limit?: number): Promise<LeaderboardEntry[]> {
    const { data } = await api.get(`/challenges/${challengeId}/leaderboard`, {
      params: limit ? { limit } : undefined,
    });
    return data;
  },

  async deleteEntry(challengeId: string, entryId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/challenges/${challengeId}/entries/${entryId}`);
    return data;
  },
};
