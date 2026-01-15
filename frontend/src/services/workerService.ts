import { apiClient } from './api';
import { ApiResponse, Worker } from '@/types';

export const workerService = {
  async getWorkers(params?: {
    queueName?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ workers: Worker[]; total: number }> {
    const response: ApiResponse<Worker[]> = await apiClient.get('/workers', { params });
    return {
      workers: response.data || [],
      total: response.meta?.total || 0,
    };
  },
  
  async getWorker(workerId: string): Promise<Worker> {
    const response: ApiResponse<Worker> = await apiClient.get(`/workers/${workerId}`);
    return response.data!;
  },
  
  async getWorkerStats(queueName?: string): Promise<{
    total: number;
    active: number;
    idle: number;
    error: number;
    stopped: number;
  }> {
    const response: ApiResponse = await apiClient.get('/workers/stats', {
      params: { queueName },
    });
    return response.data!;
  },
  
  async updateWorkerHealth(
    workerId: string,
    data: {
      cpuUsage?: number;
      memoryUsage?: number;
      errors?: string[];
    }
  ): Promise<void> {
    await apiClient.put(`/workers/${workerId}/health`, data);
  },
  
  async cleanupStaleWorkers(): Promise<{ cleanedUp: number }> {
    const response: ApiResponse<{ cleanedUp: number }> = await apiClient.post(
      '/workers/cleanup'
    );
    return response.data!;
  },
};
