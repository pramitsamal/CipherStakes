import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cs_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            // token expired/invalid
            if (window.location.pathname.startsWith('/app')) {
                localStorage.removeItem('cs_token');
            }
        }
        return Promise.reject(err);
    }
);

export default api;
