import { apiClient } from './api';

export interface Area {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  maxWaitingCustomers?: number;
  estimatedServiceTime?: number;
  createdAt: string;
}

export interface CreateAreaData {
  name: string;
  code: string;
  description?: string;
  maxWaitingCustomers?: number;
  estimatedServiceTime?: number;
}

export const areaService = {
  getAll: async (): Promise<Area[]> => {
    const response: any = await apiClient.get('/service-areas');
    const data = response.data || response;
    // El backend devuelve {serviceAreas: [], count: number}
    return data.serviceAreas || data;
  },

  getById: async (id: string): Promise<Area> => {
    const response: any = await apiClient.get(`/service-areas/${id}`);
    const data = response.data || response;
    return data.serviceArea || data;
  },

  create: async (data: CreateAreaData): Promise<Area> => {
    const response: any = await apiClient.post('/service-areas', data);
    const result = response.data || response;
    return result.serviceArea || result;
  },

  update: async (id: string, data: Partial<CreateAreaData>): Promise<Area> => {
    const response: any = await apiClient.put(`/service-areas/${id}`, data);
    const result = response.data || response;
    return result.serviceArea || result;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/service-areas/${id}`);
  },
};
