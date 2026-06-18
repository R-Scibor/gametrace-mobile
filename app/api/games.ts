import client from './client';
import { EnrichmentStatus, GameListResponse, GameResolveResponse, GameStats, Session, UserPreference } from '../types/api';

export const getGames = async (
    skip = 0,
    limit = 20,
    status?: EnrichmentStatus,
    q?: string,
): Promise<GameListResponse> => {
    const response = await client.get<GameListResponse>('/games', { params: { skip, limit, status, q } });
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

export const mergeGame = async (gameId: number, targetId: number): Promise<void> => {
    await client.post(`/games/${gameId}/merge/${targetId}`);
};

export const resolveGame = async (
    name: string,
): Promise<GameResolveResponse | null> => {
    const response = await client.get<GameResolveResponse | null>('/games/resolve', {
        params: { name },
    });
    return response.data;
};
