import client from './client';
import { HealthResponse } from '../types/api';

export const getHealth = async (): Promise<HealthResponse> => {
    const response = await client.get<HealthResponse>('/health');
    return response.data;
};
