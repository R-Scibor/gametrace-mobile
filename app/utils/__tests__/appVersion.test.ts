jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.4.3', android: { versionCode: 12 } } },
}));

import Constants from 'expo-constants';
import { appVersion, buildNumber, formatAppVersion } from '../appVersion';

beforeEach(() => {
  (Constants as any).expoConfig = { version: '0.4.3', android: { versionCode: 12 } };
});

test('reads the app version and the EAS-injected build number', () => {
  expect(appVersion()).toBe('0.4.3');
  expect(buildNumber()).toBe(12);
});

test('formats version and build number together', () => {
  expect(formatAppVersion()).toBe('v0.4.3 (12)');
});

test('omits the build number when EAS has not injected one', () => {
  (Constants as any).expoConfig = { version: '0.4.3' };

  expect(buildNumber()).toBeNull();
  expect(formatAppVersion()).toBe('v0.4.3');
});

test('falls back to a dash when there is no config at all', () => {
  (Constants as any).expoConfig = null;

  expect(formatAppVersion()).toBe('v—');
});
