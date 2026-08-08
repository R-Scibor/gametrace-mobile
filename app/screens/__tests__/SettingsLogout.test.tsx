jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('../../api/profile', () => ({
  ...jest.requireActual('../../api/profile'),
  logout: jest.fn(() => Promise.resolve()),
}));

import { render, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { logout as logoutApi } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { setActiveLanguage } from '../../i18n';

const mockedLogoutApi = logoutApi as jest.Mock;

beforeEach(async () => {
  mockedLogoutApi.mockReset();
  mockedLogoutApi.mockResolvedValue(undefined);
  useAlertStore.setState({ alert: null });
  useAuthStore.getState().login('tok', { discordId: '42', username: 'ada' });
  await setActiveLanguage('pl');
});

test('tapping logout asks for confirmation and calls nothing yet', async () => {
  const { getByText } = await render(<SettingsScreen />);

  await fireEvent.press(getByText('WYLOGUJ SIĘ'));

  expect(getByText('Wylogować się?')).toBeTruthy();
  expect(mockedLogoutApi).not.toHaveBeenCalled();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('confirming logs out through the API and clears local auth', async () => {
  const { getByText } = await render(<SettingsScreen />);

  await fireEvent.press(getByText('WYLOGUJ SIĘ'));
  await fireEvent.press(getByText('Wyloguj się'));

  expect(mockedLogoutApi).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test('a failed API logout still clears local auth and warns the user', async () => {
  mockedLogoutApi.mockRejectedValue(new Error('offline'));
  const { getByText } = await render(<SettingsScreen />);

  await fireEvent.press(getByText('WYLOGUJ SIĘ'));
  await fireEvent.press(getByText('Wyloguj się'));

  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useAlertStore.getState().alert).toEqual({
    title: 'Wylogowano lokalnie',
    message: 'Nie udało się powiadomić serwera. Sesja może tam nadal być aktywna.',
  });
});
