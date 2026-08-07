jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    isAxiosError: jest.fn(() => false),
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const mockCancelDeletion = jest.fn();
const mockLogoutApi = jest.fn();
jest.mock('../../api/profile', () => ({
  cancelDeletion: (...args: unknown[]) => mockCancelDeletion(...args),
  logout: (...args: unknown[]) => mockLogoutApi(...args),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PendingDeletionScreen from '../PendingDeletionScreen';
import { useAuthStore } from '../../store/authStore';

const samplePending = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

function seedPending() {
  useAuthStore.setState({
    token: 't',
    user: { discordId: '1', username: 'testuser' },
    isAdmin: false,
    isAuthenticated: true,
    pendingDeletion: samplePending,
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-08-07T12:00:00Z') });
  mockCancelDeletion.mockReset();
  mockLogoutApi.mockReset();
  useAuthStore.setState({
    token: null,
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    pendingDeletion: null,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test('renders purge date, days left, and caveats (PL)', async () => {
  seedPending();

  const { getByText } = await render(<PendingDeletionScreen />);

  expect(getByText('Konto oczekuje na usunięcie')).toBeTruthy();
  expect(getByText('Konto zostanie usunięte')).toBeTruthy();
  expect(getByText(/14 sierpnia 2026 lub wkrótce po tej dacie/)).toBeTruthy();
  expect(getByText('7 dni')).toBeTruthy();
  expect(
    getByText('Anulowanie przywraca dostęp natychmiast.'),
  ).toBeTruthy();
  expect(
    getByText(
      'Sesje zakończone błędem przy zlecaniu usunięcia oraz wyrejestrowane urządzenia nie wracają.',
    ),
  ).toBeTruthy();
  expect(
    getByText('Po trwałym usunięciu danych nie da się odzyskać.'),
  ).toBeTruthy();
  expect(getByText('Anuluj usunięcie')).toBeTruthy();
  expect(getByText('Wyloguj')).toBeTruthy();
});

test('cancel success clears pending and shows success message', async () => {
  seedPending();
  mockCancelDeletion.mockResolvedValue('cancelled');

  const { getByText, findByText } = await render(<PendingDeletionScreen />);
  await fireEvent.press(getByText('Anuluj usunięcie'));

  await waitFor(() =>
    expect(useAuthStore.getState().pendingDeletion).toBeNull(),
  );
  expect(await findByText('Usuwanie konta zostało anulowane.')).toBeTruthy();
  expect(mockCancelDeletion).toHaveBeenCalledTimes(1);
});

test('cancel not-scheduled clears pending and shows info message', async () => {
  seedPending();
  mockCancelDeletion.mockResolvedValue('not-scheduled');

  const { getByText, findByText } = await render(<PendingDeletionScreen />);
  await fireEvent.press(getByText('Anuluj usunięcie'));

  await waitFor(() =>
    expect(useAuthStore.getState().pendingDeletion).toBeNull(),
  );
  expect(
    await findByText('To konto nie jest zaplanowane do usunięcia.'),
  ).toBeTruthy();
});

test('cancel error keeps pending and shows cancelFailed', async () => {
  seedPending();
  mockCancelDeletion.mockRejectedValue(new Error('network'));

  const { getByText, findByText } = await render(<PendingDeletionScreen />);
  await fireEvent.press(getByText('Anuluj usunięcie'));

  expect(
    await findByText('Nie udało się anulować usunięcia. Spróbuj ponownie.'),
  ).toBeTruthy();
  expect(useAuthStore.getState().pendingDeletion).toEqual(samplePending);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('sign out calls logout API then local logout', async () => {
  seedPending();
  mockLogoutApi.mockResolvedValue(undefined);

  const { getByText } = await render(<PendingDeletionScreen />);
  await fireEvent.press(getByText('Wyloguj'));

  await waitFor(() => expect(mockLogoutApi).toHaveBeenCalledTimes(1));
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useAuthStore.getState().token).toBeNull();
  expect(useAuthStore.getState().pendingDeletion).toBeNull();
});

test('sign out still logs out locally when API fails', async () => {
  seedPending();
  mockLogoutApi.mockRejectedValue(new Error('network'));

  const { getByText } = await render(<PendingDeletionScreen />);
  await fireEvent.press(getByText('Wyloguj'));

  await waitFor(() => expect(mockLogoutApi).toHaveBeenCalledTimes(1));
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test('renders null when no pending and no message', async () => {
  const { toJSON } = await render(<PendingDeletionScreen />);
  expect(toJSON()).toBeNull();
});
