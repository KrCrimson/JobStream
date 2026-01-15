import { Request, Response, NextFunction } from 'express';
import { ApiError, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

// AppError class for backward compatibility
export class AppError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    logger.error(`API Error: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    logger.error('Validation error:', err.message);
    res.status(400).json(errorResponse('Validation failed', err.message));
    return;
  }
  
  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    logger.error('Duplicate key error:', err.message);
    res.status(400).json(errorResponse('Duplicate value', 'Resource already exists'));
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.error('JWT error:', err.message);
    res.status(401).json(errorResponse('Invalid token'));
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    logger.error('Token expired:', err.message);
    res.status(401).json(errorResponse('Token expired'));
    return;
  }
  
  // Generic error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(500).json(errorResponse('Internal server error', err.message));
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Route ${req.originalUrl} not found`));
};
