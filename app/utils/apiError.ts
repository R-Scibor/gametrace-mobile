// Unmapped backend errors carry frozen English `detail` strings (and status codes)
// that mean nothing to the user. Callers map the cases they know (conflicts,
// session bounds) before reaching this, so here we only log the raw response in
// dev and show the caller's translated fallback.
export const apiErrorMessage = (e: unknown, fallback: string): string => {
    if (__DEV__) {
        const res = (e as { response?: { status?: number; data?: { detail?: unknown } }; message?: string }) ?? {};
        console.log('api error', res.response?.status, res.response?.data?.detail ?? res.message);
    }
    return fallback;
};
