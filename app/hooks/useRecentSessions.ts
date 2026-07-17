import { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listSessions } from '../api/sessions';
import { Session } from '../types/api';
import { useSessionsStore } from '../store/sessionsStore';
import { useCachedFetch } from './useCachedFetch';

const RECENT_LIMIT = 5;
const EMPTY_SESSIONS: Session[] = [];

export const useRecentSessions = (activeSessionId: number | null | undefined) => {
    const stale = useSessionsStore((s) => s.stale);
    const markFresh = useSessionsStore((s) => s.markFresh);
    const prevActiveIdRef = useRef<number | null | undefined>(activeSessionId);

    const { data, isLoading, isStale, lastSyncTime, refetch } = useCachedFetch<Session[]>(
        'recent-sessions',
        () => listSessions({ status: ['COMPLETED', 'ERROR'], limit: RECENT_LIMIT }),
        { initialData: EMPTY_SESSIONS, onSuccess: markFresh },
    );

    // Initial mount + tab focus
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    // Active session id transition (null↔value or value→different)
    useEffect(() => {
        if (prevActiveIdRef.current !== activeSessionId) {
            prevActiveIdRef.current = activeSessionId;
            refetch();
        }
    }, [activeSessionId, refetch]);

    // Mutation invalidation
    useEffect(() => {
        if (stale) refetch();
    }, [stale, refetch]);

    return { data: data ?? EMPTY_SESSIONS, loading: isLoading, isStale, lastSyncTime, refresh: refetch };
};
