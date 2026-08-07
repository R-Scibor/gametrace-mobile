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

const mockGoBack = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    addListener: mockAddListener,
    setOptions: jest.fn(),
  }),
}));

const mockRequestDeletion = jest.fn();
jest.mock('../../api/profile', () => ({
  requestDeletion: (...args: unknown[]) => mockRequestDeletion(...args),
}));

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import axios from 'axios';
import DeleteAccountScreen from '../DeleteAccountScreen';
import { useAuthStore } from '../../store/authStore';
import { useDeletionHandoffStore } from '../../store/deletionHandoffStore';
import {
  isAuthTeardownSuspended,
  resumeAuthTeardown,
} from '../../utils/authTeardown';

const sampleStatus = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

beforeEach(() => {
  mockGoBack.mockReset();
  mockAddListener.mockClear();
  mockRequestDeletion.mockReset();
  resumeAuthTeardown();
  useDeletionHandoffStore.getState().clear();
  useAuthStore.setState({
    token: 't',
    user: { discordId: '1', username: 'testuser' },
    isAdmin: false,
    isAuthenticated: true,
    pendingDeletion: null,
  });
});

test('submit stays disabled until typed username matches (case-insensitive)', async () => {
  mockRequestDeletion.mockResolvedValue(sampleStatus);
  const { getByText, getByLabelText } = await render(<DeleteAccountScreen />);

  await fireEvent.press(getByText('Usuń konto'));
  expect(mockRequestDeletion).not.toHaveBeenCalled();

  await fireEvent.changeText(getByLabelText(/Wpisz testuser/), 'testus');
  await fireEvent.press(getByText('Usuń konto'));
  expect(mockRequestDeletion).not.toHaveBeenCalled();

  await fireEvent.changeText(getByLabelText(/Wpisz testuser/), '  TestUser  ');
  await fireEvent.press(getByText('Usuń konto'));
  await waitFor(() => expect(mockRequestDeletion).toHaveBeenCalled());
});

test('success path saves handoff and logs out', async () => {
  mockRequestDeletion.mockResolvedValue(sampleStatus);
  const { getByText, getByLabelText } = await render(<DeleteAccountScreen />);

  await fireEvent.changeText(getByLabelText(/Wpisz testuser/), 'testuser');
  await fireEvent.press(getByText('Usuń konto'));

  await waitFor(() => {
    expect(useDeletionHandoffStore.getState().status).toEqual(sampleStatus);
  });
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(isAuthTeardownSuspended()).toBe(false);
});

test('error shows PL inline message and keeps session', async () => {
  mockRequestDeletion.mockRejectedValue(new Error('fail'));
  const { getByText, getByLabelText, findByText } = await render(<DeleteAccountScreen />);

  await fireEvent.changeText(getByLabelText(/Wpisz testuser/), 'testuser');
  await fireEvent.press(getByText('Usuń konto'));

  expect(
    await findByText('Nie udało się zlecić usunięcia konta. Spróbuj ponownie.'),
  ).toBeTruthy();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useDeletionHandoffStore.getState().status).toBeNull();
  expect(isAuthTeardownSuspended()).toBe(false);
});

test('unmount without handoff resumes teardown', async () => {
  let resolveRequest!: (v: typeof sampleStatus) => void;
  mockRequestDeletion.mockReturnValue(
    new Promise((resolve) => {
      resolveRequest = resolve;
    }),
  );

  const { getByText, getByLabelText, unmount } = await render(<DeleteAccountScreen />);
  await fireEvent.changeText(getByLabelText(/Wpisz testuser/), 'testuser');
  // Do not await press — handler stays pending until we resolve the mock.
  const pressPromise = fireEvent.press(getByText('Usuń konto'));

  await waitFor(() => expect(isAuthTeardownSuspended()).toBe(true));
  await act(async () => {
    unmount();
  });
  expect(isAuthTeardownSuspended()).toBe(false);

  resolveRequest(sampleStatus);
  await pressPromise;
});

test('401 error logs out after resume', async () => {
  const err = Object.assign(new Error('unauthorized'), {
    response: { status: 401 },
  });
  (axios.isAxiosError as jest.Mock).mockReturnValue(true);
  mockRequestDeletion.mockRejectedValue(err);

  const { getByText, getByLabelText, findByText } = await render(<DeleteAccountScreen />);
  await fireEvent.changeText(getByLabelText(/Wpisz testuser/), 'testuser');
  await fireEvent.press(getByText('Usuń konto'));

  expect(
    await findByText('Nie udało się zlecić usunięcia konta. Spróbuj ponownie.'),
  ).toBeTruthy();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(isAuthTeardownSuspended()).toBe(false);

  (axios.isAxiosError as jest.Mock).mockReturnValue(false);
});
