jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('../../api/sessions', () => ({
  getSession: jest.fn(),
  patchSession: jest.fn(),
  deleteSession: jest.fn(),
}));

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn(), push: jest.fn() }),
  useRoute: () => ({ params: { sessionId: 1, status: 'ERROR' } }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditSessionScreen from '../EditSessionScreen';
import { getSession, patchSession } from '../../api/sessions';
import type { Session } from '../../types/api';
import { SESSION_MAX_DURATION_MS, SESSION_FUTURE_GRACE_MS } from '../../utils/sessionBounds';

const get = getSession as jest.Mock;
const patch = patchSession as jest.Mock;

function session(start: Date, end: Date | null): Session {
  return {
    id: 1,
    game_id: 8,
    game: { id: 8, primary_name: 'Celeste', cover_image_url: null },
    start_time: start.toISOString(),
    end_time: end ? end.toISOString() : null,
    duration_seconds: end ? Math.round((end.getTime() - start.getTime()) / 1000) : null,
    status: 'ERROR',
    source: 'MANUAL',
    notes: null,
    created_at: start.toISOString(),
  };
}

beforeEach(() => {
  mockGoBack.mockReset();
  get.mockReset();
  patch.mockReset().mockResolvedValue({ id: 1 });
});

test('a 49h edit shows the duration message and does not patch', async () => {
  const end = new Date();
  const start = new Date(end.getTime() - SESSION_MAX_DURATION_MS - 60 * 60_000);
  get.mockResolvedValue(session(start, end));

  const { findByText } = await render(<EditSessionScreen />);
  expect(await findByText('Sesja nie może trwać dłużej niż 48 godzin.')).toBeTruthy();
  await fireEvent.press(await findByText('ZAPISZ ZMIANY'));
  expect(patch).not.toHaveBeenCalled();
});

test('an ERROR older than 30 days still saves when the duration is under 48h', async () => {
  const start = new Date(Date.now() - 40 * 24 * 60 * 60_000);
  const end = new Date(start.getTime() + 2 * 60 * 60_000);
  get.mockResolvedValue(session(start, end));

  const { findByText } = await render(<EditSessionScreen />);
  await findByText('Celeste');
  await fireEvent.press(await findByText('ZAPISZ ZMIANY'));
  await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
  expect(patch.mock.calls[0][1].end_time).toMatch(/Z$/);
});

test('an end beyond the 5 minute grace is blocked', async () => {
  const start = new Date(Date.now() - 60 * 60_000);
  get.mockResolvedValue(session(start, new Date(Date.now() + SESSION_FUTURE_GRACE_MS + 60_000)));

  const blocked = await render(<EditSessionScreen />);
  expect(await blocked.findByText('Zakończenie nie może być dalej niż 5 minut w przyszłości.')).toBeTruthy();
  await fireEvent.press(await blocked.findByText('ZAPISZ ZMIANY'));
  expect(patch).not.toHaveBeenCalled();
});

test('an end inside the 5 minute grace still saves', async () => {
  const start = new Date(Date.now() - 60 * 60_000);
  get.mockResolvedValue(session(start, new Date(Date.now() + SESSION_FUTURE_GRACE_MS - 60_000)));
  const allowed = await render(<EditSessionScreen />);
  await allowed.findByText('Celeste');
  await fireEvent.press(await allowed.findByText('ZAPISZ ZMIANY'));
  await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
});

test('an ERROR with no end and a start older than 48h offers discard instead of now', async () => {
  const start = new Date(Date.now() - SESSION_MAX_DURATION_MS - 60 * 60_000);
  get.mockResolvedValue(session(start, null));

  const { findByText } = await render(<EditSessionScreen />);
  await findByText('Celeste');
  expect(await findByText(/nie da się jej zamknąć/)).toBeTruthy();
  expect(await findByText('ODRZUĆ SESJĘ')).toBeTruthy();
  await fireEvent.press(await findByText('ZAPISZ ZMIANY'));
  expect(patch).not.toHaveBeenCalled();
});
