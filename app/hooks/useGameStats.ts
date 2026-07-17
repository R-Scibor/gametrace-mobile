import { getGameStats } from '../api/games';
import { GameStats } from '../types/api';
import { useCachedFetch } from './useCachedFetch';

export const useGameStats = (gameId: number | null | undefined) => {
    const { data, isLoading, isStale, lastSyncTime, refetch } = useCachedFetch<GameStats>(
        `game-stats-${gameId}`,
        () => getGameStats(gameId as number),
        // Dashboard spotlight passes lastPlayed?.game_id — no fetch, no
        // "game-stats-undefined" cache key while there is no last-played game.
        { enabled: gameId != null },
    );

    return { data, loading: isLoading, isStale, lastSyncTime, refresh: refetch };
};
