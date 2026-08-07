jest.mock('axios', () => ({
  __esModule: true,
  default: {
    isAxiosError: jest.fn(),
  },
}));

import axios from 'axios';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  daysLeftUntil,
  isDeletionStatus,
  pendingDeletionFromError,
} from '../accountDeletion';

const isAxiosError = axios.isAxiosError as jest.Mock;

const sample = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

test('grace days is 7', () => {
  expect(ACCOUNT_DELETION_GRACE_DAYS).toBe(7);
});

test('isDeletionStatus accepts a valid payload', () => {
  expect(isDeletionStatus(sample)).toBe(true);
  expect(isDeletionStatus({ ...sample, days_left: '7' })).toBe(false);
  expect(isDeletionStatus(null)).toBe(false);
});

test('daysLeftUntil floors at 1 and falls back on bad dates', () => {
  const far = new Date(Date.now() + 3.2 * 86_400_000).toISOString();
  expect(daysLeftUntil(far, 99)).toBeGreaterThanOrEqual(3);
  expect(daysLeftUntil('not-a-date', 5)).toBe(5);
  const past = new Date(Date.now() - 86_400_000).toISOString();
  expect(daysLeftUntil(past, 9)).toBe(1);
});

test('pendingDeletionFromError only matches nested grace 403', () => {
  const err = Object.assign(new Error('x'), {
    isAxiosError: true,
    response: {
      status: 403,
      data: { detail: { detail: 'Account scheduled for deletion', ...sample } },
    },
    toJSON: () => ({}),
  });
  isAxiosError.mockReturnValue(true);
  expect(pendingDeletionFromError(err)).toEqual(sample);

  expect(
    pendingDeletionFromError({
      response: { status: 403, data: { detail: 'Admin access required' } },
    }),
  ).toBeNull();

  isAxiosError.mockReturnValue(true);
  const wrongStatus = {
    response: {
      status: 401,
      data: { detail: { detail: 'Account scheduled for deletion', ...sample } },
    },
  };
  expect(pendingDeletionFromError(wrongStatus)).toBeNull();
});
