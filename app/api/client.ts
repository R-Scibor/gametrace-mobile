import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
    baseURL: 'http://homelab:8010/api/v1',
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
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
            useAuthStore.getState().logout();
            // redirect and message later TODO!!
            console.log('401 — brak autoryzacji, wylogowano użytkownika');
        }
        return Promise.reject(error);
    }
);

export default client;
