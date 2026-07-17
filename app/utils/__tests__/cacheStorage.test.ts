import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCache, setCache, clearAllCache } from '../cacheStorage';

beforeEach(async () => {
    await AsyncStorage.clear();
});

test('setCache/getCache round-trips data with a timestamp', async () => {
    await setCache('cache:s:1:feat', { a: 1 });

    const entry = await getCache<{ a: number }>('cache:s:1:feat');

    expect(entry?.data).toEqual({ a: 1 });
    expect(typeof entry?.timestamp).toBe('number');
});

test('keys scoped by server and user do not collide', async () => {
    await setCache('cache:https://a.example/api/v1:1:dashboard', 'A');
    await setCache('cache:https://b.example/api/v1:1:dashboard', 'B');
    await setCache('cache:https://a.example/api/v1:2:dashboard', 'C');

    expect((await getCache('cache:https://a.example/api/v1:1:dashboard'))?.data).toBe('A');
    expect((await getCache('cache:https://b.example/api/v1:1:dashboard'))?.data).toBe('B');
    expect((await getCache('cache:https://a.example/api/v1:2:dashboard'))?.data).toBe('C');
});

test('a missing key is a cache miss', async () => {
    expect(await getCache('cache:s:1:nope')).toBeNull();
});

test('corrupt JSON is a cache miss, not a throw', async () => {
    await AsyncStorage.setItem('cache:s:1:bad', 'not json{');

    expect(await getCache('cache:s:1:bad')).toBeNull();
});

test('a payload without the entry shape is a cache miss', async () => {
    await AsyncStorage.setItem('cache:s:1:shape', JSON.stringify({ nope: true }));

    expect(await getCache('cache:s:1:shape')).toBeNull();
});

test('clearAllCache removes only cache:-prefixed keys', async () => {
    await setCache('cache:s:1:dashboard', 1);
    await setCache('cache:s:2:library', 2);
    await AsyncStorage.setItem('server-storage', '{"state":{"serverUrl":"x"}}');

    await clearAllCache();

    expect(await getCache('cache:s:1:dashboard')).toBeNull();
    expect(await getCache('cache:s:2:library')).toBeNull();
    expect(await AsyncStorage.getItem('server-storage')).not.toBeNull();
});
