import { queueManager } from '../queues/QueueManager';
import { JobService } from '../services/JobService';
import { WorkerService } from '../services/WorkerService';
import { IJob } from '../models/Job';
import { JobType } from '../types';
import { logger } from '../utils/logger';

interface ProcessJobResult {
  success: boolean;
  result?: any;
  error?: string;
  progress?: number;
}

class WorkerManager {
  private workers: Map<string, NodeJS.Timeout> = new Map();
  private workerService: WorkerService;
  private jobService: JobService;

  constructor() {
    this.workerService = new WorkerService();
    this.jobService = new JobService();
  }

  async initialize(): Promise<void> {
    try {
      // Create default workers for each queue
      const queueNames = ['default', 'high-priority', 'low-priority'];
      const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');

      for (const queueName of queueNames) {
        for (let i = 0; i < concurrency; i++) {
          const workerId = `${queueName}-worker-${Date.now()}${i}`;
          await this.createWorker(workerId, queueName);
        }
      }

      logger.info('✅ Worker Manager initialized with MongoDB workers');
    } catch (error) {
      logger.error('❌ Failed to initialize Worker Manager:', error);
      throw error;
    }
  }

  private async createWorker(workerId: string, queueName: string): Promise<void> {
    try {
      // Create worker record
      await this.workerService.createWorker({
        workerId,
        queueName,
        status: 'active',
        pid: process.pid,
        metadata: {
          startedAt: new Date(),
          processedJobs: 0,
        },
      });

      // Start worker loop
      const workerInterval = setInterval(async () => {
        await this.processNextJob(workerId, queueName);
      }, 1000);

      this.workers.set(workerId, workerInterval);
      logger.info(`👷 Worker created: ${workerId} for queue: ${queueName}`);

    } catch (error) {
      logger.error(`❌ Failed to create worker ${workerId}:`, error);
      throw error;
    }
  }

