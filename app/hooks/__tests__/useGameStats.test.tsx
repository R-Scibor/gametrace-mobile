import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStats } from '../useGameStats';
import { getGameStats } from '../../api/games';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

jest.mock('../../api/games', () => ({ getGameStats: jest.fn() }));

const STATS = { game_id: 7, total_seconds: 3600, session_count: 2, first_played: '', last_played: '' };

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
  (getGameStats as jest.Mock).mockReset();
  (getGameStats as jest.Mock).mockResolvedValue(STATS);
});

test('null gameId: no fetch, no cache key written', async () => {
  const { result } = await renderHook(() => useGameStats(null));

  await act(async () => {});
  expect(getGameStats).not.toHaveBeenCalled();
  expect(result.current.data).toBeNull();
  const keys = await AsyncStorage.getAllKeys();
  expect(keys.filter((k) => k.includes('game-stats'))).toHaveLength(0);
});

test('fetches and caches per gameId', async () => {
  const { result } = await renderHook(() => useGameStats(7));

  await waitFor(() => expect(result.current.data).toEqual(STATS));
  expect(getGameStats).toHaveBeenCalledWith(7);
  const keys = await AsyncStorage.getAllKeys();
  expect(keys).toContain('cache:https://s.example/api/v1:1:game-stats-7');
});

test('a failed refresh keeps the last snapshot and flags stale', async () => {
  const { result } = await renderHook(() => useGameStats(7));
  await waitFor(() => expect(result.current.data).toEqual(STATS));

  (getGameStats as jest.Mock).mockRejectedValue(new Error('net'));
  await act(async () => { await result.current.refresh(); });

  expect(result.current.data).toEqual(STATS); // was setData(null) before — spec change
  expect(result.current.isStale).toBe(true);
});

test('a gameId change loads the new game, not the previous snapshot', async () => {
  const { result, rerender } = await renderHook(
    ({ id }: { id: number }) => useGameStats(id),
    { initialProps: { id: 7 } },
  );
  await waitFor(() => expect(result.current.data).toEqual(STATS));

  const OTHER = { ...STATS, game_id: 8, total_seconds: 7200 };
  (getGameStats as jest.Mock).mockResolvedValue(OTHER);
  await rerender({ id: 8 });

  await waitFor(() => expect(result.current.data).toEqual(OTHER));
});
