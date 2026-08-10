jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.4.3' } },
}));
jest.mock('expo-application', () => ({
  __esModule: true,
  nativeBuildVersion: '12',
}));
jest.mock('expo-updates', () => ({
  __esModule: true,
  updateId: '45a04a48-6cfd-4953-9c41-4bf6f5b41809',
}));

import { render } from '@testing-library/react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import SettingsScreen from '../SettingsScreen';
import { setActiveLanguage } from '../../i18n';

beforeEach(async () => {
  (Constants as any).expoConfig = { version: '0.4.3' };
  (Application as any).nativeBuildVersion = '12';
  (Updates as any).updateId = '45a04a48-6cfd-4953-9c41-4bf6f5b41809';
  await setActiveLanguage('pl');
});

test('footer shows the app version and build number', async () => {
  const { getByText } = await render(<SettingsScreen />);

  expect(getByText('GAMETRACE v0.4.3 (12)')).toBeTruthy();
});

test('footer omits the build number when there is no native binary (Expo Go, dev client)', async () => {
  (Application as any).nativeBuildVersion = null;

  const { getByText } = await render(<SettingsScreen />);

  expect(getByText('GAMETRACE v0.4.3')).toBeTruthy();
});

// The update id is the only identifier that changes when an OTA lands — version
// and build number are both pinned to the installed binary.
test('detail line shows the short update id beside the backend version', async () => {
  const { getByText } = await render(<SettingsScreen />);

  expect(getByText('45a04a4 · API —')).toBeTruthy();
});

test('detail line drops the update id where updates are disabled (Expo Go, dev client)', async () => {
  (Updates as any).updateId = null;

  const { getByText } = await render(<SettingsScreen />);

  expect(getByText('API —')).toBeTruthy();
});
