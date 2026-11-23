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
import VoiceScreen, { transcribeErrorKey } from '../VoiceScreen';
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

function httpError(status: number, detail: unknown) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status, data: { detail } } });
}

test.each([
  [429, 'Voice quota exceeded', 'Wykorzystano limit nagrań. Spróbuj ponownie później.'],
  [422, 'Uploaded file is not a recognized audio format.', 'Nie udało się odczytać nagrania. Nagraj je jeszcze raz.'],
  [400, 'Uploaded file is empty.', 'Nie udało się odczytać nagrania. Nagraj je jeszcze raz.'],
  [502, 'Transcription failed.', 'Nie udało się przetworzyć nagrania. Spróbuj ponownie za chwilę.'],
  [500, 'Internal Server Error', 'Nie udało się wysłać nagrania.'],
])('a %i transcribe error shows translated copy, not the raw detail', async (status, detail, expected) => {
  transcribe.mockRejectedValue(httpError(status, detail));

  const utils = await render(<VoiceScreen />);
  await stopRecording(utils);

  await waitFor(() => expect(utils.getByText(expected)).toBeTruthy());
  expect(utils.queryByText(detail)).toBeNull();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('a network error without a response shows the send failure copy', async () => {
  transcribe.mockRejectedValue(new Error('Network Error'));

  const utils = await render(<VoiceScreen />);
  await stopRecording(utils);

  await waitFor(() => expect(utils.getByText('Nie udało się wysłać nagrania.')).toBeTruthy());
});

describe('transcribeErrorKey', () => {
  test('maps 429 to quotaExceeded', () => {
    expect(transcribeErrorKey(429)).toBe('alerts.quotaExceeded');
  });

  test('maps 400 and 422 to badRecording', () => {
    expect(transcribeErrorKey(400)).toBe('alerts.badRecording');
    expect(transcribeErrorKey(422)).toBe('alerts.badRecording');
  });

  test('maps 502 and 503 to processingFailed', () => {
    expect(transcribeErrorKey(502)).toBe('alerts.processingFailed');
    expect(transcribeErrorKey(503)).toBe('alerts.processingFailed');
  });

  test('maps other statuses or undefined to sendFailed', () => {
    expect(transcribeErrorKey(500)).toBe('alerts.sendFailed');
    expect(transcribeErrorKey(undefined)).toBe('alerts.sendFailed');
  });
});
