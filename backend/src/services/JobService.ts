import { Job, IJob } from '../models/Job';
import { Queue } from '../models/Queue';
import { ApiError } from '../utils/response';
import { queueManager } from '../queues/QueueManager';
import { logger } from '../utils/logger';
import { JobStatus, JobPriority, JobType, IJobOptions } from '../types';

export class JobService {
  async createJob(data: {
    queueName: string;
    type: JobType;
    data: any;
    priority?: JobPriority;
    options?: IJobOptions;
    metadata?: any;
  }): Promise<IJob> {
    try {
      // Get queue
      const queue = await Queue.findOne({ name: data.queueName });
      if (!queue) {
        throw new ApiError(404, `Queue ${data.queueName} not found`);
      }
      
      if (!queue.isActive) {
        throw new ApiError(400, `Queue ${data.queueName} is not active`);
      }
      
      // Generate job ID
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add job to queue manager - convertir opciones si es necesario
      const queueOptions = data.options ? {
        priority: data.options.priority,
        attempts: data.options.attempts || 1,
        delay: data.options.delay,
        removeOnComplete: data.options.removeOnComplete ? 1 : 0,
        removeOnFail: data.options.removeOnFail ? 1 : 0,
        repeat: data.options.repeat
      } : undefined;
      
      const job = await queueManager.addJob(
        data.queueName,
        data.type,
        data.data,
        queueOptions
      );
      
      logger.info(`Job created: ${jobId} in queue ${data.queueName}`);
      
      return job;
    } catch (error: any) {
      logger.error('Error creating job:', error);
      throw error;
    }
  }
  
  async getJobById(jobId: string): Promise<IJob> {
    const job = await Job.findOne({ jobId }).populate('queueId');
    
    if (!job) {
      throw new ApiError(404, 'Job not found');
    }
    
    return job;
  }
  
