import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listSessions } from '../api/sessions';
import { Session } from '../types/api';
import { useSessionsStore } from '../store/sessionsStore';

const RECENT_LIMIT = 5;

export const useRecentSessions = (activeSessionId: number | null | undefined) => {
    const [data, setData] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const stale = useSessionsStore((s) => s.stale);
    const markFresh = useSessionsStore((s) => s.markFresh);
    const prevActiveIdRef = useRef<number | null | undefined>(activeSessionId);

    const fetchData = useCallback(async () => {
        try {
            const result = await listSessions({
                status: ['COMPLETED', 'ERROR'],
                limit: RECENT_LIMIT,
            });
            setData(result);
            markFresh();
        } catch {
            // TODO
        } finally {
            setLoading(false);
        }
    }, [markFresh]);

    // Initial mount + tab focus
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    // Active session id transition (null↔value or value→different)
    useEffect(() => {
        if (prevActiveIdRef.current !== activeSessionId) {
            prevActiveIdRef.current = activeSessionId;
            fetchData();
        }
    }, [activeSessionId, fetchData]);

    // Mutation invalidation
    useEffect(() => {
        if (stale) fetchData();
    }, [stale, fetchData]);

    return { data, loading, refresh: fetchData };
};
