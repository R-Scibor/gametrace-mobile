import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecentSessions } from '../useRecentSessions';
import { listSessions } from '../../api/sessions';
import { useSessionsStore } from '../../store/sessionsStore';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { Session } from '../../types/api';

jest.mock('../../api/sessions', () => ({ listSessions: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), [cb]);
  },
}));

const SESSION = { id: 1, status: 'COMPLETED' } as unknown as Session;

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
  useSessionsStore.setState({ stale: false });
  (listSessions as jest.Mock).mockReset();
  (listSessions as jest.Mock).mockResolvedValue([SESSION]);
});

test('exposes sessions as an array and marks the store fresh on network success', async () => {
  useSessionsStore.setState({ stale: true });

  const { result } = await renderHook(() => useRecentSessions(null));

  expect(Array.isArray(result.current.data)).toBe(true); // never null, even pre-fetch
  await waitFor(() => expect(result.current.data).toHaveLength(1));
  await waitFor(() => expect(useSessionsStore.getState().stale).toBe(false));
  expect(listSessions).toHaveBeenCalledWith({ status: ['COMPLETED', 'ERROR'], limit: 5 });
});

test('an activeSessionId transition triggers a refetch', async () => {
  const { rerender } = await renderHook(
    ({ id }: { id: number | null }) => useRecentSessions(id),
    { initialProps: { id: null } },
  );
  await waitFor(() => expect(listSessions).toHaveBeenCalled());
  (listSessions as jest.Mock).mockClear();

  await rerender({ id: 5 });

  await waitFor(() => expect(listSessions).toHaveBeenCalledTimes(1));
});

test('a sessionsStore.stale flip triggers a refetch', async () => {
  const { result } = await renderHook(() => useRecentSessions(null));
  await waitFor(() => expect(result.current.data).toHaveLength(1));
  (listSessions as jest.Mock).mockClear();

  await act(() => { useSessionsStore.getState().invalidate(); });

  await waitFor(() => expect(listSessions).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(useSessionsStore.getState().stale).toBe(false));
});

test('a failure after a successful sync keeps the data and flags stale', async () => {
  const { result } = await renderHook(() => useRecentSessions(null));
  await waitFor(() => expect(result.current.data).toHaveLength(1));

  (listSessions as jest.Mock).mockRejectedValue(new Error('net'));
  await act(async () => { await result.current.refresh(); });

  expect(result.current.data).toHaveLength(1);
  expect(result.current.isStale).toBe(true);
});

test('a failure with no snapshot leaves data as an empty array (errors swallowed)', async () => {
  (listSessions as jest.Mock).mockRejectedValue(new Error('net'));

  const { result } = await renderHook(() => useRecentSessions(null));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual([]);
});
