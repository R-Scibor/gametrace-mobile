// Mock axios with minimal scaffolding for interceptor testing
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: (config: any) => ({
      interceptors: {
        request: {
          handlers: [] as any[],
          use: function(fn: any) {
            this.handlers.push({ fulfilled: fn });
          },
        },
        response: { use: jest.fn() },
      },
    }),
  },
}));

import client from '../client';
import { useServerStore } from '../../store/serverStore';

test('request interceptor injects serverUrl as baseURL', () => {
  useServerStore.setState({ serverUrl: 'https://example:8010/api/v1' });
  const handler = (client.interceptors.request as any).handlers.find(
    (h: any) => h && typeof h.fulfilled === 'function'
  );
  const cfg = handler.fulfilled({ headers: {} });
  expect(cfg.baseURL).toBe('https://example:8010/api/v1');
});
