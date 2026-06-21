import { renderHook, act } from '@testing-library/react-native';
import { useTimezone } from '../useTimezone';
import { getProfile, updateSettings } from '../../api/profile';
import { useSettingsStore } from '../../store/settingsStore';

jest.mock('axios', () => ({ __esModule: true, default: { create: () => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }) } }));
jest.mock('../../api/profile');
const mockedGetProfile = getProfile as jest.Mock;
const mockedUpdateSettings = updateSettings as jest.Mock;

beforeEach(() => {
  mockedGetProfile.mockReset();
  mockedUpdateSettings.mockReset();
  useSettingsStore.setState({ timezone: 'UTC' });
});

test('select persists the new timezone to the backend and updates the store', async () => {
  mockedUpdateSettings.mockResolvedValue(undefined);
  const { result } = await renderHook(() => useTimezone());

  await act(async () => { await result.current.select('Europe/Warsaw'); });

  expect(mockedUpdateSettings).toHaveBeenCalledWith({ timezone: 'Europe/Warsaw' });
  expect(useSettingsStore.getState().timezone).toBe('Europe/Warsaw');
  expect(result.current.error).toBe(false);
});

test('select reverts the store and flags an error when the backend call fails', async () => {
  mockedUpdateSettings.mockRejectedValue(new Error('network'));
  const { result } = await renderHook(() => useTimezone());

  await act(async () => { await result.current.select('Europe/Warsaw'); });

  expect(useSettingsStore.getState().timezone).toBe('UTC');
  expect(result.current.error).toBe(true);
});

test('select is a no-op when the chosen zone matches the current one', async () => {
  const { result } = await renderHook(() => useTimezone());

  await act(async () => { await result.current.select('UTC'); });

  expect(mockedUpdateSettings).not.toHaveBeenCalled();
});

test('sync seeds the store with the timezone returned by the backend', async () => {
  mockedGetProfile.mockResolvedValue({
    discord_id: '1', username: 'u', timezone: 'America/New_York', notifications_enabled: true,
  });
  const { result } = await renderHook(() => useTimezone());

  await act(async () => { await result.current.sync(); });

  expect(useSettingsStore.getState().timezone).toBe('America/New_York');
});

test('sync leaves the persisted value untouched when the backend is unreachable', async () => {
  useSettingsStore.setState({ timezone: 'Europe/Warsaw' });
  mockedGetProfile.mockRejectedValue(new Error('offline'));
  const { result } = await renderHook(() => useTimezone());

  await act(async () => { await result.current.sync(); });

  expect(useSettingsStore.getState().timezone).toBe('Europe/Warsaw');
});
