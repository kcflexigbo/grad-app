import axios from 'axios';
import { API_URL } from './config';

// const API_URL = API_URL || 'http://localhost:8000';

const apiService = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// // Request Interceptor: Add the JWT token to every outgoing request
// apiService.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem('accessToken');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

export default apiService;