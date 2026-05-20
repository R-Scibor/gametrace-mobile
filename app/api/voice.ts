import client from './client';
import { TranscribeResponse } from '../types/api';

export const transcribeAudio = async (uri: string): Promise<TranscribeResponse> => {
    const form = new FormData();
    form.append('file', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
    } as any);

    const response = await client.post<TranscribeResponse>('/voice/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
    });
    return response.data;
};
