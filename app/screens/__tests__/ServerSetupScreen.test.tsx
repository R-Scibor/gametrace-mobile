import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ServerSetupScreen from '../ServerSetupScreen';
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

async function renderScreen() {
  return render(
    <SafeAreaProvider>
      <ServerSetupScreen />
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

test('insecure result prompts before saving', async () => {
  mockedResolve.mockResolvedValue({ status: 'insecure', baseUrl: 'http://h:8010/api/v1' });
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    // press the confirm button (second)
    buttons?.[1]?.onPress?.();
  });
  const { getByPlaceholderText, getByText } = await renderScreen();
  await fireEvent.changeText(getByPlaceholderText('host:port'), 'h:8010');
  await fireEvent.press(getByText('POŁĄCZ'));
  await waitFor(() =>
    expect(useServerStore.getState().serverUrl).toBe('http://h:8010/api/v1')
  );
  alertSpy.mockRestore();
});

test('unreachable shows an error and does not save', async () => {
  mockedResolve.mockResolvedValue({ status: 'unreachable' });
  const { getByPlaceholderText, getByText, findByText } = await renderScreen();
  await fireEvent.changeText(getByPlaceholderText('host:port'), 'h:8010');
  await fireEvent.press(getByText('POŁĄCZ'));
  expect(await findByText('Nie można połączyć się z serwerem')).toBeTruthy();
  expect(useServerStore.getState().serverUrl).toBeNull();
});
