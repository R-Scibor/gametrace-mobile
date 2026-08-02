import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

test('insecure is treated as an error, never applied', async () => {
  mockedResolve.mockResolvedValue({ status: 'insecure', baseUrl: 'http://gametrace.rscibor.dev/api/v1' });
  const { getByText, findByText } = await renderScreen();
  await fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));
  expect(await findByText(/Nie można połączyć się z oficjalnym serwerem/)).toBeTruthy();
  expect(useServerStore.getState().serverUrl).toBeNull();
});

test('a second press while connecting does not fire a second resolve', async () => {
  let release: (v: unknown) => void = () => {};
  mockedResolve.mockReturnValue(new Promise((res) => { release = res; }));
  const { getByText } = await renderScreen();
  await fireEvent.press(getByText('AKCEPTUJĘ I KONTYNUUJ'));
  await fireEvent.press(getByText('ŁĄCZENIE...'));
  expect(mockedResolve).toHaveBeenCalledTimes(1);
  release({ status: 'ok', baseUrl: 'https://gametrace.rscibor.dev/api/v1' });
});

test('back calls onBack and writes nothing', async () => {
  const onBack = jest.fn();
  const { getByText } = await renderScreen(onBack);
  await fireEvent.press(getByText('← WSTECZ'));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(useServerStore.getState().serverUrl).toBeNull();
});
