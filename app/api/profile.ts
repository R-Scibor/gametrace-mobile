import client from './client';
import { ProfileMe, ProfileSettings } from '../types/api';

export const logout = async (): Promise<void> => {
    await client.post('/auth/logout');
};

export const getProfile = async (): Promise<ProfileMe> => {
    const response = await client.get<ProfileMe>('/profile/me');
    return response.data;
};

export const updateSettings = async (settings: Partial<ProfileSettings>): Promise<void> => {
    await client.put('/profile/settings', settings);
};
