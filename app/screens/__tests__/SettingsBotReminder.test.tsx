jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('../../api/health', () => ({ getHealth: jest.fn(() => new Promise(() => {})) }));
jest.mock('../../api/profile', () => ({
  getProfile: jest.fn(),
  updateSettings: jest.fn(),
  getTimezones: jest.fn(() => Promise.resolve([])),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { getProfile, updateSettings } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';
import { setActiveLanguage } from '../../i18n';

const LABEL = 'Przypomnienie o bocie';

const profile = (over: Record<string, unknown> = {}) => ({
  discord_id: '42',
  username: 'ada',
  timezone: 'Europe/Warsaw',
  notifications_enabled: true,
  is_admin: false,
  bot_visibility_reminders_enabled: true,
  ...over,
});

beforeEach(async () => {
  (getProfile as jest.Mock).mockReset();
  (updateSettings as jest.Mock).mockReset();
  useAuthStore.getState().login('tok', { discordId: '42', username: 'ada' });
  await setActiveLanguage('pl');
});

test('toggle reflects the profile and saves a change', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  (updateSettings as jest.Mock).mockResolvedValue(undefined);
  const { findByLabelText } = await render(<SettingsScreen />);
  const toggle = await findByLabelText(LABEL);
  expect(toggle.props.value).toBe(true);
  await fireEvent(toggle, 'valueChange', false);
  expect(updateSettings).toHaveBeenCalledWith({ bot_visibility_reminders_enabled: false });
  await waitFor(async () => expect((await findByLabelText(LABEL)).props.value).toBe(false));
});

test('failed save reverts the toggle and shows an error', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  (updateSettings as jest.Mock).mockRejectedValue(new Error('net'));
  const { findByLabelText, findByText } = await render(<SettingsScreen />);
  await fireEvent(await findByLabelText(LABEL), 'valueChange', false);
  expect(await findByText('Nie udało się zapisać przypomnienia. Spróbuj ponownie.')).toBeTruthy();
  expect((await findByLabelText(LABEL)).props.value).toBe(true);
});

test('row is hidden on a server without the setting', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile({ bot_visibility_reminders_enabled: undefined }));
  const { queryByText, findByText } = await render(<SettingsScreen />);
  await findByText('Strefa czasowa');
  await waitFor(() => expect(getProfile).toHaveBeenCalled());
  expect(queryByText(LABEL)).toBeNull();
});
