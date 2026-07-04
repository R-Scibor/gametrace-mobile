import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { login, linkLogin } from '../../api/auth';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

jest.mock('axios', () => ({ __esModule: true, default: { create: () => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }) } }));
jest.mock('../../api/auth');
const mockedLogin = login as jest.Mock;
const mockedLinkLogin = linkLogin as jest.Mock;

beforeEach(() => {
  mockedLogin.mockReset();
  mockedLinkLogin.mockReset();
  useSettingsStore.setState({ timezone: 'UTC' });
  useAuthStore.setState({ token: null, user: null, isAdmin: false, isAuthenticated: false });
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

describe('handleLinkLogin', () => {
  test('a successful redemption seeds token, admin flag and timezone', async () => {
    mockedLinkLogin.mockResolvedValue({
      token: 't', discord_id: '1', username: 'u', timezone: 'America/New_York', is_admin: true,
    });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231 996'); });

    const auth = useAuthStore.getState();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.token).toBe('t');
    expect(auth.isAdmin).toBe(true);
    expect(auth.user).toEqual({ discordId: '1', username: 'u' });
    expect(useSettingsStore.getState().timezone).toBe('America/New_York');
  });

  test('401 → invalid/expired code message', async () => {
    mockedLinkLogin.mockRejectedValue({ response: { status: 401 } });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231996'); });

    expect(result.current.error).toMatch(/wygasł/i);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test('429 surfaces the Retry-After seconds', async () => {
    mockedLinkLogin.mockRejectedValue({ response: { status: 429, headers: { 'retry-after': '45' } } });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231996'); });

    expect(result.current.error).toContain('45');
  });

  test('429 without a Retry-After header falls back to a generic rate-limit message', async () => {
    mockedLinkLogin.mockRejectedValue({ response: { status: 429, headers: {} } });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231996'); });

    expect(result.current.error).toMatch(/zbyt wiele prób/i);
    expect(result.current.error).toMatch(/później/i);
    expect(result.current.error).not.toMatch(/\d+\s*s\./);
  });

  test('422 → six-digit format message', async () => {
    mockedLinkLogin.mockRejectedValue({ response: { status: 422 } });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231996'); });

    expect(result.current.error).toMatch(/6 cyfr/i);
  });

  test('503 → temporarily unavailable message', async () => {
    mockedLinkLogin.mockRejectedValue({ response: { status: 503 } });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231996'); });

    expect(result.current.error).toMatch(/niedostępne/i);
  });

  test('no response → generic connection error', async () => {
    mockedLinkLogin.mockRejectedValue({ message: 'Network Error' });
    const { result } = await renderHook(() => useAuth());

    await act(async () => { await result.current.handleLinkLogin('231996'); });

    expect(result.current.error).toMatch(/połączenia/i);
  });
});
