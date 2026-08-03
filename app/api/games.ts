import client from './client';
import { CreateGamePayload, CreatedGame, EnrichmentStatus, Game, GameListResponse, GameResolveResponse, GameSort, GameStats, GameSuggestResponse, IGDBCandidate, LibraryFilter, Session, UserPreference } from '../types/api';

export const getGames = async (opts: {
    skip?: number;
    limit?: number;
    status?: EnrichmentStatus;
    q?: string;
    inLibrary?: boolean;
    sort?: GameSort;
    filter?: LibraryFilter;
} = {}): Promise<GameListResponse> => {
    const { skip = 0, limit = 20, status, q, inLibrary, sort, filter } = opts;
    const params: Record<string, unknown> = { skip, limit, status, q, in_library: inLibrary, sort };
    if (filter) params[filter.type] = filter.value;
    const response = await client.get<GameListResponse>('/games', { params });
    return response.data;
};

export const getGameSessions = async (
    gameId: number,
    skip = 0,
    limit = 20,
): Promise<Session[]> => {
    const response = await client.get<Session[]>(`/games/${gameId}/sessions`, {
        params: { skip, limit },
    });
    return response.data;
};

export const getGameStats = async (gameId: number): Promise<GameStats> => {
    const response = await client.get<GameStats>(`/games/${gameId}/stats`);
    return response.data;
};

export const updateGamePreference = async (
    gameId: number,
    pref: { is_ignored?: boolean; is_accepted?: boolean },
): Promise<UserPreference> => {
    const response = await client.put<UserPreference>(`/user/preferences/${gameId}`, pref);
    return response.data;
};

export const resolveGame = async (
    name: string,
): Promise<GameResolveResponse | null> => {
    const response = await client.get<GameResolveResponse | null>('/games/resolve', {
        params: { name },
    });
    return response.data;
};

export const suggestGames = async (
    q: string,
    skip = 0,
    limit = 20,
): Promise<GameSuggestResponse> => {
    const response = await client.get<GameSuggestResponse>('/games/suggest', {
        params: { q, skip, limit },
    });
    return response.data;
};

/** POST /games/match returns a BARE LIST, not a {total, items} envelope. */
export const matchGames = async (query: string): Promise<IGDBCandidate[]> => {
    const response = await client.post<IGDBCandidate[]>('/games/match', { query });
    return response.data;
};

export const createGame = async (payload: CreateGamePayload): Promise<CreatedGame> => {
    const response = await client.post<CreatedGame>('/games', payload);
    return response.data;
};

/** Backend caps GET /games at limit=100, so the picker pages through the library. */
const GAME_PICKER_PAGE_SIZE = 100;

export const getAllGamesForPicker = async (): Promise<Game[]> => {
    const all: Game[] = [];
    for (let skip = 0; ; skip += GAME_PICKER_PAGE_SIZE) {
        const page = await getGames({ skip, limit: GAME_PICKER_PAGE_SIZE, sort: 'name' });
        all.push(...page.items);
        if (all.length >= page.total || page.items.length < GAME_PICKER_PAGE_SIZE) break;
    }
    return all;
};
