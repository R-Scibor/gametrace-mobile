import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCachedFetch, getFetchErrorMessage } from '../useCachedFetch';
import { getCache, setCache } from '../../utils/cacheStorage';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

const SERVER = 'https://s.example/api/v1';
const KEY = `cache:${SERVER}:1:feat`;

function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e?: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

beforeEach(async () => {
    await AsyncStorage.clear();
    useServerStore.setState({ serverUrl: SERVER });
    useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
});

test('hydrates from cache and renders before the network resolves', async () => {
    await setCache(KEY, 'cached');
    const pending = deferred<string>();

    const { result } = await renderHook(() => useCachedFetch<string>('feat', () => pending.promise));

    await waitFor(() => expect(result.current.data).toBe('cached'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastSyncTime).not.toBeNull();
    expect(result.current.isStale).toBe(false);
});

test('a successful fetch replaces data and writes through to disk', async () => {
    await setCache(KEY, 'cached');

    const { result } = await renderHook(() => useCachedFetch<string>('feat', () => Promise.resolve('fresh')));

    await waitFor(() => expect(result.current.data).toBe('fresh'));
    expect(result.current.error).toBeNull();
    expect(result.current.isStale).toBe(false);
    await waitFor(async () => expect((await getCache<string>(KEY))?.data).toBe('fresh'));
});

test('with a snapshot, a single failure marks stale (default threshold 1)', async () => {
    await setCache(KEY, 'cached');

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', () => Promise.reject(new Error('net'))));

    await waitFor(() => expect(result.current.isStale).toBe(true));
    expect(result.current.data).toBe('cached');
    expect(result.current.error).toBeNull();
});

test('staleAfterFailures: 2 needs two consecutive failures', async () => {
    await setCache(KEY, 'cached');
    const fetchFn = jest.fn(() => Promise.reject(new Error('net')));

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', fetchFn, { staleAfterFailures: 2 }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(result.current.isStale).toBe(false);

    await act(async () => { await result.current.refetch(); });
    expect(result.current.isStale).toBe(true);
    expect(result.current.data).toBe('cached');
});

test('a success resets the consecutive-failure counter', async () => {
    await setCache(KEY, 'cached');
    const results = [Promise.reject(new Error('net')), Promise.resolve('fresh'), Promise.reject(new Error('net'))];
    results.forEach((p) => p.catch(() => {})); // avoid unhandled-rejection noise
    const fetchFn = jest.fn(() => results.shift()!);

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', fetchFn as () => Promise<string>, { staleAfterFailures: 2 }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1)); // fail #1
    await act(async () => { await result.current.refetch(); });    // success → counter 0
    await act(async () => { await result.current.refetch(); });    // fail #1 again
    expect(result.current.isStale).toBe(false);
});

test('failure with no snapshot sets error immediately', async () => {
    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', () => Promise.reject(new Error('net'))));

    await waitFor(() => expect(result.current.error).toBe(getFetchErrorMessage()));
    expect(result.current.isStale).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
});

test('an empty-array success is a real snapshot', async () => {
    let ok = true;
    const fetchFn = jest.fn(() => (ok ? Promise.resolve([] as string[]) : Promise.reject(new Error('net'))));

    const { result } = await renderHook(() =>
        useCachedFetch<string[]>('feat', fetchFn, { initialData: [] }));

    await waitFor(() => expect(result.current.lastSyncTime).not.toBeNull());
    ok = false;
    await act(async () => { await result.current.refetch(); });

    expect(result.current.isStale).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
});

test('initialData alone is not a snapshot and does not suppress error', async () => {
    const { result } = await renderHook(() =>
        useCachedFetch<string[]>('feat', () => Promise.reject(new Error('net')), { initialData: [] }));

    await waitFor(() => expect(result.current.error).toBe(getFetchErrorMessage()));
    expect(result.current.data).toEqual([]);
    expect(result.current.lastSyncTime).toBeNull();
});

test('enabled: false never fetches or touches storage; refetch is a no-op', async () => {
    await setCache(KEY, 'cached');
    const fetchFn = jest.fn();

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', fetchFn as unknown as () => Promise<string>, { enabled: false }));

    await act(async () => {});
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStale).toBe(false);
    expect(result.current.lastSyncTime).toBeNull();

    await act(async () => { await result.current.refetch(); });
    expect(fetchFn).not.toHaveBeenCalled();
});

test('enabled flip false→true runs the mount path; true→false resets to idle', async () => {
    const fetchFn = jest.fn(() => Promise.resolve('fresh'));

    const { result, rerender } = await renderHook(
        ({ enabled }: { enabled: boolean }) => useCachedFetch<string>('feat', fetchFn, { enabled }),
        { initialProps: { enabled: false } },
    );

    await rerender({ enabled: true });
    await waitFor(() => expect(result.current.data).toBe('fresh'));

    await rerender({ enabled: false });
    expect(result.current.data).toBeNull();
    expect(result.current.lastSyncTime).toBeNull();
    expect(result.current.isStale).toBe(false);
});

test('key change resets state and hydrates the new key only', async () => {
    await setCache(`cache:${SERVER}:1:a`, 'A');
    const never = new Promise<string>(() => {});

    const { result, rerender } = await renderHook(
        ({ feature }: { feature: string }) => useCachedFetch<string>(feature, () => never),
        { initialProps: { feature: 'a' } },
    );

    await waitFor(() => expect(result.current.data).toBe('A'));

    await rerender({ feature: 'b' });

    await waitFor(() => expect(result.current.data).toBeNull());
    expect(result.current.lastSyncTime).toBeNull();
    expect(result.current.isLoading).toBe(true); // no cache for b, network pending
});

test('a slow response from the previous key is ignored after a key change', async () => {
    const first = deferred<string>();
    const fetches: Record<string, () => Promise<string>> = {
        a: () => first.promise,
        b: () => Promise.resolve('B'),
    };

    const { result, rerender } = await renderHook(
        ({ feature }: { feature: string }) => useCachedFetch<string>(feature, fetches[feature]),
        { initialProps: { feature: 'a' } },
    );

    await rerender({ feature: 'b' });
    await waitFor(() => expect(result.current.data).toBe('B'));

    await act(async () => { first.resolve('A-late'); });

    expect(result.current.data).toBe('B');
    expect((await getCache<string>(`cache:${SERVER}:1:b`))?.data).toBe('B');
    expect(await getCache(`cache:${SERVER}:1:a`)).toBeNull(); // stale generation never wrote
});

test('onSuccess fires on network success only, not on hydrate', async () => {
    await setCache(KEY, 'cached');
    const onSuccess = jest.fn();
    const pending = deferred<string>();

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', () => pending.promise, { onSuccess }));

    await waitFor(() => expect(result.current.data).toBe('cached'));
    expect(onSuccess).not.toHaveBeenCalled();

    await act(async () => { pending.resolve('fresh'); });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('fresh');
});

test('missing serverUrl fails closed: idle, no fetch', async () => {
    useServerStore.setState({ serverUrl: null });
    const fetchFn = jest.fn();

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', fetchFn as unknown as () => Promise<string>));

    await act(async () => {});
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
});

test('missing user fails closed: idle, no fetch', async () => {
    useAuthStore.setState({ user: null });
    const fetchFn = jest.fn();

    const { result } = await renderHook(() =>
        useCachedFetch<string>('feat', fetchFn as unknown as () => Promise<string>));

    await act(async () => {});
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
});
