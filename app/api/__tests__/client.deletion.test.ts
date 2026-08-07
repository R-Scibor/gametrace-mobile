type ResponseHandler = {
  fulfilled: (response: unknown) => unknown;
  rejected: (error: unknown) => Promise<never>;
};

const responseHandlers: ResponseHandler[] = [];

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: (fulfilled: ResponseHandler['fulfilled'], rejected: ResponseHandler['rejected']) => {
            responseHandlers.push({ fulfilled, rejected });
          },
        },
      },
    }),
    isAxiosError: jest.fn(),
  },
}));

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import axios from 'axios';
import '../client';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import {
  suspendAuthTeardown,
  resumeAuthTeardown,
} from '../../utils/authTeardown';

const isAxiosError = axios.isAxiosError as jest.Mock;

const sample = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

function getErrorHandler() {
  const handler = responseHandlers[responseHandlers.length - 1];
  if (!handler?.rejected) {
    throw new Error('response error handler not registered');
  }
  return handler.rejected;
}

beforeEach(() => {
  resumeAuthTeardown();
  useAuthStore.setState({
    token: 'tok',
    user: { discordId: '1', username: 'ada' },
    isAdmin: false,
    isAuthenticated: true,
    pendingDeletion: null,
  });
  useAlertStore.setState({ alert: null });
  isAxiosError.mockReset();
});

afterEach(() => {
  resumeAuthTeardown();
});

test('suspended 401 skips logout and session-expired alert', async () => {
  suspendAuthTeardown();
  const logout = jest.spyOn(useAuthStore.getState(), 'logout').mockClear();
  const showAlert = jest.spyOn(useAlertStore.getState(), 'showAlert').mockClear();
  const reject = getErrorHandler();
  const err = { response: { status: 401 } };

  await expect(reject(err)).rejects.toBe(err);

  expect(logout).not.toHaveBeenCalled();
  expect(showAlert).not.toHaveBeenCalled();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('unsuspended 401 logs out and shows session-expired alert when authenticated', async () => {
  const logout = jest.spyOn(useAuthStore.getState(), 'logout').mockClear();
  const showAlert = jest.spyOn(useAlertStore.getState(), 'showAlert').mockClear();
  const reject = getErrorHandler();
  const err = { response: { status: 401 } };

  await expect(reject(err)).rejects.toBe(err);

  expect(logout).toHaveBeenCalled();
  expect(showAlert).toHaveBeenCalledWith(
    'common:session.expiredTitle',
    'common:session.expiredBody',
  );
});

test('nested 403 sets pendingDeletion from error body', async () => {
  isAxiosError.mockReturnValue(true);
  const logout = jest.spyOn(useAuthStore.getState(), 'logout').mockClear();
  const reject = getErrorHandler();
  const err = {
    isAxiosError: true,
    response: {
      status: 403,
      data: {
        detail: {
          detail: 'Account scheduled for deletion',
          ...sample,
        },
      },
    },
    toJSON: () => ({}),
  };

  await expect(reject(err)).rejects.toBe(err);

  expect(useAuthStore.getState().pendingDeletion).toEqual(sample);
  expect(logout).not.toHaveBeenCalled();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
