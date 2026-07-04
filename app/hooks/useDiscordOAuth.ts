import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import { DISCORD_CLIENT_ID } from '../config';

// Required so the browser auth session resolves on return (no-op on native).
WebBrowser.maybeCompleteAuthSession();

const discovery = {
    authorizationEndpoint: 'https://discord.com/oauth2/authorize',
    tokenEndpoint: 'https://discord.com/api/oauth2/token',
};

export type DiscordPromptResult =
    | { type: 'success'; code: string; codeVerifier: string; redirectUri: string }
    | { type: 'cancel' }
    | { type: 'error' };

// Wraps expo-auth-session's PKCE authorize flow for Discord. The backend does the
// token exchange, so we only need the authorization code + PKCE verifier. The
// redirect URI is dynamic in Expo Go (exp://LAN-IP) and stable (gametrace://oauth)
// in a dev build — it must be registered in the Discord portal + backend allowlist.
export function useDiscordOAuth(): {
    ready: boolean;
    promptDiscord: () => Promise<DiscordPromptResult>;
} {
    const redirectUri = makeRedirectUri({ scheme: 'gametrace', path: 'oauth' });
    const [request, , promptAsync] = useAuthRequest(
        {
            clientId: DISCORD_CLIENT_ID,
            scopes: ['identify', 'guilds'],
            redirectUri,
            responseType: ResponseType.Code,
            usePKCE: true,
        },
        discovery,
    );

    const promptDiscord = async (): Promise<DiscordPromptResult> => {
        const result = await promptAsync();
        if (result.type === 'success' && result.params.code) {
            return {
                type: 'success',
                code: result.params.code,
                codeVerifier: request?.codeVerifier ?? '',
                redirectUri,
            };
        }
        if (result.type === 'cancel' || result.type === 'dismiss') {
            return { type: 'cancel' };
        }
        return { type: 'error' };
    };

    return { ready: request != null, promptDiscord };
}
