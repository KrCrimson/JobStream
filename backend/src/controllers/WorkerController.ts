import { Request, Response, NextFunction } from 'express';
import { WorkerService } from '../services/WorkerService';
import { successResponse, paginatedResponse } from '../utils/response';

const workerService = new WorkerService();

export class WorkerController {
  async getWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { queueName, status, page, limit } = req.query;
      
      const { workers, total } = await workerService.getAllWorkers({
        queueName: queueName as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(
        paginatedResponse(
          workers,
          parseInt(page as string) || 1,
          parseInt(limit as string) || 20,
          total
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  async getWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const worker = await workerService.getWorkerById(req.params.workerId);
      
      res.json(successResponse(worker));
    } catch (error) {
      next(error);
    }
  }
  
  async getWorkerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { queueName } = req.query;
      
      const stats = await workerService.getWorkerStats(queueName as string);
      
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }
  
  async updateWorkerHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cpuUsage, memoryUsage, errors } = req.body;
      
      await workerService.updateWorkerHealth(req.params.workerId, {
        cpuUsage,
        memoryUsage,
        errors,
      });
      
      res.json(successResponse(null, 'Worker health updated'));
    } catch (error) {
      next(error);
    }
  }
  
  async cleanupStaleWorkers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await workerService.cleanupStaleWorkers();
      
      res.json(successResponse({ cleanedUp: count }, 'Stale workers cleaned up'));
    } catch (error) {
      next(error);
    }
  }
}
