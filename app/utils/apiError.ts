// Unmapped backend errors carry frozen English `detail` strings (and status codes)
// that mean nothing to the user. Callers map the cases they know (conflicts,
// session bounds) before reaching this, so here we only log the raw response in
// dev and show the caller's translated fallback.
export const apiErrorMessage = (e: any, fallback: string): string => {
    if (__DEV__) {
        console.log('api error', e?.response?.status, e?.response?.data?.detail ?? e?.message);
    }
    return fallback;
};
