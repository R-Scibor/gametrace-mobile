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

// Complete the Discord OAuth2 flow. The backend does the confidential token
// exchange (client secret stays server-side); we only forward the auth code,
// the PKCE verifier, and the exact redirect_uri used in the authorize request.
export const discordLogin = async (
    code: string,
    codeVerifier: string,
    redirectUri: string,
): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>('/auth/discord', {
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
    });
    return response.data;
};
