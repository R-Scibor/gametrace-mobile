import { useAuthStore } from '../authStore';
import { waitFor } from '@testing-library/react-native';
import { setCache, getCache } from '../../utils/cacheStorage';

beforeEach(() =>
  useAuthStore.setState({
    token: null, user: null, isAdmin: false, isAuthenticated: false, pendingDeletion: null,
  })
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

test('login stores pendingDeletion', () => {
  const pending = {
    deletion_requested_at: '2026-08-04T12:00:00Z',
    purge_at: '2026-08-14T12:00:00Z',
    days_left: 7,
  };
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' }, false, pending);
  expect(useAuthStore.getState().pendingDeletion).toEqual(pending);
});

test('logout clears pendingDeletion', () => {
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' }, false, {
    deletion_requested_at: 'a', purge_at: 'b', days_left: 1,
  });
  useAuthStore.getState().logout();
  expect(useAuthStore.getState().pendingDeletion).toBeNull();
});

test('login defaults pendingDeletion to null', () => {
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' });
  expect(useAuthStore.getState().pendingDeletion).toBeNull();
});
