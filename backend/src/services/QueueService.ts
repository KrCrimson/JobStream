import { Queue, IQueue } from '../models/Queue';
import { ApiError } from '../utils/response';
import { queueManager } from '../queues/QueueManager';
import { logger } from '../utils/logger';

export class QueueService {
  async createQueue(data: {
    name: string;
    description?: string;
    concurrency?: number;
    rateLimit?: { max: number; duration: number };
    defaultJobOptions?: any;
  }): Promise<IQueue> {
    try {
      // Check if queue already exists
      const existingQueue = await Queue.findOne({ name: data.name });
      if (existingQueue) {
        throw new ApiError(400, `Queue with name ${data.name} already exists`);
      }
      
      // Create queue in MongoDB
      const queue = await Queue.create(data);
      
      // Create queue in QueueManager
      await queueManager.createQueue(data.name);
      
      logger.info(`Queue created: ${data.name}`);
      
      return queue;
    } catch (error: any) {
      logger.error('Error creating queue:', error);
      throw error;
    }
  }
  
  async getQueueById(queueId: string): Promise<IQueue> {
    const queue = await Queue.findById(queueId);
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    return queue;
  }
  
  async getQueueByName(name: string): Promise<IQueue> {
    const queue = await Queue.findOne({ name });
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    return queue;
  }
  
  async getAllQueues(filters: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ queues: IQueue[]; total: number }> {
    const { isActive, page = 1, limit = 10 } = filters;
    
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    
    const skip = (page - 1) * limit;
    
    const [queues, total] = await Promise.all([
      Queue.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Queue.countDocuments(query),
    ]);
    
    return { queues, total };
  }
  
  async updateQueue(
    queueId: string,
    updates: Partial<IQueue>
  ): Promise<IQueue> {
    const queue = await Queue.findByIdAndUpdate(queueId, updates, {
      new: true,
      runValidators: true,
    });
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    logger.info(`Queue updated: ${queue.name}`);
    
    return queue;
  }
  
  async deleteQueue(queueId: string): Promise<void> {
    const queue = await Queue.findById(queueId);
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    // Delete from MongoDB
    await Queue.findByIdAndDelete(queueId);
    
    logger.info(`Queue deleted: ${queue.name}`);
  }
  
  async pauseQueue(queueId: string): Promise<IQueue> {
    const queue = await Queue.findById(queueId);
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    queue.isActive = false;
    await queue.save();
    
    logger.info(`Queue paused: ${queue.name}`);
    
    return queue;
  }
  
  async resumeQueue(queueId: string): Promise<IQueue> {
    const queue = await Queue.findById(queueId);
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    queue.isActive = true;
    await queue.save();
    
    logger.info(`Queue resumed: ${queue.name}`);
    
    return queue;
  }
  
  async getQueueMetrics(queueId: string) {
    const queue = await Queue.findById(queueId);
    
    if (!queue) {
      throw new ApiError(404, 'Queue not found');
    }
    
    const bullMetrics = await queueManager.getQueueMetrics(queue.name);
    
    return {
      ...queue.toObject(),
      bullMetrics,
    };
  }
  
  async getAllQueuesMetrics() {
    const queues = await Queue.find();
    
    const metricsPromises = queues.map(async (queue) => {
      const bullMetrics = await queueManager.getQueueMetrics(queue.name);
      return {
        ...queue.toObject(),
        bullMetrics,
      };
    });
    
    return Promise.all(metricsPromises);
  }
  
  async updateQueueMetrics(
    queueName: string,
    updates: {
      completedJobs?: number;
      failedJobs?: number;
      processingTime?: number;
    }
  ): Promise<void> {
    const queue = await Queue.findOne({ name: queueName });
    
    if (!queue) return;
    
    if (updates.completedJobs !== undefined) {
      queue.metrics.completedJobs += updates.completedJobs;
      queue.metrics.totalJobs += updates.completedJobs;
    }
    
    if (updates.failedJobs !== undefined) {
      queue.metrics.failedJobs += updates.failedJobs;
      queue.metrics.totalJobs += updates.failedJobs;
    }
    
    if (updates.processingTime !== undefined) {
      const totalJobs = queue.metrics.completedJobs + queue.metrics.failedJobs;
      queue.metrics.averageProcessingTime =
        (queue.metrics.averageProcessingTime * (totalJobs - 1) + updates.processingTime) /
        totalJobs;
    }
    
    await queue.save();
  }
}
