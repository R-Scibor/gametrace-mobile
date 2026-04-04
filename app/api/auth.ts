import client from './client';
import { LoginResponse } from '../types/api';

export const login = async (discordName: string): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/login', {
    username: discordName,
  });
  return response.data;
};