import axios from 'axios';
import client from './client';
import { DeletionStatus, ProfileMe, ProfileSettings } from '../types/api';

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

export const requestDeletion = async (): Promise<DeletionStatus> => {
    const response = await client.post<DeletionStatus>('/profile/me/deletion');
    return response.data;
};

export const cancelDeletion = async (): Promise<'cancelled' | 'not-scheduled'> => {
    try {
        await client.delete('/profile/me/deletion');
        return 'cancelled';
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
            return 'not-scheduled';
        }
        throw err;
    }
};
