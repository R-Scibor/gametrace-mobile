import client from './client';
import { StatsSummary } from '../types/api';

export const getStatsSummary = async (): Promise<StatsSummary> => {
    const response = await client.get<StatsSummary>('/stats/summary');
    return response.data;
};