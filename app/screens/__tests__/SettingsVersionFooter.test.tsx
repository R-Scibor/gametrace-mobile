jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.4.3' } },
}));
jest.mock('expo-application', () => ({
  nativeBuildVersion: '12',
}));

import { render, fireEvent } from '@testing-library/react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import SettingsScreen from '../SettingsScreen';
import { setActiveLanguage } from '../../i18n';

beforeEach(async () => {
  (Constants as any).expoConfig = { version: '0.4.3' };
  (Application as any).nativeBuildVersion = '12';
  delete process.env.EXPO_PUBLIC_SENTRY_SMOKE;
  await setActiveLanguage('pl');
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_SENTRY_SMOKE;
});

test('footer shows the app version and build number, with a dash for the unreachable backend', async () => {
  const { getByText } = await render(<SettingsScreen />);

  expect(getByText('GAMETRACE v0.4.3 (12) · API —')).toBeTruthy();
});

test('footer omits the build number when there is no native binary (Expo Go, dev client)', async () => {
  (Application as any).nativeBuildVersion = null;

  const { getByText } = await render(<SettingsScreen />);

  expect(getByText('GAMETRACE v0.4.3 · API —')).toBeTruthy();
});

// The smoke trigger ships in the tester AAB, so the default-off path is the one
// that protects testers: an OTA drops EXPO_PUBLIC_SENTRY_SMOKE and the long-press
// must go inert. If this ever regressed, a tester could crash the app on a gesture.
test('long-pressing the version does nothing when the smoke flag is unset', async () => {
  const { getByText } = await render(<SettingsScreen />);

  await expect(
    fireEvent(getByText('GAMETRACE v0.4.3 (12) · API —'), 'longPress'),
  ).resolves.not.toThrow();
});

test('long-pressing the version throws when the smoke flag is set', async () => {
  process.env.EXPO_PUBLIC_SENTRY_SMOKE = '1';
  const { getByText } = await render(<SettingsScreen />);

  // fireEvent is async here, so the throw surfaces as a rejection, not a sync throw.
  await expect(
    fireEvent(getByText('GAMETRACE v0.4.3 (12) · API —'), 'longPress'),
  ).rejects.toThrow('Sentry smoke test');
});