  private async processNextJob(workerId: string, queueName: string): Promise<void> {
    try {
      const job = await queueManager.getNextJob(queueName);
      
      if (!job) {
        return; // No jobs available
      }

      logger.info(`🔨 Worker ${workerId} processing job: ${job.jobId}`);

      // Update worker status
      await this.workerService.updateWorkerStatus(workerId, 'processing', {
        currentJobId: job.jobId,
        lastProcessedAt: new Date(),
      });

      // Process the job
      const result = await this.processJob(job);

      if (result.success) {
        await this.jobService.completeJob(job.jobId, result.result);
        logger.info(`✅ Job completed: ${job.jobId}`);
      } else {
        await this.handleJobFailure(job, result.error || 'Unknown error');
        logger.error(`❌ Job failed: ${job.jobId} - ${result.error}`);
      }

      // Update worker status back to active
      await this.workerService.updateWorkerStatus(workerId, 'active', {
        currentJobId: undefined,
        processedJobs: 1,
      });

    } catch (error) {
      logger.error(`❌ Worker ${workerId} error:`, error);
      
      // Update worker status to error
      await this.workerService.updateWorkerStatus(workerId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorAt: new Date(),
      });
    }
  }

  private async processJob(job: IJob): Promise<ProcessJobResult> {
    try {
      const timeout = parseInt(process.env.QUEUE_PROCESSING_TIMEOUT || '300000'); // 5 minutes
      
      const result = await Promise.race([
        this.executeJobByType(job),
        new Promise<ProcessJobResult>((_, reject) => 
          setTimeout(() => reject(new Error('Job execution timeout')), timeout)
        )
      ]);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeJobByType(job: IJob): Promise<ProcessJobResult> {
    switch (job.type) {
      case JobType.EMAIL:
        return await this.processEmailJob(job);
      
      case JobType.IMAGE_PROCESSING:
        return await this.processImageJob(job);
      
      case JobType.DATA_BACKUP:
        return await this.processBackupJob(job);
      
      case JobType.REPORT_GENERATION:
        return await this.processReportJob(job);
      
      case JobType.FILE_CONVERSION:
        return await this.processFileConversionJob(job);
      
      case JobType.WEBHOOK:
        return await this.processWebhookJob(job);
      
      default:
        throw new Error(`Unsupported job type: ${job.type}`);
    }
  }

  private async processEmailJob(job: IJob): Promise<ProcessJobResult> {
    const { to, subject, body: _body } = job.data;
    
    // Simulate email processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      result: {
        messageId: `msg_${Date.now()}`,
        sentAt: new Date(),
        to,
        subject,
      },
      progress: 100,
    };
  }

  private async processImageJob(job: IJob): Promise<ProcessJobResult> {
    const { imageUrl, operations } = job.data;
    
    // Simulate image processing with progress updates
    for (let progress = 0; progress <= 100; progress += 25) {
      await this.jobService.updateJobProgress(job.jobId, progress);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      success: true,
      result: {
        originalUrl: imageUrl,
        processedUrl: `${imageUrl}_processed`,
        operations,
        processedAt: new Date(),
      },
      progress: 100,
    };
  }

  private async processBackupJob(job: IJob): Promise<ProcessJobResult> {
    const { source, destination } = job.data;
    
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      result: {
        backupId: `backup_${Date.now()}`,
        source,
        destination,
        size: Math.floor(Math.random() * 1000000),
        completedAt: new Date(),
      },
      progress: 100,
    };
  }

  private async processReportJob(job: IJob): Promise<ProcessJobResult> {
    const { reportType, parameters } = job.data;
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    return {
      success: true,
      result: {
        reportId: `report_${Date.now()}`,
        type: reportType,
        parameters,
        fileUrl: `/reports/report_${Date.now()}.pdf`,
        generatedAt: new Date(),
      },
      progress: 100,
    };
  }

  private async processFileConversionJob(job: IJob): Promise<ProcessJobResult> {
    const { inputFile, outputFormat } = job.data;
    
    // Simulate file conversion
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    return {
      success: true,
      result: {
        conversionId: `conv_${Date.now()}`,
        inputFile,
        outputFormat,
        outputFile: `${inputFile}_converted.${outputFormat}`,
        convertedAt: new Date(),
      },
      progress: 100,
    };
  }

  private async processWebhookJob(job: IJob): Promise<ProcessJobResult> {
    const { url, method = 'POST' } = job.data;
    
    try {
      // Simulate webhook call (in real implementation, use fetch or axios)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        result: {
          webhookId: `webhook_${Date.now()}`,
          url,
          method,
          status: 200,
          sentAt: new Date(),
        },
        progress: 100,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook failed',
      };
    }
  }

  private async handleJobFailure(job: IJob, error: string): Promise<void> {
    const maxRetries = job.maxAttempts || 3;
    const currentAttempts = job.attempts + 1;

    if (currentAttempts < maxRetries) {
      // Retry job with exponential backoff
      const backoffDelay = parseInt(process.env.WORKER_BACKOFF_DELAY || '5000') * Math.pow(2, currentAttempts - 1);
      
      await this.jobService.retryJob(job.jobId, {
        error,
        retryAt: new Date(Date.now() + backoffDelay),
      });
      
      logger.info(`🔄 Job ${job.jobId} scheduled for retry (${currentAttempts}/${maxRetries}) in ${backoffDelay}ms`);
    } else {
      // Max retries reached, mark as failed
      await this.jobService.failJob(job.jobId, error);
      logger.error(`💀 Job ${job.jobId} failed permanently after ${maxRetries} attempts`);
    }
  }

  async close(): Promise<void> {
    // Stop all worker intervals
    for (const [workerId, interval] of this.workers.entries()) {
      clearInterval(interval);
      
      // Update worker status to stopped
      try {
        await this.workerService.updateWorkerStatus(workerId, 'stopped', {
          stoppedAt: new Date(),
        });
      } catch (error) {
        logger.error(`❌ Error updating worker ${workerId} status:`, error);
      }
    }

    this.workers.clear();
    
    logger.info('✅ All workers stopped');
  }

  getWorkerStats(): { total: number; active: number } {
    return {
      total: this.workers.size,
      active: this.workers.size, // All workers in map are considered active
    };
  }
}

export const workerManager = new WorkerManager();