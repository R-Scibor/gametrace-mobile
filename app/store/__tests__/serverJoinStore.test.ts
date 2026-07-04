import { useServerJoinStore } from '../serverJoinStore';

beforeEach(() => useServerJoinStore.setState({ visible: false }));

test('show() makes the prompt visible', () => {
  useServerJoinStore.getState().show();
  expect(useServerJoinStore.getState().visible).toBe(true);
});

test('hide() dismisses the prompt', () => {
  useServerJoinStore.setState({ visible: true });
  useServerJoinStore.getState().hide();
  expect(useServerJoinStore.getState().visible).toBe(false);
});
