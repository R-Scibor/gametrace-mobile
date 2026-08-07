import { useState } from 'react';
import { resolveServer, ResolveResult } from '../api/resolveServer';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { useDeletionHandoffStore } from '../store/deletionHandoffStore';

export function useChangeServer() {
    const [loading, setLoading] = useState(false);
    const setServerUrl = useServerStore((s) => s.setServerUrl);

    const apply = (baseUrl: string) => {
        useDeletionHandoffStore.getState().clear();
        setServerUrl(baseUrl);
        useAuthStore.getState().logout();
    };

    // Returns the raw ResolveResult so the caller can show the exact baseUrl
    // the probe validated. 'ok' is applied immediately; 'insecure' waits for
    // the caller to confirm, then call confirmInsecure(result.baseUrl).
    const change = async (input: string): Promise<ResolveResult> => {
        setLoading(true);
        try {
            const result = await resolveServer(input);
            if (result.status === 'ok') apply(result.baseUrl);
            return result;
        } finally {
            setLoading(false);
        }
    };

    const confirmInsecure = (baseUrl: string) => apply(baseUrl);

    return { change, confirmInsecure, loading };
}
