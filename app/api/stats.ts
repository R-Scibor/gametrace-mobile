import client from './client';
import { DashboardSummary, StatsSummary } from '../types/api';

export const getStatsSummary = async (days?: number): Promise<StatsSummary> => {
    const response = await client.get<StatsSummary>('/stats/summary', { params: { days } });
    return response.data;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const response = await client.get<DashboardSummary>('/stats/dashboard');
    return response.data;
};