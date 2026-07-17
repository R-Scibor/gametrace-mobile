import { useEffect } from 'react';
import { getDashboardSummary } from '../api/stats';
import { useCachedFetch } from './useCachedFetch';

const POLL_INTERVAL = 30000; // 30 seconds

export const useDashboard = () => {
    const { data, isLoading, isStale, lastSyncTime, error, refetch } = useCachedFetch(
        'dashboard',
        getDashboardSummary,
        // The 30s poll is this hook's retry loop: absorb one blip (~60s offline
        // before the banner). Everywhere without self-retry uses the default (1).
        { staleAfterFailures: 2 },
    );

    useEffect(() => {
        const id = setInterval(refetch, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [refetch]);

    return { data, loading: isLoading, error, isStale, lastSyncTime, refresh: refetch };
};
