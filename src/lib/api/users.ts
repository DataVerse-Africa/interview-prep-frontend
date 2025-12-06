import { apiClient } from './client';
import type { UserStats } from '@/types/user';

export const usersApi = {
    /**
     * GET /api/users/stats - Get user statistics
     */
    getStats: async (): Promise<UserStats> => {
        return apiClient.get<UserStats>('/api/users/stats');
    },
};
