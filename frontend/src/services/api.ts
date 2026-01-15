import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    // Use VITE_API_URL in production, fallback to relative path in development
    const apiUrl = (import.meta as any).env?.VITE_API_URL;
    const baseURL = apiUrl ? `${apiUrl}/api/v1` : '/api/v1';
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        const message = error.response?.data?.error || error.message;
        return Promise.reject(new Error(message));
      }
    );
  }
  
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();
