jest.mock('../../api/profile', () => ({ getProfile: jest.fn(), updateSettings: jest.fn() }));

let mockServerInvite = 'https://discord.gg/gametrace';
jest.mock('../../config', () => ({
  DISCORD_INVITE_URL: 'https://discord.com/oauth2/authorize?client_id=1',
  get DISCORD_SERVER_INVITE_URL() { return mockServerInvite; },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BotReminderHost from '../BotReminderHost';
import { getProfile, updateSettings } from '../../api/profile';
import { useServerJoinStore } from '../../store/serverJoinStore';
import { useAlertStore } from '../../store/alertStore';
import { reminderStorageKey, todayInZone } from '../../utils/botReminder';
import { setActiveLanguage } from '../../i18n';

const profile = (over: Record<string, unknown> = {}) => ({
  discord_id: '42',
  username: 'ada',
  timezone: 'Europe/Warsaw',
  notifications_enabled: true,
  is_admin: false,
  bot_can_see_user: false,
  bot_visibility_reminders_enabled: true,
  bot_visibility_reminder_snoozed_until: null,
  ...over,
});

const TITLE = 'Bot cię nie widzi';

beforeEach(async () => {
  (getProfile as jest.Mock).mockReset();
  (updateSettings as jest.Mock).mockReset();
  mockServerInvite = 'https://discord.gg/gametrace';
  useServerJoinStore.setState({ visible: false });
  useAlertStore.setState({ alert: null });
  await AsyncStorage.clear();
  await setActiveLanguage('pl');
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

test('shows when the bot cannot see the user', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  const { findByText, getByText } = await render(<BotReminderHost />);
  expect(await findByText(TITLE)).toBeTruthy();
  expect(getByText('Dołącz do serwera')).toBeTruthy();
  expect(getByText('Dodaj bota do serwera')).toBeTruthy();
});

test.each([
  ['bot sees the user', { bot_can_see_user: true }],
  ['visibility unknown', { bot_can_see_user: null }],
  ['older server without the field', { bot_can_see_user: undefined }],
  ['reminders disabled', { bot_visibility_reminders_enabled: false }],
  ['snoozed', { bot_visibility_reminder_snoozed_until: '2999-01-01T00:00:00+00:00' }],
])('stays hidden when %s', async (_name, over) => {
  (getProfile as jest.Mock).mockResolvedValue(profile(over));
  const { queryByText } = await render(<BotReminderHost />);
  await waitFor(() => expect(getProfile).toHaveBeenCalled());
  expect(queryByText(TITLE)).toBeNull();
});

test('stays hidden when already shown today', async () => {
  await AsyncStorage.setItem(reminderStorageKey('42'), todayInZone('Europe/Warsaw'));
  (getProfile as jest.Mock).mockResolvedValue(profile());
  const { queryByText } = await render(<BotReminderHost />);
  await waitFor(() => expect(getProfile).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
  expect(queryByText(TITLE)).toBeNull();
});

test('closing remembers today', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  const { findByText, getByText, queryByText } = await render(<BotReminderHost />);
  await findByText(TITLE);
  await fireEvent.press(getByText('Zamknij'));
  expect(queryByText(TITLE)).toBeNull();
  await waitFor(async () =>
    expect(await AsyncStorage.getItem(reminderStorageKey('42'))).toBe(todayInZone('Europe/Warsaw')),
  );
});

test('join opens the server invite', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  const { findByText, getByText } = await render(<BotReminderHost />);
  await findByText(TITLE);
  await fireEvent.press(getByText('Dołącz do serwera'));
  expect(Linking.openURL).toHaveBeenCalledWith('https://discord.gg/gametrace');
});

test('join button is hidden without a server invite url', async () => {
  mockServerInvite = '';
  (getProfile as jest.Mock).mockResolvedValue(profile());
  const { findByText, queryByText } = await render(<BotReminderHost />);
  await findByText(TITLE);
  expect(queryByText('Dołącz do serwera')).toBeNull();
  expect(queryByText('Dodaj bota do serwera')).toBeTruthy();
});

test('snooze saves seven days ahead and closes', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  (updateSettings as jest.Mock).mockResolvedValue(undefined);
  const { findByText, getByText, queryByText } = await render(<BotReminderHost />);
  await findByText(TITLE);
  await fireEvent.press(getByText('Przypomnij za 7 dni'));
  await waitFor(() => expect(queryByText(TITLE)).toBeNull());
  const sent = (updateSettings as jest.Mock).mock.calls[0][0].bot_visibility_reminder_snoozed_until;
  const days = (Date.parse(sent) - Date.now()) / 86_400_000;
  expect(days).toBeGreaterThan(6.9);
  expect(days).toBeLessThan(7.1);
  expect(useAlertStore.getState().alert).toBeNull();
});

test('failed snooze shows an alert and still closes for today', async () => {
  (getProfile as jest.Mock).mockResolvedValue(profile());
  (updateSettings as jest.Mock).mockRejectedValue(new Error('net'));
  const { findByText, getByText, queryByText } = await render(<BotReminderHost />);
  await findByText(TITLE);
  await fireEvent.press(getByText('Przypomnij za 7 dni'));
  await waitFor(() => expect(queryByText(TITLE)).toBeNull());
  expect(useAlertStore.getState().alert).not.toBeNull();
});

test('waits while the post-login server join sheet is open', async () => {
  useServerJoinStore.setState({ visible: true });
  (getProfile as jest.Mock).mockResolvedValue(profile());
  const { queryByText } = await render(<BotReminderHost />);
  await waitFor(() => expect(getProfile).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
  expect(queryByText(TITLE)).toBeNull();
});
