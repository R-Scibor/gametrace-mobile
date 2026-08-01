import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLanguage } from '../useLanguage';
import * as profileApi from '../../api/profile';
import i18n, { setActiveLanguage } from '../../i18n';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    }),
  },
}));
jest.mock('../../api/profile');

beforeEach(async () => {
  await setActiveLanguage('pl');
  jest.mocked(profileApi.updateSettings).mockReset();
});

test('optimistically switches language and persists via API', async () => {
  jest.mocked(profileApi.updateSettings).mockResolvedValue(undefined);
  const { result } = await renderHook(() => useLanguage());
  await act(async () => {
    await result.current.select('en');
  });
  expect(i18n.language).toBe('en');
  expect(profileApi.updateSettings).toHaveBeenCalledWith({ language: 'en' });
});

test('reverts when backend rejects', async () => {
  jest.mocked(profileApi.updateSettings).mockRejectedValue(new Error('fail'));
  const { result } = await renderHook(() => useLanguage());
  await act(async () => {
    await result.current.select('en');
  });
  await waitFor(() => expect(i18n.language).toBe('pl'));
  expect(result.current.error).toBe(true);
});
