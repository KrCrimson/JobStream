import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { successResponse } from '../utils/response';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/response';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }
      
      const { email, password, name, role } = req.body;
      
      const result = await authService.register({ email, password, name, role });
      
      res.status(201).json(successResponse(result, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed');
      }
      
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      res.json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }
  
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }
      
      const user = await authService.getUserById(req.user.userId);
      
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }
  
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }
      
      const { name, email } = req.body;
      
      const user = await authService.updateUser(req.user.userId, { name, email });
      
      res.json(successResponse(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }
      
      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(req.user.userId, currentPassword, newPassword);
      
      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }
}
