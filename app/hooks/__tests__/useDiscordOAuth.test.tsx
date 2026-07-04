import { renderHook, act } from '@testing-library/react-native';

const mockPromptAsync = jest.fn();
let mockRequest: any = { codeVerifier: 'verifier-123' };
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session', () => ({
  ResponseType: { Code: 'code' },
  makeRedirectUri: () => 'gametrace://oauth',
  useAuthRequest: () => [mockRequest, null, mockPromptAsync],
}));
jest.mock('../../config', () => ({ DISCORD_CLIENT_ID: 'cid' }));

import { useDiscordOAuth } from '../useDiscordOAuth';

beforeEach(() => {
  mockPromptAsync.mockReset();
  mockRequest = { codeVerifier: 'verifier-123' };
});

test('ready is true once the request object exists', async () => {
  const { result } = await renderHook(() => useDiscordOAuth());
  expect(result.current.ready).toBe(true);
});

test('a successful prompt returns code, verifier and redirect uri', async () => {
  mockPromptAsync.mockResolvedValue({ type: 'success', params: { code: 'auth-code' } });
  const { result } = await renderHook(() => useDiscordOAuth());

  let out: any;
  await act(async () => { out = await result.current.promptDiscord(); });

  expect(out).toEqual({
    type: 'success',
    code: 'auth-code',
    codeVerifier: 'verifier-123',
    redirectUri: 'gametrace://oauth',
  });
});

test('a cancelled prompt maps to type cancel', async () => {
  mockPromptAsync.mockResolvedValue({ type: 'cancel' });
  const { result } = await renderHook(() => useDiscordOAuth());

  let out: any;
  await act(async () => { out = await result.current.promptDiscord(); });

  expect(out).toEqual({ type: 'cancel' });
});

test('a successful prompt with no code verifier maps to type error', async () => {
  mockRequest = {};
  mockPromptAsync.mockResolvedValue({ type: 'success', params: { code: 'auth-code' } });
  const { result } = await renderHook(() => useDiscordOAuth());

  let out: any;
  await act(async () => { out = await result.current.promptDiscord(); });

  expect(out).toEqual({ type: 'error' });
});
