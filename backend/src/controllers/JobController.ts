import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/JobService';
import { successResponse, paginatedResponse } from '../utils/response';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/response';
import { JobStatus, JobType } from '../types';

const jobService = new JobService();

export class JobController {
  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed');
      }
      
      const job = await jobService.createJob({
        ...req.body,
        metadata: {
          ...req.body.metadata,
          startedBy: req.user?.userId,
        },
      });
      
      res.status(201).json(successResponse(job, 'Job created successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { queueName, status, type, page, limit } = req.query;
      
      const { jobs, total } = await jobService.getAllJobs({
        queueName: queueName as string,
        status: status as JobStatus,
        type: type as JobType,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(
        paginatedResponse(
          jobs,
          parseInt(page as string) || 1,
          parseInt(limit as string) || 20,
          total
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobService.getJobById(req.params.jobId);
      
      res.json(successResponse(job));
    } catch (error) {
      next(error);
    }
  }
  
  async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobService.retryJob(req.params.jobId);
      
      res.json(successResponse(job, 'Job retry initiated'));
    } catch (error) {
      next(error);
    }
  }
  
  async cancelJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobService.cancelJob(req.params.jobId);
      
      res.json(successResponse(job, 'Job cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await jobService.deleteJob(req.params.jobId);
      
      res.json(successResponse(null, 'Job deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async bulkRetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { queueName, type } = req.body;
      
      const result = await jobService.bulkRetry({ queueName, type });
      
      res.json(successResponse(result, 'Bulk retry initiated'));
    } catch (error) {
      next(error);
    }
  }
  
  async getJobStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { queueName } = req.query;
      
      const stats = await jobService.getJobStats(queueName as string);
      
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }
}
