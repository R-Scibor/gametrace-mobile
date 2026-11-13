jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('../../api/sessions', () => ({
  createSession: jest.fn(),
}));

jest.mock('../../components/GamePicker', () => {
  const { View } = require('react-native');
  return () => <View testID="game-picker" />;
});

const mockGoBack = jest.fn();
const routeParams: {
  gameId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
} = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: routeParams }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddSessionScreen from '../AddSessionScreen';
import { createSession } from '../../api/sessions';

const create = createSession as jest.Mock;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parts(d: Date) {
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function prefill(start: Date, end: Date) {
  const s = parts(start);
  const e = parts(end);
  routeParams.gameId = 1;
  routeParams.date = s.date;
  routeParams.startTime = s.time;
  routeParams.endTime = e.date === s.date ? e.time : s.time;
}

beforeEach(() => {
  mockGoBack.mockReset();
  create.mockReset().mockResolvedValue({ id: 1 });
});

test('a start older than 30 days shows the lookback message and does not post', async () => {
  const start = new Date();
  start.setDate(start.getDate() - 31);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  prefill(start, end);

  const { findByText } = await render(<AddSessionScreen />);
  expect(await findByText('Rozpoczęcie jest starsze niż 30 dni.')).toBeTruthy();
  await fireEvent.press(await findByText('ZAPISZ SESJĘ'));
  expect(create).not.toHaveBeenCalled();
});

test('a start beyond the 5 minute grace shows the future-start message', async () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setHours(13, 0, 0, 0);
  prefill(start, end);

  const { findByText } = await render(<AddSessionScreen />);
  expect(await findByText('Rozpoczęcie nie może być dalej niż 5 minut w przyszłości.')).toBeTruthy();
  expect(create).not.toHaveBeenCalled();
});

test('a time inside the grace posts Zulu timestamps', async () => {
  const end = new Date(Date.now() + 4 * 60 * 1000);
  let start = new Date(end.getTime() - 60 * 60 * 1000);
  if (start.toDateString() !== end.toDateString()) {
    start = new Date(end);
    start.setHours(0, 0, 0, 0);
  }
  prefill(start, end);

  const { findByText, queryAllByText } = await render(<AddSessionScreen />);
  await waitFor(() => expect(queryAllByText('Wybierz...')).toHaveLength(0));
  await fireEvent.press(await findByText('ZAPISZ SESJĘ'));
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
  const payload = create.mock.calls[0][0];
  expect(payload.start_time).toMatch(/Z$/);
  expect(payload.end_time).toMatch(/Z$/);
  expect(payload.start_time).not.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
});

test('a bounds 422 from confirm shows the mapped copy', async () => {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12, 0, 0, 0);
  prefill(start, end);
  create.mockRejectedValue({
    response: { status: 422, data: { detail: 'session duration exceeds 48 hours' } },
  });

  const { findByText, queryByText, queryAllByText } = await render(<AddSessionScreen />);
  await waitFor(() => expect(queryAllByText('Wybierz...')).toHaveLength(0));
  await fireEvent.press(await findByText('ZAPISZ SESJĘ'));
  expect(await findByText('Sesja nie może trwać dłużej niż 48 godzin.')).toBeTruthy();
  expect(queryByText(/422:/)).toBeNull();
});
