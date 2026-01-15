import { apiClient } from './api';
import { ApiResponse, Queue } from '@/types';

export const queueService = {
  async getQueues(params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ queues: Queue[]; total: number }> {
    const response: ApiResponse<Queue[]> = await apiClient.get('/queues', { params });
    return {
      queues: response.data || [],
      total: response.meta?.total || 0,
    };
  },
  
  async getQueue(queueId: string): Promise<Queue> {
    const response: ApiResponse<Queue> = await apiClient.get(`/queues/${queueId}`);
    return response.data!;
  },
  
  async createQueue(data: {
    name: string;
    description?: string;
    concurrency?: number;
  }): Promise<Queue> {
    const response: ApiResponse<Queue> = await apiClient.post('/queues', data);
    return response.data!;
  },
  
  async updateQueue(queueId: string, data: Partial<Queue>): Promise<Queue> {
    const response: ApiResponse<Queue> = await apiClient.put(`/queues/${queueId}`, data);
    return response.data!;
  },
  
  async deleteQueue(queueId: string): Promise<void> {
    await apiClient.delete(`/queues/${queueId}`);
  },
  
  async pauseQueue(queueId: string): Promise<Queue> {
    const response: ApiResponse<Queue> = await apiClient.post(`/queues/${queueId}/pause`);
    return response.data!;
  },
  
  async resumeQueue(queueId: string): Promise<Queue> {
    const response: ApiResponse<Queue> = await apiClient.post(`/queues/${queueId}/resume`);
    return response.data!;
  },
  
  async getQueueMetrics(queueId: string): Promise<Queue> {
    const response: ApiResponse<Queue> = await apiClient.get(`/queues/${queueId}/metrics`);
    return response.data!;
  },
  
  async getAllQueuesMetrics(): Promise<Queue[]> {
    const response: ApiResponse<Queue[]> = await apiClient.get('/queues/metrics');
    return response.data || [];
  },
};
