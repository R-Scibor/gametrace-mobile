import client from './client';
import {
    CompaniesResponse,
    CompanyRole,
    DashboardSummary,
    GenresResponse,
    HeatmapResponse,
    ReleaseYearsResponse,
    StatsSummary,
    StreakResponse,
    ThemesResponse,
    TrendResponse,
} from '../types/api';

export const getStatsSummary = async (days?: number): Promise<StatsSummary> => {
    const response = await client.get<StatsSummary>('/stats/summary', { params: { days } });
    return response.data;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const response = await client.get<DashboardSummary>('/stats/dashboard');
    return response.data;
};

export const getHeatmap = async (days?: number): Promise<HeatmapResponse> => {
    const response = await client.get<HeatmapResponse>('/stats/heatmap', { params: { days } });
    return response.data;
};

export const getStreak = async (): Promise<StreakResponse> => {
    const response = await client.get<StreakResponse>('/stats/streak');
    return response.data;
};

export const getTrend = async (days?: number): Promise<TrendResponse> => {
    const response = await client.get<TrendResponse>('/stats/trend', { params: { days } });
    return response.data;
};

export const getGenres = async (days?: number): Promise<GenresResponse> => {
    const response = await client.get<GenresResponse>('/stats/genres', { params: { days } });
    return response.data;
};

export const getThemes = async (days?: number): Promise<ThemesResponse> => {
    const response = await client.get<ThemesResponse>('/stats/themes', { params: { days } });
    return response.data;
};

export const getCompanies = async (
    role: CompanyRole,
    limit?: number,
    days?: number,
): Promise<CompaniesResponse> => {
    const response = await client.get<CompaniesResponse>('/stats/companies', {
        params: { role, limit, days },
    });
    return response.data;
};

export const getReleaseYears = async (days?: number): Promise<ReleaseYearsResponse> => {
    const response = await client.get<ReleaseYearsResponse>('/stats/release-years', { params: { days } });
    return response.data;
};
