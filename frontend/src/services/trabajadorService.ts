import { apiClient } from './api';

export interface Trabajador {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'worker' | 'admin';
  isActive: boolean;
  serviceAreas: string[];
  createdAt: string;
}

export interface CreateTrabajadorData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  serviceAreas?: string[];
}

export const trabajadorService = {
  getMe: async (): Promise<Trabajador> => {
    const response: any = await apiClient.get('/turn-workers/me');
    const data = response.data || response;
    return data.worker || data;
  },

  getAll: async (): Promise<Trabajador[]> => {
    const response: any = await apiClient.get('/turn-workers');
    const data = response.data || response;
    // El backend devuelve {workers: [], count: number}
    return data.workers || data;
  },

  getById: async (id: string): Promise<Trabajador> => {
    const response: any = await apiClient.get(`/turn-workers/${id}`);
    const data = response.data || response;
    return data.worker || data;
  },

  create: async (data: CreateTrabajadorData): Promise<Trabajador> => {
    const response: any = await apiClient.post('/turn-workers', data);
    const result = response.data || response;
    return result.worker || result;
  },

  update: async (id: string, data: Partial<CreateTrabajadorData>): Promise<Trabajador> => {
    const response: any = await apiClient.put(`/turn-workers/${id}`, data);
    const result = response.data || response;
    return result.worker || result;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/turn-workers/${id}`);
  },

  assignAreas: async (id: string, serviceAreas: string[]): Promise<Trabajador> => {
    const response: any = await apiClient.post(`/turn-workers/${id}/areas`, { serviceAreas });
    const result = response.data || response;
    return result.worker || result;
  },
};
