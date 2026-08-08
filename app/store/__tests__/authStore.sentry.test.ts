import * as Sentry from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../authStore';

const setUser = Sentry.setUser as jest.Mock;
const getItemAsync = SecureStore.getItemAsync as jest.Mock;

beforeEach(() => {
  useAuthStore.getState().logout();
  setUser.mockClear();
});

test('login identifies the user to Sentry by discordId', () => {
  useAuthStore.getState().login('tok', { discordId: '42', username: 'ada' });

  expect(setUser).toHaveBeenCalledWith({ id: '42' });
});

test('login never hands the username to Sentry', () => {
  useAuthStore.getState().login('tok', { discordId: '42', username: 'ada' });

  expect(JSON.stringify(setUser.mock.calls)).not.toContain('ada');
});

test('logout clears the Sentry user', () => {
  useAuthStore.getState().login('tok', { discordId: '42', username: 'ada' });
  setUser.mockClear();

  useAuthStore.getState().logout();

  expect(setUser).toHaveBeenCalledWith(null);
});

test('rehydrating a signed-in session (cold start) identifies the user to Sentry', async () => {
  getItemAsync.mockResolvedValueOnce(
    JSON.stringify({
      state: {
        token: 'tok',
        user: { discordId: '42', username: 'ada' },
        isAdmin: false,
        isAuthenticated: true,
        pendingDeletion: null,
      },
      version: 0,
    })
  );

  await useAuthStore.persist.rehydrate();

  expect(setUser).toHaveBeenCalledWith({ id: '42' });
});

test('rehydrating a signed-out session does not identify a user', async () => {
  getItemAsync.mockResolvedValueOnce(
    JSON.stringify({
      state: { token: null, user: null, isAdmin: false, isAuthenticated: false, pendingDeletion: null },
      version: 0,
    })
  );

  await useAuthStore.persist.rehydrate();

  expect(setUser).not.toHaveBeenCalled();
});
