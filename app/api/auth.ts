import client from './client';
import { LoginResponse } from '../types/api';
import { normalizeLinkCode } from '../utils/linkCode';

export const login = async (username: string, timezone = 'UTC'): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>('/auth/login', { username, timezone });
    return response.data;
};

// Redeem a one-time 6-digit code from the Discord /login command. The code is
// sent digit-only (internal spaces stripped) — the backend accepts either.
export const linkLogin = async (code: string, timezone = 'UTC'): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>('/auth/link', {
        code: normalizeLinkCode(code),
        timezone,
    });
    return response.data;
};
