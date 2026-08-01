import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { useAlertStore } from '../store/alertStore';
import i18n from '../i18n';

const client = axios.create({
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
        config.baseURL = serverUrl;
    }
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const wasAuthenticated = useAuthStore.getState().isAuthenticated;
            useAuthStore.getState().logout();
            if (wasAuthenticated) {
                useAlertStore.getState().showAlert(
                    i18n.t('common:session.expiredTitle'),
                    i18n.t('common:session.expiredBody'),
                );
            }
        }
        return Promise.reject(error);
    }
);

export default client;
