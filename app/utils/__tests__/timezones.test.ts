import { getDeviceTimezone } from '../timezones';

test('returns the device IANA timezone when available', () => {
  const spy = jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone: 'Europe/Warsaw' }),
  } as any);
  expect(getDeviceTimezone()).toBe('Europe/Warsaw');
  spy.mockRestore();
});

test('falls back to UTC when the device timezone is unavailable', () => {
  const spy = jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone: undefined }),
  } as any);
  expect(getDeviceTimezone()).toBe('UTC');
  spy.mockRestore();
});
