import { apiClient } from './api';
import { ApiResponse, Job, JobType, JobPriority, JobStatus } from '@/types';

export const jobService = {
  async getJobs(params?: {
    queueName?: string;
    status?: JobStatus;
    type?: JobType;
    page?: number;
    limit?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    const response: ApiResponse<Job[]> = await apiClient.get('/jobs', { params });
    return {
      jobs: response.data || [],
      total: response.meta?.total || 0,
    };
  },
  
  async getJob(jobId: string): Promise<Job> {
    const response: ApiResponse<Job> = await apiClient.get(`/jobs/${jobId}`);
    return response.data!;
  },
  
  async createJob(data: {
    queueName: string;
    type: JobType;
    data: any;
    priority?: JobPriority;
    options?: {
      delay?: number;
      attempts?: number;
    };
  }): Promise<Job> {
    const response: ApiResponse<Job> = await apiClient.post('/jobs', data);
    return response.data!;
  },
  
  async retryJob(jobId: string): Promise<Job> {
    const response: ApiResponse<Job> = await apiClient.post(`/jobs/${jobId}/retry`);
    return response.data!;
  },
  
  async cancelJob(jobId: string): Promise<Job> {
    const response: ApiResponse<Job> = await apiClient.post(`/jobs/${jobId}/cancel`);
    return response.data!;
  },
  
  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/jobs/${jobId}`);
  },
  
  async bulkRetry(data: {
    queueName?: string;
    type?: JobType;
  }): Promise<{ retriedCount: number }> {
    const response: ApiResponse<{ retriedCount: number }> = await apiClient.post(
      '/jobs/bulk-retry',
      data
    );
    return response.data!;
  },
  
  async getJobStats(queueName?: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const response: ApiResponse = await apiClient.get('/jobs/stats', {
      params: { queueName },
    });
    return response.data!;
  },
};
