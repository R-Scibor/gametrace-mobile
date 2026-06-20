import client from './client';
import { Session, SessionCreate, SessionPatch, SessionStatus, TrashedSession } from '../types/api';

export const listSessions = async (params?: {
    status?: SessionStatus[];
    limit?: number;
    skip?: number;
}): Promise<Session[]> => {
    const response = await client.get<Session[]>('/sessions', {
        params: {
            status: params?.status,
            limit: params?.limit,
            skip: params?.skip,
        },
    });
    return response.data;
};

export const getSession = async (sessionId: number): Promise<Session> => {
    const response = await client.get<Session>(`/sessions/${sessionId}`);
    return response.data;
};

export const createSession = async (payload: SessionCreate): Promise<Session> => {
    const response = await client.post<Session>('/sessions', payload);
    return response.data;
};

export const patchSession = async (
    sessionId: number,
    payload: SessionPatch,
): Promise<Session> => {
    const response = await client.patch<Session>(`/sessions/${sessionId}`, payload);
    return response.data;
};

// Discard = soft-delete (moves to trash, restorable ~7 days). 204 No Content.
export const deleteSession = async (sessionId: number): Promise<void> => {
    await client.delete(`/sessions/${sessionId}`);
};

export const getTrashedSessions = async (skip = 0, limit = 20): Promise<TrashedSession[]> => {
    const response = await client.get<TrashedSession[]>('/sessions/trash', { params: { skip, limit } });
    return response.data;
};

export const restoreSession = async (sessionId: number): Promise<void> => {
    await client.post(`/sessions/${sessionId}/restore`);
};

export const hardDeleteSession = async (sessionId: number): Promise<void> => {
    await client.delete(`/sessions/${sessionId}`, { params: { hard: true } });
};
