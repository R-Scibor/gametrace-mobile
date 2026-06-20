import { renderHook, act } from '@testing-library/react-native';
import { useChangeServer } from '../useChangeServer';
import { resolveServer } from '../../api/resolveServer';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../api/resolveServer');
const mockedResolve = resolveServer as jest.Mock;

beforeEach(() => {
  mockedResolve.mockReset();
  useServerStore.setState({ serverUrl: 'https://old:8010/api/v1' });
  useAuthStore.setState({ isAuthenticated: true, token: 't', user: { discordId: '1', username: 'u' } });
});

test('changing to a reachable server updates url and logs out', async () => {
  mockedResolve.mockResolvedValue({ status: 'ok', baseUrl: 'https://new:8010/api/v1' });
  const { result } = await renderHook(() => useChangeServer());
  await act(async () => { await result.current.change('new:8010'); });
  expect(useServerStore.getState().serverUrl).toBe('https://new:8010/api/v1');
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test('insecure result does not apply until confirmed, and applies the probed baseUrl', async () => {
  mockedResolve.mockResolvedValue({ status: 'insecure', baseUrl: 'http://new:8010/api/v1' });
  const { result } = await renderHook(() => useChangeServer());
  let outcome: any;
  await act(async () => { outcome = await result.current.change('new:8010'); });
  expect(outcome).toEqual({ status: 'insecure', baseUrl: 'http://new:8010/api/v1' });
  // not applied yet
  expect(useServerStore.getState().serverUrl).toBe('https://old:8010/api/v1');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  // caller confirms with the SAME baseUrl the probe returned (no reconstruction)
  await act(async () => { result.current.confirmInsecure(outcome.baseUrl); });
  expect(useServerStore.getState().serverUrl).toBe('http://new:8010/api/v1');
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test('unreachable server leaves url and auth untouched', async () => {
  mockedResolve.mockResolvedValue({ status: 'unreachable' });
  const { result } = await renderHook(() => useChangeServer());
  let outcome: any;
  await act(async () => { outcome = await result.current.change('new:8010'); });
  expect(outcome).toEqual({ status: 'unreachable' });
  expect(useServerStore.getState().serverUrl).toBe('https://old:8010/api/v1');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
