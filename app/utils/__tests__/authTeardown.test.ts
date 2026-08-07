import {
  suspendAuthTeardown,
  resumeAuthTeardown,
  isAuthTeardownSuspended,
} from '../authTeardown';

beforeEach(() => resumeAuthTeardown());

test('suspend and resume toggle the flag', () => {
  expect(isAuthTeardownSuspended()).toBe(false);
  suspendAuthTeardown();
  expect(isAuthTeardownSuspended()).toBe(true);
  resumeAuthTeardown();
  expect(isAuthTeardownSuspended()).toBe(false);
});
