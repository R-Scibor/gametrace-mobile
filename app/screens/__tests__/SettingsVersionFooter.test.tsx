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

import { render } from '@testing-library/react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import SettingsScreen from '../SettingsScreen';
import { setActiveLanguage } from '../../i18n';

beforeEach(async () => {
  (Constants as any).expoConfig = { version: '0.4.3' };
  (Application as any).nativeBuildVersion = '12';
  await setActiveLanguage('pl');
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
