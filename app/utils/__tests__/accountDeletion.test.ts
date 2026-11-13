jest.mock('axios', () => ({
  __esModule: true,
  default: {
    isAxiosError: jest.fn(),
  },
}));

import axios from 'axios';
import {
  daysLeftUntil,
  graceDaysFrom,
  isDeletionStatus,
  pendingDeletionFromError,
} from '../accountDeletion';

const isAxiosError = axios.isAxiosError as unknown as jest.Mock;

const sample = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

test('graceDaysFrom prefers a scheduled payload over /health', () => {
  expect(graceDaysFrom({ grace_days: 3 }, { grace_days: 14 })).toBe(3);
  expect(graceDaysFrom(null, { grace_days: 14 })).toBe(14);
  expect(graceDaysFrom({ grace_days: null }, {})).toBeNull();
  expect(graceDaysFrom(undefined)).toBeNull();
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

  const withWindow = {
    ...err,
    response: {
      status: 403,
      data: {
        detail: {
          detail: 'Account scheduled for deletion',
          ...sample,
          grace_days: 3,
        },
      },
    },
  };
  expect(pendingDeletionFromError(withWindow)).toEqual({ ...sample, grace_days: 3 });

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
