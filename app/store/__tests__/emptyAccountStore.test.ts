import { useEmptyAccountStore } from '../emptyAccountStore';
import { useAuthStore } from '../../store/authStore';

beforeEach(() => useEmptyAccountStore.setState({ isEmpty: null }));

test('starts undetermined so consumers suppress the preview', () => {
  expect(useEmptyAccountStore.getState().isEmpty).toBeNull();
});

test('setIsEmpty records the published verdict', () => {
  useEmptyAccountStore.getState().setIsEmpty(true);
  expect(useEmptyAccountStore.getState().isEmpty).toBe(true);

  useEmptyAccountStore.getState().setIsEmpty(false);
  expect(useEmptyAccountStore.getState().isEmpty).toBe(false);
});

test('reset() returns to undetermined', () => {
  useEmptyAccountStore.setState({ isEmpty: false });
  useEmptyAccountStore.getState().reset();
  expect(useEmptyAccountStore.getState().isEmpty).toBeNull();
});

test('logging out clears the previous account verdict', () => {
  useEmptyAccountStore.setState({ isEmpty: false });
  useAuthStore.getState().logout();
  expect(useEmptyAccountStore.getState().isEmpty).toBeNull();
});
