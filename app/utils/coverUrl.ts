import { useServerStore } from '../store/serverStore';

// cover_image_url contract (docs/api.md → Static): a leading "/" (e.g.
// /covers/40.png) is served by the static-file mount and must be resolved
// against the API origin, not the /api/v1-prefixed base used for requests.
// Absolute IGDB CDN URLs are used as-is.
export const resolveCoverUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (!url.startsWith('/')) return url;
    const serverUrl = useServerStore.getState().serverUrl;
    if (!serverUrl) return null;
    const origin = serverUrl.replace(/\/api\/v1\/?$/, '');
    return `${origin}${url}`;
};
