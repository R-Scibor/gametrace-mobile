jest.mock('axios', () => ({
  __esModule: true,
  default: {
    isAxiosError: jest.fn(),
  },
}));

import { useDeletionHandoffStore } from '../deletionHandoffStore';
import { useAuthStore } from '../authStore';

const sample = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

beforeEach(() => {
  useDeletionHandoffStore.getState().clear();
  useAuthStore.setState({
    token: null, user: null, isAdmin: false, isAuthenticated: false, pendingDeletion: null,
  });
});

test('handoff survives auth logout', () => {
  useDeletionHandoffStore.getState().save(sample);
  useAuthStore.getState().login('t', { discordId: '1', username: 'u' });
  useAuthStore.getState().logout();
  expect(useDeletionHandoffStore.getState().status).toEqual(sample);
});

test('clear removes handoff', () => {
  useDeletionHandoffStore.getState().save(sample);
  useDeletionHandoffStore.getState().clear();
  expect(useDeletionHandoffStore.getState().status).toBeNull();
});
