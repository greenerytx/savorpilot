import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type UpdatePreferencesDto } from '../services/user.service';

// ==================== QUERY KEYS ====================

export const preferencesKeys = {
  all: ['user-preferences'] as const,
  current: () => [...preferencesKeys.all, 'current'] as const,
};

// ==================== HOOKS ====================

/**
 * Fetch current user's preferences
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: preferencesKeys.current(),
    queryFn: () => userService.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdatePreferencesDto) => userService.updatePreferences(dto),
    onSuccess: (updatedPrefs) => {
      // Update the cached preferences
      queryClient.setQueryData(preferencesKeys.current(), updatedPrefs);
    },
  });
}
