import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '../authStore';

const setUser = Sentry.setUser as jest.Mock;

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
