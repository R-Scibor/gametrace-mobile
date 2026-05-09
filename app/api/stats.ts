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
    WeeklyTrendResponse,
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

export const getWeeklyTrend = async (weeks?: number): Promise<WeeklyTrendResponse> => {
    const response = await client.get<WeeklyTrendResponse>('/stats/weekly-trend', { params: { weeks } });
    return response.data;
};

export const getGenres = async (): Promise<GenresResponse> => {
    const response = await client.get<GenresResponse>('/stats/genres');
    return response.data;
};

export const getThemes = async (): Promise<ThemesResponse> => {
    const response = await client.get<ThemesResponse>('/stats/themes');
    return response.data;
};

export const getCompanies = async (
    role: CompanyRole,
    limit?: number,
): Promise<CompaniesResponse> => {
    const response = await client.get<CompaniesResponse>('/stats/companies', {
        params: { role, limit },
    });
    return response.data;
};

export const getReleaseYears = async (): Promise<ReleaseYearsResponse> => {
    const response = await client.get<ReleaseYearsResponse>('/stats/release-years');
    return response.data;
};
