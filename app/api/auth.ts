import client from './client';
import { LoginResponse } from '../types/api';

export const login = async (discordName: string): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/api/v1/auth/login', {
    discord_name: discordName,
  });
  return response.data;
};