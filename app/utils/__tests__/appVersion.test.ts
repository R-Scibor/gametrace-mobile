jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.4.3' } },
}));
jest.mock('expo-application', () => ({
  nativeBuildVersion: '12',
}));

import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { appVersion, buildNumber, formatAppVersion } from '../appVersion';

beforeEach(() => {
  (Constants as any).expoConfig = { version: '0.4.3' };
  (Application as any).nativeBuildVersion = '12';
});

test('reads the app version from expoConfig and the build number from the installed binary', () => {
  expect(appVersion()).toBe('0.4.3');
  expect(buildNumber()).toBe('12');
});

test('formats version and build number together', () => {
  expect(formatAppVersion()).toBe('v0.4.3 (12)');
});

test('omits the build number when there is no native binary (Expo Go, dev client)', () => {
  (Application as any).nativeBuildVersion = null;

  expect(buildNumber()).toBeNull();
  expect(formatAppVersion()).toBe('v0.4.3');
});

test('falls back to a dash when there is no config at all', () => {
  (Constants as any).expoConfig = null;
  (Application as any).nativeBuildVersion = null;

  expect(formatAppVersion()).toBe('v—');
});
