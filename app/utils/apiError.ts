// Pulls a human-readable message out of an axios error, surfacing the backend's
// `detail` where present (string, FastAPI 422 array, or nested { detail }).
export const apiErrorMessage = (e: any, fallback: string): string => {
    const status = e?.response?.status;
    const detail = e?.response?.data?.detail;
    let msg: string;
    if (typeof detail === 'string') {
        msg = detail;
    } else if (Array.isArray(detail)) {
        const msgs = detail.map((d: any) => d?.msg).filter(Boolean);
        msg = msgs.length ? msgs.join('; ') : fallback;
    } else if (typeof detail?.detail === 'string') {
        msg = detail.detail;
    } else {
        msg = fallback;
    }
    return status ? `${status}: ${msg}` : msg;
};
