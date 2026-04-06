import axios from 'axios';

const client = axios.create({
    baseURL: 'http://homelab:8010/api/v1',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete client.defaults.headers.common['Authorization'];
    }
};

// Request interceptor to add auth token
client.interceptors.request.use(
    (config) => {
        return config;
    });

// Response interceptor to handle errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
    if (error.response?.status === 401) {
      // todo: console log for now, later logout and redirect
      console.log('401 — brak autoryzacji');
    }
    return Promise.reject(error);
  }
);

export default client;