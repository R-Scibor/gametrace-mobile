import { useCallback, useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../utils/cacheStorage';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import i18n from '../i18n';

// Same catalog key as ErrorBanner's default message — screens may render it directly.
export function getFetchErrorMessage() {
    return i18n.t('common:errors.fetch');
}

type Options<T> = {
    /** Consecutive failures needed to flip isStale. Default 1; raise only at call
     *  sites with their own retry loop (Dashboard 30s poll → 2) for anti-flicker. */
    staleAfterFailures?: number;
    /** When false: no cache read/write, no fetch, idle outward state. Default true. */
    enabled?: boolean;
    /** UI placeholder before any snapshot (e.g. [] for lists). Not a snapshot;
     *  never written to disk; does not set lastSyncTime. */
    initialData?: T;
    /** Runs after a successful network fetch only — not after a cache hydrate. */
    onSuccess?: (data: T) => void;
};

export function useCachedFetch<T>(
    feature: string,
    fetchFn: () => Promise<T>,
    options?: Options<T>,
) {
    const enabled = options?.enabled ?? true;
    const serverUrl = useServerStore((s) => s.serverUrl);
    const userKey = useAuthStore((s) => s.user?.discordId);
    // Fail closed: no server or no user → no key, hook stays idle. Authenticated
    // screens always have both by the time they render.
    const fullKey = enabled && serverUrl && userKey
        ? `cache:${serverUrl}:${userKey}:${feature}`
        : null;

    const [data, setData] = useState<T | null>(options?.initialData ?? null);
    const [isLoading, setIsLoading] = useState(fullKey != null);
    const [isStale, setIsStale] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Generation guards key change / unmount / enabled flip. Concurrent fetches
    // for the SAME key (poll + pull-to-refresh) share a generation: last resolve
    // wins, which is benign for idempotent reads.
    const generationRef = useRef(0);
    const failuresRef = useRef(0);
    const hasSnapshotRef = useRef(false);
    const keyRef = useRef(fullKey);
    keyRef.current = fullKey;
    const fetchFnRef = useRef(fetchFn);
    fetchFnRef.current = fetchFn;
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const runNetwork = useCallback(async (gen: number, key: string) => {
        if (!hasSnapshotRef.current) setIsLoading(true);
        let success: { value: T } | undefined;
        try {
            const result = await fetchFnRef.current();
            if (gen !== generationRef.current) return;
            setData(result);
            setLastSyncTime(Date.now());
            hasSnapshotRef.current = true;
            failuresRef.current = 0;
            setIsStale(false);
            setError(null);
            setIsLoading(false);
            void setCache(key, result);
            success = { value: result };
        } catch {
            if (gen !== generationRef.current) return;
            failuresRef.current += 1;
            if (hasSnapshotRef.current) {
                if (failuresRef.current >= (optionsRef.current?.staleAfterFailures ?? 1)) {
                    setIsStale(true);
                }
            } else {
                setError(getFetchErrorMessage());
            }
            setIsLoading(false);
            return;
        }
        // Fire onSuccess after the fetch has fully settled, outside the try, so a
        // throwing callback can't be caught above and miscounted as a fetch failure.
        optionsRef.current?.onSuccess?.(success.value);
    }, []);

    // Key lifecycle: on mount and whenever the assembled key changes (feature,
    // server, user, or enabled flip), reset outward state, hydrate, then fetch.
    useEffect(() => {
        generationRef.current += 1;
        const gen = generationRef.current;
        failuresRef.current = 0;
        hasSnapshotRef.current = false;
        setIsStale(false);
        setError(null);
        setLastSyncTime(null);
        setData(optionsRef.current?.initialData ?? null);

        if (fullKey == null) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        (async () => {
            const entry = await getCache<T>(fullKey);
            if (gen !== generationRef.current) return;
            // A network success may beat the disk read (an early refetch); never
            // let the older disk entry overwrite it.
            if (entry && !hasSnapshotRef.current) {
                setData(entry.data);
                setLastSyncTime(entry.timestamp);
                hasSnapshotRef.current = true;
                setIsLoading(false); // render cached content while the network settles
            }
            await runNetwork(gen, fullKey);
        })();

        // Ignore in-flight work from this key once it's gone.
        return () => { generationRef.current += 1; };
    }, [fullKey, runNetwork]);

    // Stable identity — callers put this in focus/poll/stale effect deps.
    const refetch = useCallback(async () => {
        const key = keyRef.current;
        if (key == null) return;
        await runNetwork(generationRef.current, key);
    }, [runNetwork]);

    return { data, isLoading, isStale, lastSyncTime, error, refetch };
}
