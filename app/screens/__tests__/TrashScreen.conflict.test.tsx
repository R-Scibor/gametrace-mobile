jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('../../api/sessions', () => ({
  getTrashedSessions: jest.fn(),
  restoreSession: jest.fn(),
  hardDeleteSession: jest.fn(),
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TrashScreen from '../TrashScreen';
import { getTrashedSessions, restoreSession } from '../../api/sessions';
import type { ConflictResponse, ConflictingSession, TrashedSession } from '../../types/api';

const list = getTrashedSessions as jest.Mock;
const restore = restoreSession as jest.Mock;

const trashed: TrashedSession = {
  id: 10,
  game_id: 8,
  game: { id: 8, primary_name: 'Hades', cover_image_url: null },
  start_time: '2026-08-01T16:00:00.000Z',
  end_time: '2026-08-01T17:00:00.000Z',
  duration_seconds: 3600,
  status: 'COMPLETED',
  source: 'MANUAL',
  notes: null,
  created_at: '2026-08-01T17:00:00.000Z',
  purges_at: '2026-08-08T17:00:00.000Z',
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
  list.mockReset().mockResolvedValue([trashed]);
  restore.mockReset().mockRejectedValue({
    response: { status: 409, data: { detail: conflictResponse } },
  });
});

test('restore overlap 409 Edit navigates to the blocker', async () => {
  const { getByText } = await render(<TrashScreen />);
  await waitFor(() => expect(getByText('Hades')).toBeTruthy());
  await fireEvent.press(getByText('Hades'));
  await fireEvent.press(getByText('Przywróć sesję'));
  await waitFor(() => expect(getByText('Edytuj →')).toBeTruthy());
  await fireEvent.press(getByText('Edytuj →'));
  expect(mockNavigate).toHaveBeenCalledWith('EditSession', { sessionId: 99, status: 'COMPLETED' });
});
