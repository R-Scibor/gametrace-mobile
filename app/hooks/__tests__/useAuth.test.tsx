import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { login } from '../../api/auth';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

jest.mock('axios', () => ({ __esModule: true, default: { create: () => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }) } }));
jest.mock('../../api/auth');
const mockedLogin = login as jest.Mock;

beforeEach(() => {
  mockedLogin.mockReset();
  useSettingsStore.setState({ timezone: 'UTC' });
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

test('a successful login seeds the settings store with the timezone from the backend', async () => {
  mockedLogin.mockResolvedValue({
    token: 't', discord_id: '1', username: 'u', timezone: 'America/New_York',
  });
  const { result } = await renderHook(() => useAuth());

  await act(async () => { await result.current.handleLogin('u'); });

  expect(useSettingsStore.getState().timezone).toBe('America/New_York');
});

test('a failed login leaves the timezone untouched', async () => {
  useSettingsStore.setState({ timezone: 'Europe/Warsaw' });
  mockedLogin.mockRejectedValue({ response: { data: { detail: 'nope' } } });
  const { result } = await renderHook(() => useAuth());

  await act(async () => { await result.current.handleLogin('u'); });

  expect(useSettingsStore.getState().timezone).toBe('Europe/Warsaw');
});
