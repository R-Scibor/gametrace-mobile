// Pulls a human-readable message out of an axios error, surfacing the backend's
// `detail` where present (string, FastAPI 422 array, or nested { detail }).
export const apiErrorMessage = (e: any, fallback: string): string => {
    const detail = e?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        const msgs = detail.map((d: any) => d?.msg).filter(Boolean);
        if (msgs.length) return msgs.join('; ');
    }
    if (typeof detail?.detail === 'string') return detail.detail;
    return fallback;
};
