import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboard } from '../useDashboard';
import { getDashboardSummary } from '../../api/stats';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

jest.mock('../../api/stats', () => ({ getDashboardSummary: jest.fn() }));

const SUMMARY = {
  total_seconds_today: 60, total_seconds_7d: 120, total_seconds_30d: 180,
  active_session: null, pending_errors: [],
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
  (getDashboardSummary as jest.Mock).mockReset();
  (getDashboardSummary as jest.Mock).mockResolvedValue(SUMMARY);
});

test('fetches the summary and exposes it with loading=false', async () => {
  const { result } = await renderHook(() => useDashboard());

  await waitFor(() => expect(result.current.data).toEqual(SUMMARY));
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});

test('needs two consecutive failures before flagging stale (poll anti-flicker)', async () => {
  const { result } = await renderHook(() => useDashboard());
  await waitFor(() => expect(result.current.data).toEqual(SUMMARY));

  (getDashboardSummary as jest.Mock).mockRejectedValue(new Error('net'));
  await act(async () => { await result.current.refresh(); });
  expect(result.current.isStale).toBe(false); // blip #1 absorbed
  expect(result.current.data).toEqual(SUMMARY);

  await act(async () => { await result.current.refresh(); });
  expect(result.current.isStale).toBe(true);
  expect(result.current.data).toEqual(SUMMARY); // snapshot kept
});

test('polls every 30 seconds', async () => {
  jest.useFakeTimers();
  try {
    await renderHook(() => useDashboard());
    await act(async () => {}); // flush hydrate + initial fetch
    expect(getDashboardSummary).toHaveBeenCalledTimes(1);

    await act(() => { jest.advanceTimersByTime(30000); });
    await act(async () => {});

    expect(getDashboardSummary).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});
