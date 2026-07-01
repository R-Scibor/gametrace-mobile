jest.mock('../client', () => ({ __esModule: true, default: { post: jest.fn() } }));

import client from '../client';
import { submitReport } from '../reports';

test('submitReport posts message + context to /reports', async () => {
  (client.post as jest.Mock).mockResolvedValue({ data: {} });
  const context = { screen: 'Dashboard', platform: 'ios', osVersion: '17', appVersion: '1.0.0' };

  await submitReport('  hello  ', context);

  expect(client.post).toHaveBeenCalledWith('/reports', { message: '  hello  ', context });
});
