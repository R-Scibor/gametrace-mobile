jest.mock('../client', () => ({ __esModule: true, default: { post: jest.fn() } }));

let mockDevLoginSecret = '';
jest.mock('../../config', () => ({
  get DEV_LOGIN_SECRET() {
    return mockDevLoginSecret;
  },
}));

import client from '../client';
import { login, linkLogin, discordLogin } from '../auth';

const mockPost = client.post as jest.Mock;

beforeEach(() => {
  mockPost.mockReset();
  mockDevLoginSecret = '';
});

test('login omits the dev-secret header when no secret is configured', async () => {
  mockPost.mockResolvedValue({ data: { token: 't' } });

  await login('ada', 'Europe/Warsaw');

  expect(client.post).toHaveBeenCalledWith(
    '/auth/login',
    { username: 'ada', timezone: 'Europe/Warsaw' },
    undefined,
  );
});

test('login sends the X-Dev-Login-Secret header when a secret is configured', async () => {
  mockDevLoginSecret = 's3cret';
  mockPost.mockResolvedValue({ data: { token: 't' } });

  await login('ada');

  expect(client.post).toHaveBeenCalledWith(
    '/auth/login',
    { username: 'ada', timezone: 'UTC' },
    { headers: { 'X-Dev-Login-Secret': 's3cret' } },
  );
});

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

test('discordLogin posts code, code_verifier and redirect_uri to /auth/discord', async () => {
  mockPost.mockResolvedValue({ data: { token: 't' } });

  await discordLogin('the-code', 'the-verifier', 'gametrace://oauth');

  expect(client.post).toHaveBeenCalledWith('/auth/discord', {
    code: 'the-code',
    code_verifier: 'the-verifier',
    redirect_uri: 'gametrace://oauth',
  });
});

test('discordLogin returns the response body', async () => {
  const body = { token: 't', discord_id: '1', username: 'u', timezone: 'UTC', is_admin: false, needs_server_join: true };
  mockPost.mockResolvedValue({ data: body });

  await expect(discordLogin('c', 'v', 'r')).resolves.toEqual(body);
});
