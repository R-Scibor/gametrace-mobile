import { useState } from 'react';
import { login } from '../api/auth';
import { LoginResponse } from '../types/api';

type AuthState = {
    token: string | null;
    user: Omit<LoginResponse, 'token'> | null;
};

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({ token: null, user: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (discordName: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await login(discordName);
            setState({ token: data.token, user: { discord_id: data.discord_id, username: data.username, timezone: data.timezone } });
            return data.token;
        } catch (e: any) {
            const message = e.response?.data?.detail ?? 'An error occurred during login';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { ...state, loading, error, login: handleLogin };
};