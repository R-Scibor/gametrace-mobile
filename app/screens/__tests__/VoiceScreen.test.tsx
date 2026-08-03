const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));
jest.mock('../../api/voice', () => ({ transcribeAudio: jest.fn() }));
jest.mock('../../api/games', () => ({ resolveGame: jest.fn() }));
jest.mock('../../hooks/useVoiceRecord', () => ({
  useVoiceRecord: () => ({
    isRecording: true,
    start: jest.fn(),
    stop: jest.fn(() => Promise.resolve('file:///rec.m4a')),
  }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VoiceScreen from '../VoiceScreen';
import { transcribeAudio } from '../../api/voice';
import { resolveGame } from '../../api/games';

const transcribe = transcribeAudio as jest.Mock;
const resolve = resolveGame as jest.Mock;

const RESULT = {
  game: 'Wiedzmin 3',
  date: '2026-08-02',
  start_time: '20:00',
  end_time: '22:00',
  raw_transcript: 'grałem w wiedźmina',
};

beforeEach(() => {
  mockNavigate.mockReset();
  transcribe.mockReset().mockResolvedValue(RESULT);
  resolve.mockReset();
});

/** The hero button is the only press target that starts the pipeline. */
async function stopRecording(utils: { getByText: (s: string) => unknown }) {
  await fireEvent.press(utils.getByText('REC') as never);
}

test('a resolve hit navigates with gameId and no gameName', async () => {
  resolve.mockResolvedValue({ game_id: 7 });

  const utils = await render(<VoiceScreen />);
  await stopRecording(utils);

  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  const params = mockNavigate.mock.calls[0][1].params;
  expect(params.gameId).toBe(7);
  expect(params.gameName).toBeUndefined();
});

test('a resolve miss carries the transcribed title forward', async () => {
  resolve.mockResolvedValue(null);

  const utils = await render(<VoiceScreen />);
  await stopRecording(utils);

  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  const params = mockNavigate.mock.calls[0][1].params;
  expect(params.gameId).toBeUndefined();
  expect(params.gameName).toBe('Wiedzmin 3');
});

test('a resolve throw still navigates and still seeds the title', async () => {
  resolve.mockRejectedValue(new Error('net'));

  const utils = await render(<VoiceScreen />);
  await stopRecording(utils);

  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  const params = mockNavigate.mock.calls[0][1].params;
  expect(params.gameName).toBe('Wiedzmin 3');
});
