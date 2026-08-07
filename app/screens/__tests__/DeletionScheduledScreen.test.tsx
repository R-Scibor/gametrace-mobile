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

import { render, fireEvent } from '@testing-library/react-native';
import DeletionScheduledScreen from '../DeletionScheduledScreen';
import { useDeletionHandoffStore } from '../../store/deletionHandoffStore';

const sampleStatus = {
  deletion_requested_at: '2026-08-04T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-08-07T12:00:00Z') });
  useDeletionHandoffStore.getState().clear();
});

afterEach(() => {
  jest.useRealTimers();
});

test('renders purge date and days left from handoff (PL)', async () => {
  useDeletionHandoffStore.getState().save(sampleStatus);

  const { getByText, queryByText } = await render(<DeletionScheduledScreen />);

  expect(getByText('Konto zaplanowane do usunięcia')).toBeTruthy();
  expect(getByText('Twoje konto zostanie usunięte')).toBeTruthy();
  expect(getByText(/14 sierpnia 2026 lub wkrótce po tej dacie/)).toBeTruthy();
  expect(getByText('7 dni')).toBeTruthy();
  expect(getByText('Usuwanie uruchamiane jest raz na dobę, więc może nastąpić do doby później.')).toBeTruthy();
  expect(queryByText('Anuluj usunięcie')).toBeNull();
});

test('login CTA clears handoff', async () => {
  useDeletionHandoffStore.getState().save(sampleStatus);

  const { getByText } = await render(<DeletionScheduledScreen />);
  await fireEvent.press(getByText('Zaloguj się, aby anulować'));

  expect(useDeletionHandoffStore.getState().status).toBeNull();
});

test('OK CTA clears handoff', async () => {
  useDeletionHandoffStore.getState().save(sampleStatus);

  const { getByText } = await render(<DeletionScheduledScreen />);
  await fireEvent.press(getByText('OK'));

  expect(useDeletionHandoffStore.getState().status).toBeNull();
});

test('renders null when handoff is empty', async () => {
  const { toJSON } = await render(<DeletionScheduledScreen />);
  expect(toJSON()).toBeNull();
});
