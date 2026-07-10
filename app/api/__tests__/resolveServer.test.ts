import axios from 'axios';
import { resolveServer } from '../resolveServer';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedGet = axios.get as jest.Mock;

const ok = { status: 200, data: { status: 'ok' } };
const fail = () => Promise.reject(new Error('ECONNREFUSED'));

beforeEach(() => {
  mockedGet.mockReset();
});

test('empty input is invalid', async () => {
  expect(await resolveServer('   ')).toEqual({ status: 'invalid' });
});

test('https reachable resolves ok with /api/v1 base', async () => {
  mockedGet.mockResolvedValueOnce(ok); // https
  const result = await resolveServer('host:8010');
  expect(result).toEqual({ status: 'ok', baseUrl: 'https://host:8010/api/v1' });
  expect(mockedGet).toHaveBeenCalledWith('https://host:8010/api/v1/health', { timeout: 3000 });
});

test('http-only fallback resolves insecure', async () => {
  mockedGet.mockImplementationOnce(fail);          // https fails
  mockedGet.mockResolvedValueOnce(ok);             // http ok
  const result = await resolveServer('host:8010');
  expect(result).toEqual({ status: 'insecure', baseUrl: 'http://host:8010/api/v1' });
});

test('both schemes fail -> unreachable', async () => {
  mockedGet.mockImplementation(fail);
  expect(await resolveServer('host:8010')).toEqual({ status: 'unreachable' });
});

test('explicit http is honored as ok (no insecure prompt)', async () => {
  mockedGet.mockResolvedValueOnce(ok);
  const result = await resolveServer('http://host:8010');
  expect(result).toEqual({ status: 'ok', baseUrl: 'http://host:8010/api/v1' });
  expect(mockedGet).toHaveBeenCalledTimes(1);
  expect(mockedGet).toHaveBeenCalledWith('http://host:8010/api/v1/health', { timeout: 3000 });
});

test('2xx without status ok is treated as unreachable', async () => {
  mockedGet.mockResolvedValue({ status: 200, data: { status: 'degraded' } });
  expect(await resolveServer('host:8010')).toEqual({ status: 'unreachable' });
});
