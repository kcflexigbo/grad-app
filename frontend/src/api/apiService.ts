import axios from 'axios';

// The base URL for your FastAPI backend
const API_URL = 'http://127.0.0.1:8000';

const apiService = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add the JWT token to every outgoing request
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiService;