jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('../../api/sessions', () => ({
  getSession: jest.fn(),
  patchSession: jest.fn(),
  deleteSession: jest.fn(),
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockPush = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate, push: mockPush }),
  useRoute: () => ({ params: { sessionId: 1, status: 'COMPLETED' } }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditSessionScreen from '../EditSessionScreen';
import { getSession, patchSession } from '../../api/sessions';
import type { ConflictResponse, ConflictingSession, Session } from '../../types/api';

const get = getSession as jest.Mock;
const patch = patchSession as jest.Mock;

const editing: Session = {
  id: 1,
  game_id: 8,
  game: { id: 8, primary_name: 'Celeste', cover_image_url: null },
  start_time: '2026-08-02T16:00:00.000Z',
  end_time: '2026-08-02T17:00:00.000Z',
  duration_seconds: 3600,
  status: 'COMPLETED',
  source: 'MANUAL',
  notes: null,
  created_at: '2026-08-02T17:00:00.000Z',
};

const blocker: ConflictingSession = {
  id: 99,
  status: 'COMPLETED',
  game_id: 5,
  game: { primary_name: 'Wiedźmin 3', cover_image_url: null },
  start_time: '2026-08-02T18:00:00.000Z',
  end_time: '2026-08-02T20:00:00.000Z',
};

const conflictResponse: ConflictResponse = {
  detail: 'Session overlaps with an existing session',
  conflicting_session: blocker,
};

beforeEach(() => {
  mockGoBack.mockReset();
  mockNavigate.mockReset();
  mockPush.mockReset();
  get.mockReset().mockResolvedValue(editing);
  patch.mockReset().mockRejectedValue({
    response: { status: 409, data: { detail: conflictResponse } },
  });
});

test('overlap 409 Edit pushes a new EditSession and leaves the current form', async () => {
  const { getByText } = await render(<EditSessionScreen />);
  await waitFor(() => expect(getByText('Celeste')).toBeTruthy());

  await fireEvent.press(getByText('ZAPISZ ZMIANY'));
  await waitFor(() => expect(getByText('Edytuj →')).toBeTruthy());
  await fireEvent.press(getByText('Edytuj →'));

  expect(mockPush).toHaveBeenCalledWith('EditSession', { sessionId: 99, status: 'COMPLETED' });
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(getByText('Celeste')).toBeTruthy();
});
