jest.mock('../../api/games', () => ({
  getAllGamesForPicker: jest.fn(),
  suggestGames: jest.fn(),
  matchGames: jest.fn(),
  createGame: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGameLadder } from '../useGameLadder';
import { getAllGamesForPicker, suggestGames, matchGames, createGame } from '../../api/games';
import { Game, GameSuggestItem } from '../../types/api';

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

function makeSuggestion(game_id: number, primary_name: string): GameSuggestItem {
  return { game_id, primary_name, cover_image_url: null, enrichment_status: 'ENRICHED', score: 0.9 };
}

const OWNED = [makeGame(1, 'Hades'), makeGame(2, 'Elden Ring')];

/** Renders the hook with the library already loaded. */
async function renderLadder(onResolved = jest.fn()) {
  const utils = await renderHook(() => useGameLadder(onResolved));
  await waitFor(() => expect(utils.result.current.isPickerLoading).toBe(false));
  return { ...utils, onResolved };
}

/** Types a query and lets the 250ms debounce fire. */
async function type(result: { current: ReturnType<typeof useGameLadder> }, q: string) {
  await act(async () => { result.current.setQuery(q); });
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

test('blank query lists the whole library and issues no suggest request', async () => {
  const { result } = await renderLadder();

  expect(result.current.libraryMatches).toHaveLength(2);
  expect(result.current.catalogMatches).toEqual([]);
  expect(suggest).not.toHaveBeenCalled();
});

test('local matches are capped at MAX_LOCAL_RESULTS', async () => {
  getAll.mockResolvedValue(Array.from({ length: 80 }, (_, i) => makeGame(i + 1, `Game ${i + 1}`)));

  const { result } = await renderLadder();

  expect(result.current.libraryMatches).toHaveLength(50);
});

test('an owned game found only by fuzzy suggest is promoted into the library group', async () => {
  // "wiedzmin" does not substring-match "The Witcher", but suggest resolves the alias.
  getAll.mockResolvedValue([makeGame(7, 'The Witcher')]);
  suggest.mockResolvedValue({ total: 1, items: [makeSuggestion(7, 'The Witcher')] });

  const { result } = await renderLadder();
  await type(result, 'wiedzmin');

  await waitFor(() => expect(result.current.libraryMatches).toHaveLength(1));
  expect(result.current.libraryMatches[0].id).toBe(7);
  expect(result.current.catalogMatches).toEqual([]); // never in both groups
});

test('suggest hits the user does not own land in the catalog group', async () => {
  suggest.mockResolvedValue({ total: 1, items: [makeSuggestion(99, 'Hades II')] });

  const { result } = await renderLadder();
  await type(result, 'hades');

  await waitFor(() => expect(result.current.catalogMatches).toHaveLength(1));
  expect(result.current.catalogMatches[0].game_id).toBe(99);
});

test('a stale suggest response for an abandoned query is discarded', async () => {
  let resolveSlow: (v: unknown) => void = () => {};
  suggest
    .mockImplementationOnce(() => new Promise((r) => { resolveSlow = r; }))
    .mockResolvedValueOnce({ total: 1, items: [makeSuggestion(50, 'FRESH') ] });

  const { result } = await renderLadder();
  await type(result, 'had');      // slow, still in flight
  await type(result, 'hades');    // fast, resolves first

  await waitFor(() => expect(result.current.catalogMatches).toHaveLength(1));

  await act(async () => { resolveSlow({ total: 1, items: [makeSuggestion(60, 'STALE')] }); });

  expect(result.current.catalogMatches).toHaveLength(1);
  expect(result.current.catalogMatches[0].primary_name).toBe('FRESH');
});

test('searchOnline moves to online mode and keeps an empty list as a success', async () => {
  match.mockResolvedValue([]);

  const { result } = await renderLadder();
  await type(result, 'tiny indie');
  await act(async () => { result.current.searchOnline(); });

  await waitFor(() => expect(result.current.mode).toBe('online'));
  expect(result.current.candidates).toEqual([]);
  expect(result.current.error).toBeNull();
});

test('a match failure sets error mode with the igdbUnavailable key', async () => {
  match.mockRejectedValue(new Error('503'));

  const { result } = await renderLadder();
  await type(result, 'hades');
  await act(async () => { result.current.searchOnline(); });

  await waitFor(() => expect(result.current.mode).toBe('error'));
  expect(result.current.error).toEqual({ scope: 'match', key: 'select.igdbUnavailable' });
});

test('a trailing space does not discard candidates the user paid for', async () => {
  match.mockResolvedValue([{ igdb_id: 5, name: 'Hades', year: 2020, cover_url: null, score: 0.9 }]);

  const { result } = await renderLadder();
  await type(result, 'hades');
  await act(async () => { result.current.searchOnline(); });
  await waitFor(() => expect(result.current.candidates).toHaveLength(1));

  await act(async () => { result.current.setQuery('hades '); });

  expect(result.current.mode).toBe('online');
  expect(result.current.candidates).toHaveLength(1);
});

test('editing the trimmed query resets to browse', async () => {
  match.mockResolvedValue([{ igdb_id: 5, name: 'Hades', year: 2020, cover_url: null, score: 0.9 }]);

  const { result } = await renderLadder();
  await type(result, 'hades');
  await act(async () => { result.current.searchOnline(); });
  await waitFor(() => expect(result.current.candidates).toHaveLength(1));

  await act(async () => { result.current.setQuery('hades 2'); });

  expect(result.current.mode).toBe('browse');
  expect(result.current.candidates).toEqual([]);
});

test('selecting a library game resolves without any write', async () => {
  const { result, onResolved } = await renderLadder();

  let id: number | null = null;
  await act(async () => { id = await result.current.select({ kind: 'library', game: OWNED[0] }); });

  expect(id).toBe(1);
  expect(onResolved).toHaveBeenCalledWith(1);
  expect(create).not.toHaveBeenCalled();
  expect(result.current.selectedMeta).toEqual({
    id: 1, primary_name: 'Hades', cover_image_url: null,
  });
});

test('selecting an IGDB candidate creates the game and passes the query as an alias', async () => {
  create.mockResolvedValue({ id: 42, primary_name: 'Hades', cover_image_url: null });

  const { result, onResolved } = await renderLadder();
  await type(result, 'hades');

  await act(async () => {
    await result.current.select({
      kind: 'candidate',
      candidate: { igdb_id: 5, name: 'Hades', year: 2020, cover_url: null, score: 0.9 },
    });
  });

  expect(create).toHaveBeenCalledWith({ igdb_id: 5, query: 'hades' });
  expect(onResolved).toHaveBeenCalledWith(42);
});

test('unrecognized creates a stub from the trimmed query', async () => {
  create.mockResolvedValue({ id: 43, primary_name: 'Tiny Indie', cover_image_url: null });

  const { result, onResolved } = await renderLadder();
  await type(result, '  Tiny Indie  ');

  await act(async () => { await result.current.select({ kind: 'unrecognized' }); });

  expect(create).toHaveBeenCalledWith({ name: 'Tiny Indie', unrecognized: true });
  expect(onResolved).toHaveBeenCalledWith(43);
});

test('a create failure returns null, keeps mode online and keeps the candidates', async () => {
  match.mockResolvedValue([{ igdb_id: 5, name: 'Hades', year: 2020, cover_url: null, score: 0.9 }]);
  create.mockRejectedValue(new Error('boom'));

  const { result, onResolved } = await renderLadder();
  await type(result, 'hades');
  await act(async () => { result.current.searchOnline(); });
  await waitFor(() => expect(result.current.candidates).toHaveLength(1));

  let id: number | null = 1;
  await act(async () => { id = await result.current.select({ kind: 'unrecognized' }); });

  expect(id).toBeNull();
  expect(result.current.mode).toBe('online');
  expect(result.current.candidates).toHaveLength(1);
  expect(result.current.error).toEqual({ scope: 'create', key: 'select.createFailed' });
  expect(onResolved).not.toHaveBeenCalled();
});

test('an in-flight suggest response resolving after unmount does not write state', async () => {
  let resolveSuggest: (v: unknown) => void = () => {};
  suggest.mockImplementationOnce(() => new Promise((r) => { resolveSuggest = r; }));
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  const { result, unmount } = await renderLadder();
  await act(async () => { result.current.setQuery('hades'); });
  await act(async () => { jest.advanceTimersByTime(300); }); // fires the debounced suggest call

  await act(async () => { await unmount(); });

  // Without the mounted guard, resolving here would call setSuggestions/setIsSuggesting
  // on an unmounted component, which React reports as a console.error.
  await act(async () => { resolveSuggest({ total: 1, items: [makeSuggestion(1, 'Hades')] }); });

  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test('a failed library load surfaces pickerError but leaves the ladder usable', async () => {
  getAll.mockRejectedValue(new Error('net'));
  suggest.mockResolvedValue({ total: 1, items: [makeSuggestion(99, 'Hades II')] });

  const { result } = await renderLadder();

  expect(result.current.pickerError).toBe(true);
  expect(result.current.libraryMatches).toEqual([]);

  await type(result, 'hades');
  await waitFor(() => expect(result.current.catalogMatches).toHaveLength(1));
});
