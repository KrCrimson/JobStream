import { apiClient } from './api';

export interface SystemConfig {
  _id: string;
  operationMode: 'single' | 'multiple';
  requireCustomerValidation: boolean;
  validationType: 'dni' | 'phone' | 'email' | 'none';
  ticketFormat: {
    prefix: string;
    useAreaCode: boolean;
    numberLength: number;
  };
  displayConfig: {
    showEstimatedWaitTime: boolean;
    autoRefreshInterval: number;
  };
}

export const configService = {
  get: async (): Promise<SystemConfig> => {
    const response: any = await apiClient.get('/config');
    const data = response.data || response;
    // El backend devuelve {config: {...}}
    return data.config || data;
  },

  update: async (data: Partial<SystemConfig>): Promise<SystemConfig> => {
    const response: any = await apiClient.put('/config', data);
    const result = response.data || response;
    return result.config || result;
  },

  reset: async (): Promise<SystemConfig> => {
    const response: any = await apiClient.post('/config/reset');
    const result = response.data || response;
    return result.config || result;
  },
};
