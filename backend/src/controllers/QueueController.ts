import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services/QueueService';
import { successResponse, paginatedResponse } from '../utils/response';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/response';

const queueService = new QueueService();

export class QueueController {
  async createQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed');
      }
      
      const queue = await queueService.createQueue(req.body);
      
      res.status(201).json(successResponse(queue, 'Queue created successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async getQueues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive, page, limit } = req.query;
      
      const { queues, total } = await queueService.getAllQueues({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(
        paginatedResponse(
          queues,
          parseInt(page as string) || 1,
          parseInt(limit as string) || 10,
          total
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queue = await queueService.getQueueById(req.params.queueId);
      
      res.json(successResponse(queue));
    } catch (error) {
      next(error);
    }
  }
  
  async updateQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queue = await queueService.updateQueue(req.params.queueId, req.body);
      
      res.json(successResponse(queue, 'Queue updated successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async deleteQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await queueService.deleteQueue(req.params.queueId);
      
      res.json(successResponse(null, 'Queue deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async pauseQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queue = await queueService.pauseQueue(req.params.queueId);
      
      res.json(successResponse(queue, 'Queue paused successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async resumeQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queue = await queueService.resumeQueue(req.params.queueId);
      
      res.json(successResponse(queue, 'Queue resumed successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async getQueueMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await queueService.getQueueMetrics(req.params.queueId);
      
      res.json(successResponse(metrics));
    } catch (error) {
      next(error);
    }
  }
  
  async getAllQueuesMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await queueService.getAllQueuesMetrics();
      
      res.json(successResponse(metrics));
    } catch (error) {
      next(error);
    }
  }
}
