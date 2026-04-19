import client from './client';
import { LoginResponse } from '../types/api';

export const login = async (username: string, timezone = 'UTC'): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>('/auth/login', { username, timezone });
    return response.data;
};
