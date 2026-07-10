jest.mock('../../navigation/navigationRef', () => ({
  navigationRef: { getCurrentRoute: jest.fn() },
}));

import { navigationRef } from '../../navigation/navigationRef';
import { buildReportContext } from '../reportContext';
import appJson from '../../../app.json';

test('buildReportContext includes current screen name', () => {
  (navigationRef.getCurrentRoute as jest.Mock).mockReturnValue({ name: 'Dashboard' });
  const ctx = buildReportContext();
  expect(ctx.screen).toBe('Dashboard');
  expect(ctx.appVersion).toBe(appJson.expo.version);
  expect(typeof ctx.platform).toBe('string');
  expect(typeof ctx.osVersion).toBe('string');
});

test('buildReportContext falls back to unknown before nav is ready', () => {
  (navigationRef.getCurrentRoute as jest.Mock).mockReturnValue(undefined);
  expect(buildReportContext().screen).toBe('unknown');
});
