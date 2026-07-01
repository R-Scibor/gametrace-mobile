jest.mock('../../navigation/navigationRef', () => ({
  navigationRef: { getCurrentRoute: jest.fn() },
}));

import { navigationRef } from '../../navigation/navigationRef';
import { buildReportContext } from '../reportContext';

test('buildReportContext includes current screen name', () => {
  (navigationRef.getCurrentRoute as jest.Mock).mockReturnValue({ name: 'Dashboard' });
  const ctx = buildReportContext();
  expect(ctx.screen).toBe('Dashboard');
  expect(ctx.appVersion).toBe('1.0.0');
  expect(typeof ctx.platform).toBe('string');
  expect(typeof ctx.osVersion).toBe('string');
});

test('buildReportContext falls back to unknown before nav is ready', () => {
  (navigationRef.getCurrentRoute as jest.Mock).mockReturnValue(undefined);
  expect(buildReportContext().screen).toBe('unknown');
});
