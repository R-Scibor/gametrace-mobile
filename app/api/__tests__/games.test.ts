jest.mock('../client', () => ({ __esModule: true, default: { get: jest.fn() } }));

import client from '../client';
import { getGames } from '../games';

beforeEach(() => {
  (client.get as jest.Mock).mockReset();
  (client.get as jest.Mock).mockResolvedValue({ data: { total: 0, items: [] } });
});

test('getGames forwards sort and pagination params', async () => {
  await getGames({ skip: 20, limit: 20, sort: 'playtime' });

  expect(client.get).toHaveBeenCalledWith('/games', {
    params: { skip: 20, limit: 20, status: undefined, q: undefined, in_library: undefined, sort: 'playtime' },
  });
});

test('getGames spreads a filter facet under its backend param name', async () => {
  await getGames({ sort: 'playtime', filter: { type: 'release_decade', value: '2010s' } });

  expect(client.get).toHaveBeenCalledWith('/games', {
    params: {
      skip: 0, limit: 20, status: undefined, q: undefined, in_library: undefined,
      sort: 'playtime', release_decade: '2010s',
    },
  });
});
