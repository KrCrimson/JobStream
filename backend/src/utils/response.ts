import { IApiResponse } from '../types';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public stack = ''
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const successResponse = <T>(
  data: T,
  message?: string,
  meta?: any
): IApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    meta,
  };
};

export const errorResponse = (error: string, message?: string): IApiResponse => {
  return {
    success: false,
    error,
    message,
  };
};

export const paginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): IApiResponse<T[]> => {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
