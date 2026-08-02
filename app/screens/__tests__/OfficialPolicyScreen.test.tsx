import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfficialPolicyScreen from '../OfficialPolicyScreen';
import { resolveServer } from '../../api/resolveServer';
import { useServerStore } from '../../store/serverStore';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../../api/resolveServer');
const mockedResolve = resolveServer as jest.Mock;

beforeEach(() => {
  mockedResolve.mockReset();
  useServerStore.setState({ serverUrl: null });
});

async function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <SafeAreaProvider>
      <OfficialPolicyScreen onBack={onBack} />
    </SafeAreaProvider>
  );
}

test('accept resolves the official host over https and saves the base url', async () => {
  mockedResolve.mockResolvedValue({ status: 'ok', baseUrl: 'https://gametrace.rscibor.dev/api/v1' });
  const { getByText } = await renderScreen();
  await fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));
  await waitFor(() =>
    expect(useServerStore.getState().serverUrl).toBe('https://gametrace.rscibor.dev/api/v1')
  );
  expect(mockedResolve).toHaveBeenCalledWith('https://gametrace.rscibor.dev');
});

test('unreachable shows an error, saves nothing, and allows retry', async () => {
  mockedResolve.mockResolvedValue({ status: 'unreachable' });
  const { getByText, findByText } = await renderScreen();
  await fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));
  expect(await findByText(/Nie można połączyć się z oficjalnym serwerem/)).toBeTruthy();
  expect(useServerStore.getState().serverUrl).toBeNull();

  // retry succeeds without leaving the screen
  mockedResolve.mockResolvedValue({ status: 'ok', baseUrl: 'https://gametrace.rscibor.dev/api/v1' });
  await fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));
  await waitFor(() =>
    expect(useServerStore.getState().serverUrl).toBe('https://gametrace.rscibor.dev/api/v1')
  );
});

test('insecure is treated as an error, never applied, and offers no connect-anyway escape hatch', async () => {
  mockedResolve.mockResolvedValue({ status: 'insecure', baseUrl: 'http://gametrace.rscibor.dev/api/v1' });
  const { getByText, findByText, queryByText } = await renderScreen();
  await fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));
  expect(await findByText(/Nie można połączyć się z oficjalnym serwerem/)).toBeTruthy();
  expect(useServerStore.getState().serverUrl).toBeNull();
  expect(queryByText('Połącz mimo to')).toBeNull();
});

test('while a resolve is pending the button reads connecting and cannot be tapped again', async () => {
  let release: (v: unknown) => void = () => {};
  mockedResolve.mockReturnValue(new Promise((res) => { release = res; }));
  const { getByText, queryByText } = await renderScreen();
  // Deliberately NOT awaited: fireEvent adopts the promise returned by the async
  // onPress handler, so awaiting here would block until `release` is called.
  const pending = fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));

  await waitFor(() => expect(getByText('ŁĄCZENIE...')).toBeTruthy());
  expect(queryByText('AKCEPTUJĘ I KONTYNUUJ')).toBeNull();

  await fireEvent.press(getByText('ŁĄCZENIE...'));
  expect(mockedResolve).toHaveBeenCalledTimes(1);

  await act(async () => {
    release({ status: 'ok', baseUrl: 'https://gametrace.rscibor.dev/api/v1' });
    await pending;
  });
});

test('the re-entry guard drops a second onAccept invocation while loading', async () => {
  let release: (v: unknown) => void = () => {};
  mockedResolve.mockReturnValue(new Promise((res) => { release = res; }));
  const { getByText, getByTestId } = await renderScreen();
  // Invoke onAccept directly, bypassing TouchableOpacity's `disabled` prop —
  // RNTL refuses to dispatch a press to a disabled element, and even a raw
  // onClick call on the underlying host node is itself gated by Touchable's
  // own disabled check, either of which would stop the second press before
  // the re-entry guard is ever reached. The host node (found by a stable
  // testID rather than the label, which changes to "ŁĄCZENIE..." while
  // loading) doesn't carry the undecorated onPress itself — TouchableOpacity
  // holds it — so we walk up the fiber tree to find it.
  const pressAccept = () => {
    let fiber = (getByTestId('officialAccept') as any).unstable_fiber;
    while (fiber && !fiber.memoizedProps?.onPress) fiber = fiber.return;
    return fiber.memoizedProps.onPress() as Promise<void>;
  };

  let first!: Promise<void>;
  await act(() => { first = pressAccept(); });
  expect(getByText('ŁĄCZENIE...')).toBeTruthy();

  let second!: Promise<void>;
  await act(() => { second = pressAccept(); });

  expect(mockedResolve).toHaveBeenCalledTimes(1);

  await act(async () => {
    release({ status: 'ok', baseUrl: 'https://gametrace.rscibor.dev/api/v1' });
    await Promise.all([first, second]);
  });
});

test('back calls onBack and writes nothing', async () => {
  const onBack = jest.fn();
  const { getByText } = await renderScreen(onBack);
  await fireEvent.press(getByText('← WSTECZ'));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(useServerStore.getState().serverUrl).toBeNull();
});
