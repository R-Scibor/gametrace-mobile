import { useState } from 'react';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getDeviceTimezone } from '../utils/timezones';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout, isAuthenticated, user } = useAuthStore();

  const handleLogin = async (discordName: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(discordName, getDeviceTimezone());
      storeLogin(data.token, {
        discordId: data.discord_id,
        username: data.username,
      });
      useSettingsStore.getState().setTimezone(data.timezone);
      return true;
    } catch (e: any) {
      const message = e.response?.data?.detail ?? 'Błąd połączenia z serwerem';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, isAuthenticated, user, handleLogin, logout };
};