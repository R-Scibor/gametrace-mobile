import client from './client';
import { Session } from '../types/api';

type SessionsResponse = {
    items: Session[];
    total: number;
};

export const getGameSessions = async (gameId: string, skip = 0, limit = 20): Promise<SessionsResponse> => {
    const response = await client.get<SessionsResponse>(`/games/${gameId}/sessions`, {
        params: { skip, limit } }
    );
    return response.data;
};

export const createSession = async (payload: { game_id: string; started_at: string; ended_at: string; notes?: string }): Promise<Session> => {
    const response= await client.post<Session>('/sessions', payload);
    return response.data;
};
