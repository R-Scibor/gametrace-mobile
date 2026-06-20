// Mock axios with http adapter before importing client
jest.mock('axios', () => {
  const http = require('http');
  const https = require('https');

  const MockAxios = jest.fn().mockImplementation(function(config) {
    this.defaults = { headers: {} };
    this.interceptors = {
      request: { handlers: [], use: function(onFulfilled, onRejected) {
        this.handlers.push({ fulfilled: onFulfilled, rejected: onRejected });
      }},
      response: { handlers: [], use: function(onFulfilled, onRejected) {
        this.handlers.push({ fulfilled: onFulfilled, rejected: onRejected });
      }},
    };
    Object.assign(this, config);
    return this;
  });

  MockAxios.create = function(config) {
    const instance = new MockAxios(config);
    return instance;
  };

  MockAxios.isAxiosError = jest.fn(() => false);

  return {
    __esModule: true,
    default: MockAxios,
  };
});

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
