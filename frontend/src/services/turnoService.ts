import { apiClient } from './api';

export interface Turno {
  _id: string;
  turnNumber: string;
  ticketNumber?: string; // alias para compatibilidad
  serviceAreaCode: string;
  serviceAreaName: string;
  customerData?: {
    name?: string;
    lastName?: string;
    idNumber?: string;
    phone?: string;
  };
  status: 'waiting' | 'called' | 'in-progress' | 'completed' | 'cancelled';
  workerName?: string;
  workerId?: string;
  queuePosition?: number;
  createdAt: string;
  calledAt?: string;
  attendedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedWaitTime?: number;
  notes?: string;
}

export interface CreateTurnoData {
  serviceAreaCode: string;
  priority?: boolean;
  customerData?: {
    firstName?: string;
    lastName?: string;
    identificationType?: string;
    identificationNumber?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
}

export const turnoService = {
  getAll: async (): Promise<Turno[]> => {
    const response: any = await apiClient.get('/turns');
    console.log('🔍 Response from /turns:', response);
    // El backend devuelve {success, message, data: {turns: [], total: number}}
    // El interceptor ya extrajo response.data, así que response = {success, message, data}
    const data = response.data || response;
    console.log('📊 Data extracted:', data);
    const turns = data.turns || [];
    console.log('🎫 Turns array:', turns);
    return turns;
  },

  getById: async (id: string): Promise<Turno> => {
    const response: any = await apiClient.get(`/turns/${id}`);
    // Backend devuelve {success, message, data: {turn}}
    const data = response.data || response;
    return data.turn || data;
  },

  create: async (data: CreateTurnoData): Promise<Turno> => {
    const response: any = await apiClient.post('/turns', data);
    // Backend devuelve {success, message, data: {turn}}
    const responseData = response.data || response;
    return responseData.turn || responseData;
  },

  callNext: async (serviceAreaCode: string): Promise<Turno | null> => {
    const response: any = await apiClient.post(`/turns/call/${serviceAreaCode}`);
    // Backend devuelve {success, message, data: {turn}}
    const data = response.data || response;
    return data.turn || data || null;
  },

  start: async (id: string): Promise<Turno> => {
    const response: any = await apiClient.put(`/turns/${id}/attend`);
    // Backend devuelve {success, message, data: {turn}}
    const data = response.data || response;
    return data.turn || data;
  },

  complete: async (id: string): Promise<Turno> => {
    const response: any = await apiClient.put(`/turns/${id}/complete`);
    // Backend devuelve {success, message, data: {turn}}
    const data = response.data || response;
    return data.turn || data;
  },

  cancel: async (id: string): Promise<Turno> => {
    const response: any = await apiClient.put(`/turns/${id}/cancel`, { reason: 'Cancelado por el trabajador' });
    // Backend devuelve {success, message, data: {turn}}
    const data = response.data || response;
    return data.turn || data;
  },

  getStats: async () => {
    const response: any = await apiClient.get('/turns/stats/summary');
    // Backend devuelve {success, message, data: {...}}
    const result = response.data || response;
    return result.data || result;
  },

  getActive: async (): Promise<Turno[]> => {
    const response: any = await apiClient.get('/turns/active');
    // Backend devuelve {success, message, data: [...]}
    const result = response.data || response;
    return result.data || result || [];
  },
};
