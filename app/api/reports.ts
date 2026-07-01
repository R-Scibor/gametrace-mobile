import client from './client';

export type ReportContext = {
    screen: string;
    platform: string;
    osVersion: string;
    appVersion: string;
};

export async function submitReport(message: string, context: ReportContext): Promise<void> {
    await client.post('/reports', { message, context });
}
