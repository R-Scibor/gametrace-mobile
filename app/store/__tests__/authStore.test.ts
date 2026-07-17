import { useAuthStore } from '../authStore';
import { waitFor } from '@testing-library/react-native';
import { setCache, getCache } from '../../utils/cacheStorage';

beforeEach(() =>
  useAuthStore.setState({ token: null, user: null, isAdmin: false, isAuthenticated: false })
);

test('login stores the admin flag from the response', () => {
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' }, true);

  expect(useAuthStore.getState().isAdmin).toBe(true);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('login defaults isAdmin to false when omitted', () => {
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' });

  expect(useAuthStore.getState().isAdmin).toBe(false);
});

test('logout clears the admin flag', () => {
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' }, true);

  useAuthStore.getState().logout();

  expect(useAuthStore.getState().isAdmin).toBe(false);
});

test('logout clears cached snapshots', async () => {
  await setCache('cache:s:1:dashboard', 1);

  useAuthStore.getState().logout();

  await waitFor(async () => expect(await getCache('cache:s:1:dashboard')).toBeNull());
});
