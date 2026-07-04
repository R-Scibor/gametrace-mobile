import { useState } from 'react';
import { login, linkLogin, discordLogin } from '../api/auth';
import { LoginResponse } from '../types/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getDeviceTimezone } from '../utils/timezones';
import { useDiscordOAuth } from './useDiscordOAuth';
import { useServerJoinStore } from '../store/serverJoinStore';

// Turn a link-code redemption failure into a Polish message keyed off the
// backend's status codes (see docs/api.md → Auth → POST /auth/link).
const linkErrorMessage = (e: any): string => {
  const status = e?.response?.status;
  switch (status) {
    case 401:
      return 'Nieprawidłowy lub wygasły kod. Uruchom /login na Discordzie ponownie.';
    case 422:
      return 'Kod musi mieć 6 cyfr.';
    case 429: {
      const retryAfter = e?.response?.headers?.['retry-after'];
      return retryAfter
        ? `Zbyt wiele prób. Spróbuj ponownie za ${retryAfter} s.`
        : 'Zbyt wiele prób. Spróbuj ponownie później.';
    }
    case 503:
      return 'Logowanie kodem jest chwilowo niedostępne. Spróbuj później.';
    default:
      return e?.response ? 'Nie udało się zalogować. Spróbuj ponownie.' : 'Błąd połączenia z serwerem';
  }
};

// Map a Discord OAuth failure to Polish copy (see docs/api.md → POST /auth/discord).
const discordErrorMessage = (e: any): string => {
  const status = e?.response?.status;
  switch (status) {
    case 400:
      return 'Nie można zalogować przez Discord (błąd przekierowania).';
    case 401:
      return 'Logowanie przez Discord nie powiodło się. Spróbuj ponownie.';
    case 502:
      return 'Discord jest chwilowo niedostępny. Spróbuj później.';
    default:
      return e?.response ? 'Nie udało się zalogować. Spróbuj ponownie.' : 'Błąd połączenia z serwerem';
  }
};

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout, isAuthenticated, user } = useAuthStore();

  const seedSession = (data: LoginResponse) => {
    storeLogin(data.token, {
      discordId: data.discord_id,
      username: data.username,
    }, data.is_admin);
    useSettingsStore.getState().setTimezone(data.timezone);
  };

  const handleLogin = async (discordName: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(discordName, getDeviceTimezone());
      seedSession(data);
      return true;
    } catch (e: any) {
      const message = e.response?.data?.detail ?? 'Błąd połączenia z serwerem';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLinkLogin = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await linkLogin(code, getDeviceTimezone());
      seedSession(data);
      return true;
    } catch (e: any) {
      setError(linkErrorMessage(e));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const { ready: discordReady, promptDiscord } = useDiscordOAuth();

  const handleDiscordLogin = async () => {
    setError(null);
    const result = await promptDiscord();
    if (result.type === 'cancel') return false;
    if (result.type === 'error') {
      setError('Logowanie przez Discord nie powiodło się. Spróbuj ponownie.');
      return false;
    }
    setLoading(true);
    try {
      const data = await discordLogin(result.code, result.codeVerifier, result.redirectUri);
      seedSession(data);
      if (data.needs_server_join) useServerJoinStore.getState().show();
      return true;
    } catch (e: any) {
      setError(discordErrorMessage(e));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, isAuthenticated, user, handleLogin, handleLinkLogin, handleDiscordLogin, discordReady, logout };
};
