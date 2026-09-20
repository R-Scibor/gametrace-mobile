jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('../../api/sessions', () => ({
  createSession: jest.fn(),
}));

jest.mock('../../components/GamePicker', () => {
  const { View } = require('react-native');
  return () => <View testID="game-picker" />;
});

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({
    params: {
      gameId: 1,
      date: '2026-08-02',
      startTime: '20:00',
      endTime: '22:00',
    },
  }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddSessionScreen from '../AddSessionScreen';
import { createSession } from '../../api/sessions';
import type { ConflictResponse, ConflictingSession } from '../../types/api';

const create = createSession as jest.Mock;

const conflictingSession: ConflictingSession = {
  id: 99,
  status: 'COMPLETED',
  game_id: 5,
  game: { primary_name: 'Wiedźmin 3', cover_image_url: null },
  start_time: '2026-08-02T18:00:00.000Z',
  end_time: '2026-08-02T20:00:00.000Z',
};

const conflictResponse: ConflictResponse = {
  detail: 'Session overlaps with an existing session',
  conflicting_session: conflictingSession,
};

beforeEach(() => {
  mockGoBack.mockReset();
  mockNavigate.mockReset();
  create.mockReset().mockRejectedValue({
    response: { status: 409, data: { detail: conflictResponse } },
  });
});

test('overlap 409 Edit navigates to the blocker', async () => {
  const { getByText } = await render(<AddSessionScreen />);
  await fireEvent.press(getByText('ZAPISZ SESJĘ'));
  await waitFor(() => expect(getByText('Edytuj →')).toBeTruthy());
  await fireEvent.press(getByText('Edytuj →'));
  expect(mockNavigate).toHaveBeenCalledWith('EditSession', { sessionId: 99, status: 'COMPLETED' });
});
