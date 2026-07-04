import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from '../AuthScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockHandleLinkLogin = jest.fn();
const mockHandleLogin = jest.fn();
const mockHandleDiscordLogin = jest.fn();
const mockAuthState: { loading: boolean; error: string | null } = { loading: false, error: null };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    handleLinkLogin: mockHandleLinkLogin,
    handleLogin: mockHandleLogin,
    handleDiscordLogin: mockHandleDiscordLogin,
    discordReady: true,
    loading: mockAuthState.loading,
    error: mockAuthState.error,
  }),
}));

let mockDevUsernameLogin = true;
let mockDiscordOAuth = true;
jest.mock('../../config', () => ({
  get DEV_USERNAME_LOGIN() { return mockDevUsernameLogin; },
  get DISCORD_OAUTH_LOGIN() { return mockDiscordOAuth; },
  DISCORD_CLIENT_ID: 'cid',
}));

beforeEach(() => {
  mockHandleLinkLogin.mockReset();
  mockHandleLogin.mockReset();
  mockHandleDiscordLogin.mockReset();
  mockAuthState.loading = false;
  mockAuthState.error = null;
  mockDevUsernameLogin = true;
  mockDiscordOAuth = true;
});

function renderScreen() {
  return render(
    <SafeAreaProvider>
      <AuthScreen />
    </SafeAreaProvider>
  );
}

test('submit is gated until six digits are entered', async () => {
  const { getByPlaceholderText, getByText } = await renderScreen();
  const input = getByPlaceholderText('231 996');

  await fireEvent.changeText(input, '2319');
  await fireEvent.press(getByText('ZALOGUJ SIĘ'));
  expect(mockHandleLinkLogin).not.toHaveBeenCalled();

  await fireEvent.changeText(input, '231996');
  await fireEvent.press(getByText('ZALOGUJ SIĘ'));
  expect(mockHandleLinkLogin).toHaveBeenCalledWith('231996');
});

test('the code field displays the grouped XXX XXX format', async () => {
  const { getByPlaceholderText } = await renderScreen();
  const input = getByPlaceholderText('231 996');

  await fireEvent.changeText(input, '231996');

  expect(input.props.value).toBe('231 996');
});

test('the dev username toggle is shown when the flag is on', async () => {
  const { getByText } = await renderScreen();
  expect(getByText(/nazwą/i)).toBeTruthy();
});

test('the dev username toggle is hidden when the flag is off', async () => {
  mockDevUsernameLogin = false;
  const { queryByText } = await renderScreen();
  expect(queryByText(/nazwą/i)).toBeNull();
});

test('switching to dev mode submits via the username handler', async () => {
  const { getByText, getByPlaceholderText } = await renderScreen();

  await fireEvent.press(getByText(/nazwą/i));
  await fireEvent.changeText(getByPlaceholderText('Your Discord username'), 'someuser');
  await fireEvent.press(getByText('ZALOGUJ SIĘ'));

  expect(mockHandleLogin).toHaveBeenCalledWith('someuser');
});

test('an error from the hook is rendered', async () => {
  mockAuthState.error = 'Nieprawidłowy lub wygasły kod.';
  const { getByText } = await renderScreen();
  expect(getByText('Nieprawidłowy lub wygasły kod.')).toBeTruthy();
});

test('the Discord button is shown when the OAuth flag is on', async () => {
  const { getByText } = await renderScreen();
  expect(getByText(/przez Discord/i)).toBeTruthy();
});

test('the Discord button is hidden when the OAuth flag is off', async () => {
  mockDiscordOAuth = false;
  const { queryByText } = await renderScreen();
  expect(queryByText(/przez Discord/i)).toBeNull();
});

test('tapping the Discord button calls the OAuth handler', async () => {
  const { getByText } = await renderScreen();
  await fireEvent.press(getByText(/przez Discord/i));
  expect(mockHandleDiscordLogin).toHaveBeenCalled();
});
