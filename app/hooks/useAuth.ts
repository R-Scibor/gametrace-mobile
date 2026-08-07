import { useState } from 'react';
import { login, linkLogin, discordLogin } from '../api/auth';
import { LoginResponse } from '../types/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDeletionHandoffStore } from '../store/deletionHandoffStore';
import { getDeviceTimezone } from '../utils/timezones';
import { useDiscordOAuth } from './useDiscordOAuth';
import { useServerJoinStore } from '../store/serverJoinStore';
import i18n from '../i18n';

// Turn a link-code redemption failure into a message keyed off the
// backend's status codes (see docs/api.md → Auth → POST /auth/link).
const linkErrorMessage = (e: any): string => {
  const status = e?.response?.status;
  switch (status) {
    case 401:
      return i18n.t('auth:errors.link401');
    case 422:
      return i18n.t('auth:errors.link422');
    case 429: {
      const retryAfter = e?.response?.headers?.['retry-after'];
      return retryAfter
        ? i18n.t('auth:errors.link429Retry', { seconds: retryAfter })
        : i18n.t('auth:errors.link429');
    }
    case 503:
      return i18n.t('auth:errors.link503');
    default:
      return e?.response ? i18n.t('auth:errors.loginFailed') : i18n.t('auth:errors.connection');
  }
};

// Map a Discord OAuth failure to copy (see docs/api.md → POST /auth/discord).
const discordErrorMessage = (e: any): string => {
  const status = e?.response?.status;
  switch (status) {
    case 400:
      return i18n.t('auth:errors.discord400');
    case 401:
      return i18n.t('auth:errors.discord401');
    case 502:
      return i18n.t('auth:errors.discord502');
    default:
      return e?.response ? i18n.t('auth:errors.loginFailed') : i18n.t('auth:errors.connection');
  }
};

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout, isAuthenticated, user } = useAuthStore();

  const seedSession = (data: LoginResponse) => {
    useDeletionHandoffStore.getState().clear();
    const pending = data.pending_deletion ?? null;
    storeLogin(
      data.token,
      { discordId: data.discord_id, username: data.username },
      data.is_admin,
      pending,
    );
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
      const message = e.response?.data?.detail ?? i18n.t('auth:errors.connection');
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
    setLoading(true);
    try {
      const result = await promptDiscord();
      if (result.type === 'cancel') return false;
      if (result.type === 'error') {
        setError(i18n.t('auth:errors.discord401'));
        return false;
      }
      const data = await discordLogin(result.code, result.codeVerifier, result.redirectUri);
      seedSession(data);
      if (data.needs_server_join && !data.pending_deletion) {
        useServerJoinStore.getState().show();
      }
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
