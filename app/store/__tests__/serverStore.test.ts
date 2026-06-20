import { useServerStore } from '../serverStore';

beforeEach(() => {
  useServerStore.setState({ serverUrl: null });
});

test('defaults to null', () => {
  expect(useServerStore.getState().serverUrl).toBeNull();
});

test('setServerUrl stores the url', () => {
  useServerStore.getState().setServerUrl('https://host:8010/api/v1');
  expect(useServerStore.getState().serverUrl).toBe('https://host:8010/api/v1');
});

test('clearServerUrl resets to null', () => {
  useServerStore.getState().setServerUrl('https://host:8010/api/v1');
  useServerStore.getState().clearServerUrl();
  expect(useServerStore.getState().serverUrl).toBeNull();
});
