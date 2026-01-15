import { apiClient } from './api';
import { ApiResponse, AuthResponse, User } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data!;
  },
  
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/register', data);
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data!;
  },
  
  async getProfile(): Promise<User> {
    const response: ApiResponse<User> = await apiClient.get('/auth/profile');
    return response.data!;
  },
  
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const response: ApiResponse<User> = await apiClient.put('/auth/profile', data);
    return response.data!;
  },
  
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
  
  logout(): void {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
  
  getToken(): string | null {
    return localStorage.getItem('token');
  },
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
