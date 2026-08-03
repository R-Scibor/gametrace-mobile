jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import client from '../client';
import { suggestGames, matchGames, createGame, getAllGamesForPicker } from '../games';
import { Game } from '../../types/api';

const get = client.get as jest.Mock;
const post = client.post as jest.Mock;

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

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

test('suggestGames hits /games/suggest with paging params', async () => {
  get.mockResolvedValue({ data: { total: 1, items: [] } });

  const out = await suggestGames('hades');

  expect(get).toHaveBeenCalledWith('/games/suggest', {
    params: { q: 'hades', skip: 0, limit: 20 },
  });
  expect(out).toEqual({ total: 1, items: [] });
});

test('matchGames returns the bare list, not an envelope', async () => {
  const candidates = [{ igdb_id: 5, name: 'Hades', year: 2020, cover_url: null, score: 0.9 }];
  post.mockResolvedValue({ data: candidates });

  const out = await matchGames('hades');

  expect(post).toHaveBeenCalledWith('/games/match', { query: 'hades' });
  expect(out).toEqual(candidates);
});

test('createGame posts the payload through unchanged', async () => {
  post.mockResolvedValue({ data: { id: 9, primary_name: 'Hades', cover_image_url: null } });

  await createGame({ igdb_id: 5, query: 'hades' });
  expect(post).toHaveBeenCalledWith('/games', { igdb_id: 5, query: 'hades' });

  await createGame({ name: 'Tiny Indie', unrecognized: true });
  expect(post).toHaveBeenCalledWith('/games', { name: 'Tiny Indie', unrecognized: true });
});

test('getAllGamesForPicker pages until total is reached, sorted by name', async () => {
  const first = Array.from({ length: 100 }, (_, i) => makeGame(i + 1, `G${i + 1}`));
  get
    .mockResolvedValueOnce({ data: { total: 150, items: first } })
    .mockResolvedValueOnce({ data: { total: 150, items: [makeGame(101, 'G101')] } });

  const out = await getAllGamesForPicker();

  expect(out).toHaveLength(101);
  expect(get).toHaveBeenCalledTimes(2);
  expect(get).toHaveBeenNthCalledWith(1, '/games', {
    params: { skip: 0, limit: 100, status: undefined, q: undefined, in_library: undefined, sort: 'name' },
  });
  expect(get).toHaveBeenNthCalledWith(2, '/games', {
    params: { skip: 100, limit: 100, status: undefined, q: undefined, in_library: undefined, sort: 'name' },
  });
});

test('getAllGamesForPicker stops on a short page even if total lies', async () => {
  get.mockResolvedValue({ data: { total: 999, items: [makeGame(1, 'G1')] } });

  const out = await getAllGamesForPicker();

  expect(out).toHaveLength(1);
  expect(get).toHaveBeenCalledTimes(1);
});
