jest.mock('../client', () => ({ __esModule: true, default: { post: jest.fn() } }));

import client from '../client';
import { linkLogin } from '../auth';

const mockPost = client.post as jest.Mock;

beforeEach(() => mockPost.mockReset());

test('linkLogin posts the space-stripped code and timezone to /auth/link', async () => {
  mockPost.mockResolvedValue({ data: { token: 't' } });

  await linkLogin('231 996', 'Europe/Warsaw');

  expect(client.post).toHaveBeenCalledWith('/auth/link', {
    code: '231996',
    timezone: 'Europe/Warsaw',
  });
});

test('linkLogin defaults timezone to UTC when omitted', async () => {
  mockPost.mockResolvedValue({ data: {} });

  await linkLogin('231996');

  expect(client.post).toHaveBeenCalledWith('/auth/link', { code: '231996', timezone: 'UTC' });
});

test('linkLogin returns the response body', async () => {
  const body = { token: 't', discord_id: '1', username: 'u', timezone: 'UTC', is_admin: false };
  mockPost.mockResolvedValue({ data: body });

  await expect(linkLogin('231996', 'UTC')).resolves.toEqual(body);
});
