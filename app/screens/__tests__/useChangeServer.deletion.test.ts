import { renderHook, act } from '@testing-library/react-native';
import { useChangeServer } from '../useChangeServer';
import { resolveServer } from '../../api/resolveServer';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { useDeletionHandoffStore } from '../../store/deletionHandoffStore';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../api/resolveServer');
const mockedResolve = resolveServer as jest.Mock;

const handoffSample = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

beforeEach(() => {
  mockedResolve.mockReset();
  useServerStore.setState({ serverUrl: 'https://old:8010/api/v1' });
  useAuthStore.setState({
    isAuthenticated: true,
    token: 't',
    user: { discordId: '1', username: 'u' },
    pendingDeletion: null,
  });
  useDeletionHandoffStore.getState().clear();
});

test('apply clears handoff and logs out', async () => {
  useDeletionHandoffStore.getState().save(handoffSample);
  mockedResolve.mockResolvedValue({ status: 'ok', baseUrl: 'https://new:8010/api/v1' });
  const { result } = await renderHook(() => useChangeServer());

  await act(async () => {
    await result.current.change('new:8010');
  });

  expect(useServerStore.getState().serverUrl).toBe('https://new:8010/api/v1');
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useDeletionHandoffStore.getState().status).toBeNull();
});

test('confirmInsecure also clears handoff', async () => {
  useDeletionHandoffStore.getState().save(handoffSample);
  const { result } = await renderHook(() => useChangeServer());

  await act(async () => {
    result.current.confirmInsecure('http://new:8010/api/v1');
  });

  expect(useServerStore.getState().serverUrl).toBe('http://new:8010/api/v1');
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useDeletionHandoffStore.getState().status).toBeNull();
});
