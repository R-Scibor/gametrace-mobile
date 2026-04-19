import client from './client';

export const logout = async (): Promise<void> => {
    await client.post('/auth/logout');
};
