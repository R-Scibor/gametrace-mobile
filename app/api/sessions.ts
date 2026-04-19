import client from './client';
import { Session, SessionCreate, SessionPatch } from '../types/api';

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
