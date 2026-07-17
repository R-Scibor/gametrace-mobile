import AsyncStorage from '@react-native-async-storage/async-storage';

// Read-cache entries live under this prefix so clearAllCache can't touch
// zustand-persisted state (server-storage, settings, auth).
const PREFIX = 'cache:';

export type CacheEntry<T> = { data: T; timestamp: number };

export const getCache = async <T>(key: string): Promise<CacheEntry<T> | null> => {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw == null) return null;
        const parsed = JSON.parse(raw);
        if (
            typeof parsed !== 'object' || parsed === null ||
            typeof parsed.timestamp !== 'number' || !('data' in parsed)
        ) {
            return null;
        }
        return parsed as CacheEntry<T>;
    } catch {
        // Corrupt entry = cache miss; never throw into the UI.
        return null;
    }
};

export const setCache = async <T>(key: string, data: T): Promise<void> => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
        // Best-effort write; a failed write only means no offline snapshot.
    }
};

export const clearAllCache = async (): Promise<void> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((k) => k.startsWith(PREFIX));
        if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
    } catch {
        // Best-effort privacy clear.
    }
};
