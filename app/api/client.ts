import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { useAlertStore } from '../store/alertStore';

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
                useAlertStore.getState().showAlert('Sesja wygasła', 'Zaloguj się ponownie.');
            }
        }
        return Promise.reject(error);
    }
);

export default client;