  async getAllJobs(filters: {
    queueName?: string;
    status?: JobStatus;
    type?: JobType;
    page?: number;
    limit?: number;
  } = {}): Promise<{ jobs: IJob[]; total: number }> {
    const { queueName, status, type, page = 1, limit = 20 } = filters;
    
    const query: any = {};
    if (queueName) query.queueName = queueName;
    if (status) query.status = status;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('queueId'),
      Job.countDocuments(query),
    ]);
    
    return { jobs, total };
  }
  
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: any,
    error?: string
  ): Promise<IJob | null> {
    const job = await Job.findOne({ jobId });
    
    if (!job) return null;
    
    job.status = status;
    
    if (status === JobStatus.PROCESSING) {
      job.processedAt = new Date();
    } else if (status === JobStatus.COMPLETED) {
      job.completedAt = new Date();
      job.result = result;
      job.progress = 100;
    } else if (status === JobStatus.FAILED) {
      job.failedAt = new Date();
      job.error = error;
      job.attempts += 1;
      
      // Calculate next retry
      if (job.attempts < job.maxAttempts) {
        const delay = Math.pow(2, job.attempts) * 5000; // Exponential backoff
        job.nextRetryAt = new Date(Date.now() + delay);
        job.status = JobStatus.DELAYED;
      }
    }
    
    await job.save();
    
    return job;
  }
  
  async cancelJob(jobId: string): Promise<IJob> {
    const job = await Job.findOne({ jobId });
    
    if (!job) {
      throw new ApiError(404, 'Job not found');
    }
    
    if ([JobStatus.COMPLETED, JobStatus.FAILED].includes(job.status)) {
      throw new ApiError(400, 'Cannot cancel completed or failed jobs');
    }
    
    // Remove from queue
    await queueManager.removeJob(jobId);
    
    // Update in MongoDB
    job.status = JobStatus.FAILED;
    job.error = 'Job cancelled by user';
    job.failedAt = new Date();
    
    await job.save();
    
    logger.info(`Job cancelled: ${jobId}`);
    
    return job;
  }
  
  async deleteJob(jobId: string): Promise<void> {
    const job = await Job.findOne({ jobId });
    
    if (!job) {
      throw new ApiError(404, 'Job not found');
    }
    
    // Remove from queue if pending or delayed
    if ([JobStatus.PENDING, JobStatus.DELAYED].includes(job.status)) {
      await queueManager.removeJob(jobId);
    }
    
    // Delete from MongoDB
    await Job.findOneAndDelete({ jobId });
    
    logger.info(`Job deleted: ${jobId}`);
  }
  
  async bulkRetry(filters: {
    queueName?: string;
    type?: JobType;
  }): Promise<{ retriedCount: number }> {
    const query: any = { status: JobStatus.FAILED };
    if (filters.queueName) query.queueName = filters.queueName;
    if (filters.type) query.type = filters.type;
    
    const failedJobs = await Job.find(query);
    
    for (const job of failedJobs) {
      try {
        await this.retryJob(job.jobId);
      } catch (error) {
        logger.error(`Error retrying job ${job.jobId}:`, error);
      }
    }
    
    return { retriedCount: failedJobs.length };
  }
  
  async getJobStats(queueName?: string) {
    const query: any = {};
    if (queueName) query.queueName = queueName;
    
    const [total, pending, processing, completed, failed, delayed] = await Promise.all([
      Job.countDocuments(query),
      Job.countDocuments({ ...query, status: JobStatus.PENDING }),
      Job.countDocuments({ ...query, status: JobStatus.PROCESSING }),
      Job.countDocuments({ ...query, status: JobStatus.COMPLETED }),
      Job.countDocuments({ ...query, status: JobStatus.FAILED }),
      Job.countDocuments({ ...query, status: JobStatus.DELAYED }),
    ]);
    
    return {
      total,
      pending,
      processing,
      completed,
      failed,
      delayed,
    };
  }

  async completeJob(jobId: string, result?: any): Promise<IJob | null> {
    try {
      const job = await Job.findOne({ jobId });
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      job.status = JobStatus.COMPLETED;
      job.result = result;
      job.completedAt = new Date();
      job.progress = 100;

      await job.save();
      logger.info(`✅ Job completed: ${jobId}`);
      return job;
    } catch (error) {
      logger.error(`❌ Failed to complete job ${jobId}:`, error);
      throw error;
    }
  }

  async failJob(jobId: string, error: string): Promise<IJob | null> {
    try {
      const job = await Job.findOne({ jobId });
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      job.status = JobStatus.FAILED;
      job.error = error;
      job.failedAt = new Date();

      await job.save();
      logger.info(`❌ Job failed: ${jobId}`);
      return job;
    } catch (err) {
      logger.error(`❌ Failed to mark job ${jobId} as failed:`, err);
      throw err;
    }
  }

  async updateJobProgress(jobId: string, progress: number): Promise<IJob | null> {
    try {
      const job = await Job.findOneAndUpdate(
        { jobId },
        { progress: Math.min(100, Math.max(0, progress)) },
        { new: true }
      );
      
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      return job;
    } catch (error) {
      logger.error(`❌ Failed to update job progress ${jobId}:`, error);
      throw error;
    }
  }

  async retryJob(jobId: string, options?: { error?: string; retryAt?: Date }): Promise<IJob | null> {
    try {
      const job = await Job.findOne({ jobId });
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (options?.retryAt) {
        job.status = JobStatus.DELAYED;
        job.error = options.error;
        job.attempts += 1;
        job.nextRetryAt = options.retryAt;
      } else {
        job.status = JobStatus.PENDING;
        job.attempts = 0;
        job.error = undefined;
        job.stackTrace = undefined;
        job.failedAt = undefined;
        job.nextRetryAt = undefined;
      }

      await job.save();
      logger.info(`🔄 Job scheduled for retry: ${jobId}`);
      return job;
    } catch (error) {
      logger.error(`❌ Failed to retry job ${jobId}:`, error);
      throw error;
    }
  }
}
