import { EventEmitter } from 'events';
import { Job, IJob } from '../models/Job';
import { Queue, IQueue } from '../models/Queue';
import { JobStatus, JobPriority, JobType } from '../types';
import { logger } from '../utils/logger';

export interface JobOptions {
  delay?: number;
  priority?: JobPriority;
  attempts?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
  webhookUrl?: string;
  metadata?: any;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

class QueueManager extends EventEmitter {
  private queues: Map<string, IQueue> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      // Load existing queues from database
      const existingQueues = await Queue.find({ active: true });
      for (const queue of existingQueues) {
        this.queues.set(queue.name, queue);
      }

      // Start polling for jobs
      this.startPolling();
      logger.info('✅ Queue Manager initialized with MongoDB');
    } catch (error) {
      logger.error('❌ Failed to initialize Queue Manager:', error);
      throw error;
    }
  }

  async createQueue(name: string, options?: any): Promise<IQueue> {
    try {
      let queue = await Queue.findOne({ name });
      
      if (!queue) {
        queue = new Queue({
          name,
          active: true,
          settings: options || {},
          metadata: {},
        });
        await queue.save();
        logger.info(`📦 Created new queue: ${name}`);
      }

      this.queues.set(name, queue);
      this.emit('queueCreated', queue);
      
      return queue;
    } catch (error) {
      logger.error(`❌ Failed to create queue ${name}:`, error);
      throw error;
    }
  }

  async addJob(
    queueName: string,
    type: JobType,
    data: any,
    options: JobOptions = {}
  ): Promise<IJob> {
    try {
      const queue = await this.ensureQueue(queueName);
      
      const job = new Job({
        jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        queueId: queue._id,
        queueName,
        type,
        status: options.delay && options.delay > 0 ? JobStatus.DELAYED : JobStatus.PENDING,
        priority: options.priority || JobPriority.NORMAL,
        data,
        maxAttempts: options.attempts || 3,
        delay: options.delay,
        webhookUrl: options.webhookUrl,
        metadata: options.metadata || {},
        nextRetryAt: options.delay ? new Date(Date.now() + options.delay) : undefined,
      });

      await job.save();

      logger.info(`📝 Job added to queue ${queueName}: ${job.jobId}`);
      this.emit('jobAdded', job);

      return job;
    } catch (error) {
      logger.error('❌ Failed to add job:', error);
      throw error;
    }
  }

  async getQueueMetrics(queueName: string): Promise<QueueMetrics> {
    try {
      const pipeline = [
        { $match: { queueName } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ];

      const results = await Job.aggregate(pipeline);
      const metrics: QueueMetrics = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0
      };

      for (const result of results) {
        switch (result._id) {
          case JobStatus.PENDING:
            metrics.waiting = result.count;
            break;
          case JobStatus.PROCESSING:
            metrics.active = result.count;
            break;
          case JobStatus.COMPLETED:
            metrics.completed = result.count;
            break;
          case JobStatus.FAILED:
            metrics.failed = result.count;
            break;
          case JobStatus.DELAYED:
            metrics.delayed = result.count;
            break;
        }
        metrics.total += result.count;
      }

      return metrics;
    } catch (error) {
      logger.error(`❌ Failed to get metrics for queue ${queueName}:`, error);
      throw error;
    }
  }

  async getJob(jobId: string): Promise<IJob | null> {
    try {
      return await Job.findOne({ jobId });
    } catch (error) {
      logger.error(`❌ Failed to get job ${jobId}:`, error);
      throw error;
    }
  }

  async removeJob(jobId: string): Promise<boolean> {
    try {
      const result = await Job.deleteOne({ jobId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`❌ Failed to remove job ${jobId}:`, error);
      throw error;
    }
  }

  async retryJob(jobId: string): Promise<IJob | null> {
    try {
      const job = await Job.findOne({ jobId });
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      job.status = JobStatus.PENDING;
      job.error = undefined;
      job.stackTrace = undefined;
      job.processedAt = undefined;
      job.failedAt = undefined;
      job.nextRetryAt = undefined;
      
      await job.save();
      
      logger.info(`🔄 Job retry queued: ${jobId}`);
      this.emit('jobRetried', job);
      
      return job;
    } catch (error) {
      logger.error(`❌ Failed to retry job ${jobId}:`, error);
      throw error;
    }
  }

  async getNextJob(queueName: string): Promise<IJob | null> {
    try {
      // First, check for delayed jobs that are ready
      await this.processDelayedJobs();

      // Find the next pending job with highest priority
      const job = await Job.findOneAndUpdate(
        {
          queueName,
          status: JobStatus.PENDING,
        },
        {
          $set: {
            status: JobStatus.PROCESSING,
            processedAt: new Date(),
          },
        },
        {
          sort: { priority: -1, createdAt: 1 },
          new: true,
        }
      );

      if (job) {
        logger.debug(`🎯 Next job acquired: ${job.jobId}`);
        this.emit('jobStarted', job);
      }

      return job;
    } catch (error) {
      logger.error(`❌ Failed to get next job from queue ${queueName}:`, error);
      throw error;
    }
  }

  private async processDelayedJobs(): Promise<void> {
    try {
      const now = new Date();
      await Job.updateMany(
        {
          status: JobStatus.DELAYED,
          nextRetryAt: { $lte: now },
        },
        {
          $set: {
            status: JobStatus.PENDING,
            nextRetryAt: undefined,
          },
        }
      );
    } catch (error) {
      logger.error('❌ Failed to process delayed jobs:', error);
    }
  }

  private async ensureQueue(queueName: string): Promise<IQueue> {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = await this.createQueue(queueName);
    }
    return queue;
  }

  private startPolling(): void {
    const pollInterval = parseInt(process.env.QUEUE_POLL_INTERVAL || '1000');
    
    this.pollInterval = setInterval(async () => {
      try {
        await this.processDelayedJobs();
      } catch (error) {
        logger.error('❌ Error in queue polling:', error);
      }
    }, pollInterval);

    logger.info(`🔄 Started queue polling with ${pollInterval}ms interval`);
  }

  async close(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.queues.clear();
    this.removeAllListeners();
    
    logger.info('✅ Queue Manager closed');
  }

  getQueues(): string[] {
    return Array.from(this.queues.keys());
  }
}

export const queueManager = new QueueManager();