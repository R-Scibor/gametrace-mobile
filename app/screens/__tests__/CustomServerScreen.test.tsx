import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomServerScreen from '../CustomServerScreen';
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
      <CustomServerScreen onBack={onBack} />
    </SafeAreaProvider>
  );
}

test('ok result saves the base url', async () => {
  mockedResolve.mockResolvedValue({ status: 'ok', baseUrl: 'https://h:8010/api/v1' });
  const { getByPlaceholderText, getByText } = await renderScreen();
  await fireEvent.changeText(getByPlaceholderText('host:port'), 'h:8010');
  await fireEvent.press(getByText('POŁĄCZ'));
  await waitFor(() =>
    expect(useServerStore.getState().serverUrl).toBe('https://h:8010/api/v1')
  );
});

test('insecure result shows a styled confirm sheet, and saves only on confirm', async () => {
  mockedResolve.mockResolvedValue({ status: 'insecure', baseUrl: 'http://h:8010/api/v1' });
  const { getByPlaceholderText, getByText, findByText } = await renderScreen();
  await fireEvent.changeText(getByPlaceholderText('host:port'), 'h:8010');
  await fireEvent.press(getByText('POŁĄCZ'));
  // styled ConfirmSheet appears; nothing saved until the user confirms
  const confirmBtn = await findByText('Połącz mimo to');
  expect(useServerStore.getState().serverUrl).toBeNull();
  await fireEvent.press(confirmBtn);
  await waitFor(() =>
    expect(useServerStore.getState().serverUrl).toBe('http://h:8010/api/v1')
  );
});

test('unreachable shows an error and does not save', async () => {
  mockedResolve.mockResolvedValue({ status: 'unreachable' });
  const { getByPlaceholderText, getByText, findByText } = await renderScreen();
  await fireEvent.changeText(getByPlaceholderText('host:port'), 'h:8010');
  await fireEvent.press(getByText('POŁĄCZ'));
  expect(await findByText('Nie można połączyć się z serwerem')).toBeTruthy();
  expect(useServerStore.getState().serverUrl).toBeNull();
});

test('invalid input shows an error and does not save', async () => {
  mockedResolve.mockResolvedValue({ status: 'invalid' });
  const { getByPlaceholderText, getByText, findByText } = await renderScreen();
  await fireEvent.changeText(getByPlaceholderText('host:port'), 'h:8010');
  await fireEvent.press(getByText('POŁĄCZ'));
  expect(await findByText('Podaj adres serwera (host:port)')).toBeTruthy();
  expect(useServerStore.getState().serverUrl).toBeNull();
});

test('back calls onBack and writes nothing', async () => {
  const onBack = jest.fn();
  const { getByText } = await renderScreen(onBack);
  await fireEvent.press(getByText('← WSTECZ'));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(useServerStore.getState().serverUrl).toBeNull();
});

test('prefills the official host as a format example', async () => {
  const { getByDisplayValue } = await renderScreen();
  expect(getByDisplayValue('gametrace.rscibor.dev')).toBeTruthy();
});
