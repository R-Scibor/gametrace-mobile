import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { linkLogin, discordLogin } from '../../api/auth';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useServerJoinStore } from '../../store/serverJoinStore';
import { useDeletionHandoffStore } from '../../store/deletionHandoffStore';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    }),
  },
}));
jest.mock('../../api/auth');
const mockedLinkLogin = linkLogin as jest.Mock;
const mockedDiscordLogin = discordLogin as jest.Mock;

const mockPromptDiscord = jest.fn();
jest.mock('../useDiscordOAuth', () => ({
  useDiscordOAuth: () => ({ ready: true, promptDiscord: mockPromptDiscord }),
}));

const pending = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

const handoffSample = { ...pending };

beforeEach(() => {
  mockedLinkLogin.mockReset();
  mockedDiscordLogin.mockReset();
  mockPromptDiscord.mockReset();
  useSettingsStore.setState({ timezone: 'UTC' });
  useAuthStore.setState({
    token: null,
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    pendingDeletion: null,
  });
  useServerJoinStore.setState({ visible: false });
  useDeletionHandoffStore.getState().clear();
});

describe('seedSession / pending_deletion', () => {
  test('link login with pending_deletion seeds auth and clears handoff', async () => {
    useDeletionHandoffStore.getState().save(handoffSample);
    mockedLinkLogin.mockResolvedValue({
      token: 't',
      discord_id: '1',
      username: 'u',
      timezone: 'Europe/Warsaw',
      is_admin: false,
      pending_deletion: pending,
    });
    const { result } = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLinkLogin('231996');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().pendingDeletion).toEqual(pending);
    expect(useDeletionHandoffStore.getState().status).toBeNull();
  });

  test('link login without pending_deletion sets pending to null and still clears handoff', async () => {
    useDeletionHandoffStore.getState().save(handoffSample);
    mockedLinkLogin.mockResolvedValue({
      token: 't',
      discord_id: '1',
      username: 'u',
      timezone: 'UTC',
      is_admin: false,
    });
    const { result } = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLinkLogin('231996');
    });

    expect(useAuthStore.getState().pendingDeletion).toBeNull();
    expect(useDeletionHandoffStore.getState().status).toBeNull();
  });
});

describe('handleDiscordLogin server-join vs pending_deletion', () => {
  test('needs_server_join without pending shows join prompt', async () => {
    mockPromptDiscord.mockResolvedValue({
      type: 'success',
      code: 'c',
      codeVerifier: 'v',
      redirectUri: 'r',
    });
    mockedDiscordLogin.mockResolvedValue({
      token: 't',
      discord_id: '1',
      username: 'u',
      timezone: 'UTC',
      is_admin: false,
      needs_server_join: true,
    });
    const { result } = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleDiscordLogin();
    });

    expect(useServerJoinStore.getState().visible).toBe(true);
  });

  test('needs_server_join with pending_deletion does not show join prompt', async () => {
    mockPromptDiscord.mockResolvedValue({
      type: 'success',
      code: 'c',
      codeVerifier: 'v',
      redirectUri: 'r',
    });
    mockedDiscordLogin.mockResolvedValue({
      token: 't',
      discord_id: '1',
      username: 'u',
      timezone: 'UTC',
      is_admin: false,
      needs_server_join: true,
      pending_deletion: pending,
    });
    const { result } = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleDiscordLogin();
    });

    expect(useAuthStore.getState().pendingDeletion).toEqual(pending);
    expect(useServerJoinStore.getState().visible).toBe(false);
  });
});
