import { renderHook, waitFor } from '@testing-library/react-native';
import { useLanguageSync } from '../useLanguageSync';
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
  jest.mocked(profileApi.getProfile).mockReset();
});

test('adopts profile language when it differs from active language', async () => {
  jest.mocked(profileApi.getProfile).mockResolvedValue({
    discord_id: '1',
    username: 'u',
    timezone: 'UTC',
    language: 'en',
    notifications_enabled: true,
    is_admin: false,
  });

  renderHook(() => useLanguageSync());

  await waitFor(() => expect(i18n.language).toBe('en'));
  expect(profileApi.getProfile).toHaveBeenCalled();
});

test('keeps cache when profile has no valid language', async () => {
  jest.mocked(profileApi.getProfile).mockResolvedValue({
    discord_id: '1',
    username: 'u',
    timezone: 'UTC',
    language: null,
    notifications_enabled: true,
    is_admin: false,
  });

  renderHook(() => useLanguageSync());

  await waitFor(() => expect(profileApi.getProfile).toHaveBeenCalled());
  expect(i18n.language).toBe('pl');
});

test('keeps cache when getProfile fails', async () => {
  jest.mocked(profileApi.getProfile).mockRejectedValue(new Error('offline'));

  renderHook(() => useLanguageSync());

  await waitFor(() => expect(profileApi.getProfile).toHaveBeenCalled());
  expect(i18n.language).toBe('pl');
});
