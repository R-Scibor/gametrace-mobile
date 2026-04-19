import client from './client';
import { EnrichmentStatus, Game, Session } from '../types/api';

export const getGames = async (
    skip = 0,
    limit = 20,
    status?: EnrichmentStatus,
): Promise<Game[]> => {
    const response = await client.get<Game[]>('/games', { params: { skip, limit, status } });
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

export const mergeGame = async (gameId: number, targetId: number): Promise<void> => {
    await client.post(`/games/${gameId}/merge/${targetId}`);
};

export const uploadCover = async (
    gameId: number,
    imageBase64: string,
    extension = 'jpg',
): Promise<Game> => {
    const response = await client.put<Game>(`/games/${gameId}/cover`, {
        image_base64: imageBase64,
        extension,
    });
    return response.data;
};
