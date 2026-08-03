jest.mock('../../api/games', () => ({
  getAllGamesForPicker: jest.fn(),
  suggestGames: jest.fn(),
  matchGames: jest.fn(),
  createGame: jest.fn(),
}));

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import GamePicker from '../GamePicker';
import { getAllGamesForPicker, suggestGames, matchGames, createGame } from '../../api/games';
import { Game } from '../../types/api';

const getAll = getAllGamesForPicker as jest.Mock;
const suggest = suggestGames as jest.Mock;
const match = matchGames as jest.Mock;
const create = createGame as jest.Mock;

function makeGame(id: number, name: string): Game {
  return {
    id,
    primary_name: name,
    cover_image_url: null,
    cover_source: 'EXTERNAL',
    enrichment_status: 'ENRICHED',
    is_ignored: false,
    is_accepted: true,
    total_seconds: 0,
    last_played: null,
  };
}

const OWNED = [makeGame(1, 'Hades'), makeGame(2, 'Elden Ring')];

async function renderPicker(props: Partial<React.ComponentProps<typeof GamePicker>> = {}) {
  const onChange = props.onChange ?? jest.fn();
  const utils = await render(
    <GamePicker value={null} onChange={onChange} {...props} />,
  );
  await waitFor(() => utils.getByPlaceholderText('Szukaj gry...'));
  return { ...utils, onChange };
}

/** Types into the search box and lets the debounce fire. */
async function type(utils: { getByPlaceholderText: (s: string) => unknown }, q: string) {
  await fireEvent.changeText(utils.getByPlaceholderText('Szukaj gry...') as never, q);
  await act(async () => { jest.advanceTimersByTime(300); });
}

beforeEach(() => {
  jest.useFakeTimers();
  getAll.mockReset().mockResolvedValue(OWNED);
  suggest.mockReset().mockResolvedValue({ total: 0, items: [] });
  match.mockReset();
  create.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

test('blank query shows the library group and no search-online action', async () => {
  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');

  expect(utils.getByText('Twoja biblioteka')).toBeTruthy();
  expect(utils.getByText('Hades')).toBeTruthy();
  expect(utils.queryByText('Szukaj online')).toBeNull();
  expect(utils.queryByText('Z katalogu')).toBeNull();
});

test('picking a library game calls onChange and shows the chip', async () => {
  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await fireEvent.press(utils.getByText('Hades'));

  expect(utils.onChange).toHaveBeenCalledWith(1);
  expect(utils.getByText('zmień')).toBeTruthy();
});

test('noResults does not flash while a suggest request is in flight', async () => {
  let resolveSuggest: (v: unknown) => void = () => {};
  suggest.mockImplementation(() => new Promise((r) => { resolveSuggest = r; }));

  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await type(utils, 'zzzz');

  expect(utils.queryByText('Brak wyników')).toBeNull();

  await act(async () => { resolveSuggest({ total: 0, items: [] }); });
  await waitFor(() => expect(utils.getByText('Brak wyników')).toBeTruthy());
});

test('search online renders IGDB candidates with their year', async () => {
  match.mockResolvedValue([{ igdb_id: 5, name: 'Hades II', year: 2024, cover_url: null, score: 0.9 }]);

  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await type(utils, 'hades ii');
  await fireEvent.press(utils.getByText('Szukaj online'));

  await waitFor(() => expect(utils.getByText('Hades II')).toBeTruthy());
  expect(utils.getByText('2024')).toBeTruthy();
});

test('the unrecognized action names the trimmed query and creates a stub', async () => {
  match.mockResolvedValue([]);
  create.mockResolvedValue({ id: 43, primary_name: 'Tiny Indie', cover_image_url: null });

  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await type(utils, 'Tiny Indie');
  await fireEvent.press(utils.getByText('Szukaj online'));

  await waitFor(() => expect(utils.getByText('Dodaj „Tiny Indie” mimo to')).toBeTruthy());
  await fireEvent.press(utils.getByText('Dodaj „Tiny Indie” mimo to'));

  await waitFor(() => expect(utils.onChange).toHaveBeenCalledWith(43));
  expect(create).toHaveBeenCalledWith({ name: 'Tiny Indie', unrecognized: true });
});

test('a match failure shows the error and a retry that re-runs the search', async () => {
  match.mockRejectedValueOnce(new Error('503'))
       .mockResolvedValueOnce([{ igdb_id: 5, name: 'Hades', year: null, cover_url: null, score: 0.9 }]);

  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await type(utils, 'hades');
  await fireEvent.press(utils.getByText('Szukaj online'));

  await waitFor(() => expect(utils.getByText('Nie udało się połączyć z bazą gier.')).toBeTruthy());
  await fireEvent.press(utils.getByText('Spróbuj ponownie'));

  await waitFor(() => expect(utils.getByText('Hades')).toBeTruthy());
});

test('a create failure keeps the dropdown open with the candidates intact', async () => {
  match.mockResolvedValue([{ igdb_id: 5, name: 'Hades', year: null, cover_url: null, score: 0.9 }]);
  create.mockRejectedValue(new Error('boom'));

  const utils = await renderPicker();
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await type(utils, 'hades');
  await fireEvent.press(utils.getByText('Szukaj online'));
  await waitFor(() => expect(utils.getByText('Hades')).toBeTruthy());

  await fireEvent.press(utils.getByText('Hades'));

  await waitFor(() => expect(utils.getByText('Nie udało się dodać gry.')).toBeTruthy());
  expect(utils.getByText('Hades')).toBeTruthy();
  expect(utils.onChange).not.toHaveBeenCalled();
});

test('initialQuery seeds the search box and opens the dropdown', async () => {
  suggest.mockResolvedValue({ total: 0, items: [] });

  const utils = await renderPicker({ initialQuery: 'Wiedzmin' });

  expect(utils.getByPlaceholderText('Szukaj gry...').props.value).toBe('Wiedzmin');
  await waitFor(() => expect(utils.getByText('Szukaj online')).toBeTruthy());
});

test('a failed library load shows the banner and still allows escalation', async () => {
  getAll.mockRejectedValue(new Error('net'));
  match.mockResolvedValue([]);

  const utils = await renderPicker();

  expect(utils.getByText('Nie udało się pobrać listy gier. Sprawdź połączenie.')).toBeTruthy();
  // The ladder still escalates without the owned list.
  await fireEvent(utils.getByPlaceholderText('Szukaj gry...'), 'focus');
  await type(utils, 'hades');
  expect(utils.getByText('Szukaj online')).toBeTruthy();
});
