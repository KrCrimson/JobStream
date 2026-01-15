import { Worker, IWorker } from '../models/Worker';
import { IJob } from '../models/Job';
import { ApiError } from '../utils/response';
import { logger } from '../utils/logger';

export class WorkerService {
  async registerWorker(
    workerId: string,
    queueName: string,
    concurrency: number
  ): Promise<IWorker> {
    try {
      const worker = await Worker.create({
        workerId,
        queueName,
        concurrency,
        status: 'idle',
      });
      
      logger.info(`Worker registered: ${workerId}`);
      
      return worker;
    } catch (error: any) {
      logger.error('Error registering worker:', error);
      throw error;
    }
  }
  
  async getWorkerById(workerId: string): Promise<IWorker> {
    const worker = await Worker.findOne({ workerId });
    
    if (!worker) {
      throw new ApiError(404, 'Worker not found');
    }
    
    return worker;
  }
  
  async getAllWorkers(filters: {
    queueName?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ workers: IWorker[]; total: number }> {
    const { queueName, status, page = 1, limit = 20 } = filters;
    
    const query: any = {};
    if (queueName) query.queueName = queueName;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [workers, total] = await Promise.all([
      Worker.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Worker.countDocuments(query),
    ]);
    
    return { workers, total };
  }
  
  async setWorkerActive(workerId: string, jobId: string): Promise<void> {
    await Worker.findOneAndUpdate(
      { workerId },
      {
        status: 'active',
        currentJobId: jobId,
        'health.lastHeartbeat': new Date(),
      }
    );
  }
  
  async setWorkerIdle(workerId: string): Promise<void> {
    await Worker.findOneAndUpdate(
      { workerId },
      {
        status: 'idle',
        currentJobId: undefined,
        'health.lastHeartbeat': new Date(),
      }
    );
  }
  
  async updateWorkerMetrics(
    workerId: string,
    outcome: 'completed' | 'failed',
    job: IJob
  ): Promise<void> {
    const worker = await Worker.findOne({ workerId });
    
    if (!worker) return;
    
    const processingTime = job.completedAt && job.processedAt
      ? job.completedAt.getTime() - job.processedAt.getTime()
      : 0;
    
    if (outcome === 'completed') {
      worker.stats.turnsAttendedTotal += 1;
      worker.stats.turnsAttendedToday += 1;
    }
    
    // Actualizar tiempo promedio de atención
    if (processingTime > 0) {
      const totalTurns = worker.stats.turnsAttendedTotal;
      worker.stats.averageServiceTime = 
        (worker.stats.averageServiceTime * (totalTurns - 1) + processingTime) / totalTurns;
    }
    
    worker.isAvailable = true;
    worker.stats.lastActivity = new Date();
    
    await worker.save();
  }
  
  async updateWorkerHealth(
    workerId: string,
    health: {
      cpuUsage?: number;
      memoryUsage?: number;
      errors?: string[];
    }
  ): Promise<void> {
    const update: any = {
      'health.lastHeartbeat': new Date(),
    };
    
    if (health.cpuUsage !== undefined) {
      update['health.cpuUsage'] = health.cpuUsage;
    }
    
    if (health.memoryUsage !== undefined) {
      update['health.memoryUsage'] = health.memoryUsage;
    }
    
    if (health.errors && health.errors.length > 0) {
      update.$push = { 'health.errors': { $each: health.errors, $slice: -10 } };
    }
    
    await Worker.findOneAndUpdate({ workerId }, update);
  }
  
  async stopWorker(workerId: string): Promise<void> {
    await Worker.findOneAndUpdate(
      { workerId },
      {
        status: 'stopped',
        stoppedAt: new Date(),
      }
    );
    
    logger.info(`Worker stopped: ${workerId}`);
  }
  
  async getWorkerStats(queueName?: string) {
    const query: any = {};
    if (queueName) query.queueName = queueName;
    
    const [total, active, idle, error, stopped] = await Promise.all([
      Worker.countDocuments(query),
      Worker.countDocuments({ ...query, status: 'active' }),
      Worker.countDocuments({ ...query, status: 'idle' }),
      Worker.countDocuments({ ...query, status: 'error' }),
      Worker.countDocuments({ ...query, status: 'stopped' }),
    ]);
    
    return {
      total,
      active,
      idle,
      error,
      stopped,
    };
  }
  
  async cleanupStaleWorkers(timeoutMinutes: number = 10): Promise<number> {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const staleWorkers = await Worker.find({
      status: { $in: ['active', 'idle'] },
      'health.lastHeartbeat': { $lt: timeoutDate },
    });
    
    for (const worker of staleWorkers) {
      worker.isAvailable = false;
      logger.warn(`Worker stale - no activity since ${worker.stats.lastActivity}`, {
        workerId: worker._id,
        lastActivity: worker.stats.lastActivity
      });
      await worker.save();
    }
    
    logger.info(`Cleaned up ${staleWorkers.length} stale workers`);
    
    return staleWorkers.length;
  }

  async createWorker(data: {
    workerId: string;
    queueName: string;
    status: string;
    pid?: number;
    metadata: any;
  }): Promise<IWorker> {
    try {
      const worker = new Worker({
        workerId: data.workerId,
        queueName: data.queueName,
        concurrency: 1,
        status: data.status,
        processId: data.pid,
        health: {
          lastHeartbeat: new Date(),
          memoryUsage: 0,
          cpuUsage: 0,
          errors: [],
        },
        ...data.metadata,
      });

      await worker.save();
      logger.info(`✅ Worker created: ${data.workerId}`);
      return worker;
    } catch (error) {
      logger.error(`❌ Failed to create worker ${data.workerId}:`, error);
      throw error;
    }
  }

  async updateWorkerStatus(workerId: string, status: string, metadata?: any): Promise<IWorker | null> {
    try {
      const worker = await Worker.findOneAndUpdate(
        { workerId },
        {
          $set: {
            status,
            'health.lastHeartbeat': new Date(),
            ...metadata,
          },
        },
        { new: true }
      );

      if (!worker) {
        logger.warn(`❌ Worker not found for status update: ${workerId}`);
        return null;
      }

      return worker;
    } catch (error) {
      logger.error(`❌ Failed to update worker status ${workerId}:`, error);
      throw error;
    }
  }
}
