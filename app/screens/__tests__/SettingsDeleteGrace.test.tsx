jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

const mockGetHealth = jest.fn();
jest.mock('../../api/health', () => ({
  getHealth: (...args: unknown[]) => mockGetHealth(...args),
}));

import { render } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { useAuthStore } from '../../store/authStore';
import { setActiveLanguage } from '../../i18n';

const health = (grace_days?: number) => ({
  status: 'ok',
  bot: { status: 'online' as const, uptime_seconds: 1, last_heartbeat_seconds_ago: 1 },
  ...(grace_days == null ? {} : { grace_days }),
});

beforeEach(async () => {
  mockGetHealth.mockReset();
  useAuthStore.getState().login('tok', { discordId: '42', username: 'ada' });
  await setActiveLanguage('pl');
});

test('delete subtext uses grace_days from /health', async () => {
  mockGetHealth.mockResolvedValue(health(14));
  const { findByText, queryByText } = await render(<SettingsScreen />);

  expect(await findByText(/po 14 dniach/)).toBeTruthy();
  expect(queryByText(/po 7 dniach/)).toBeNull();
});

test('delete subtext stays hidden when /health has no grace_days', async () => {
  mockGetHealth.mockResolvedValue(health());
  const { queryByText, findByText } = await render(<SettingsScreen />);

  expect(await findByText('Usuń konto')).toBeTruthy();
  expect(queryByText(/trwale usuwane po/)).toBeNull();
});
