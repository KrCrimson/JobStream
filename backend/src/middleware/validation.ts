import { body, param, query, ValidationChain } from 'express-validator';
import { JobType, JobPriority, JobStatus } from '../types';

export const validateCreateQueue: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Queue name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Queue name must be between 3 and 50 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('concurrency').optional().isInt({ min: 1, max: 100 }),
];

export const validateCreateJob: ValidationChain[] = [
  body('queueName').trim().notEmpty().withMessage('Queue name is required'),
  body('type')
    .isIn(Object.values(JobType))
    .withMessage('Invalid job type'),
  body('data').notEmpty().withMessage('Job data is required'),
  body('priority')
    .optional()
    .isIn(Object.values(JobPriority).filter(v => typeof v === 'number')),
];

export const validateGetJobs: ValidationChain[] = [
  query('queueName').optional().trim(),
  query('status').optional().isIn(Object.values(JobStatus)),
  query('type').optional().isIn(Object.values(JobType)),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const validateJobId: ValidationChain[] = [
  param('jobId').notEmpty().withMessage('Job ID is required'),
];

export const validateQueueId: ValidationChain[] = [
  param('queueId').isMongoId().withMessage('Invalid queue ID'),
];

export const validateLogin: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateRegister: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];
