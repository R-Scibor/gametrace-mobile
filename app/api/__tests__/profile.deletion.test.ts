jest.mock('../client', () => ({
  __esModule: true,
  default: { post: jest.fn(), delete: jest.fn() },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    isAxiosError: jest.fn(),
  },
}));

import client from '../client';
import { requestDeletion, cancelDeletion } from '../profile';
import axios from 'axios';

const mockPost = client.post as jest.Mock;
const mockDelete = client.delete as jest.Mock;
const isAxiosError = axios.isAxiosError as jest.Mock;

beforeEach(() => {
  mockPost.mockReset();
  mockDelete.mockReset();
  isAxiosError.mockReset();
});

test('requestDeletion posts /profile/me/deletion and returns body', async () => {
  const body = {
    deletion_requested_at: '2026-08-04T12:00:00Z',
    purge_at: '2026-08-14T12:00:00Z',
    days_left: 7,
  };
  mockPost.mockResolvedValue({ data: body });
  await expect(requestDeletion()).resolves.toEqual(body);
  expect(mockPost).toHaveBeenCalledWith('/profile/me/deletion');
});

test('cancelDeletion returns cancelled on 200', async () => {
  mockDelete.mockResolvedValue({ data: { detail: 'ok' } });
  await expect(cancelDeletion()).resolves.toBe('cancelled');
});

test('cancelDeletion returns not-scheduled on 404', async () => {
  const err = Object.assign(new Error('404'), {
    isAxiosError: true,
    response: { status: 404 },
  });
  isAxiosError.mockReturnValue(true);
  mockDelete.mockRejectedValue(err);
  await expect(cancelDeletion()).resolves.toBe('not-scheduled');
});
