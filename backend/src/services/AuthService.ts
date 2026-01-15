import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/response';
import { logger } from '../utils/logger';
import { IJWTPayload } from '../types';

export class AuthService {
  private jwtSecret: string;
  private jwtExpire: string;
  
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpire = process.env.JWT_EXPIRE || '7d';
    
    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables, using default');
    }
  }
  
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'worker' | 'viewer';
    workerId?: string;
  }): Promise<{ user: IUser; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
      }
      
      // Create user
      const user = await User.create({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || 'worker',
        workerId: data.workerId,
      });
      
      // Generate token
      const token = this.generateToken(user);
      
      logger.info(`User registered: ${user.email}`);
      
      return { user, token };
    } catch (error: any) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }
  
  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    try {
      // Find user
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }
      
      if (!user.isActive) {
        throw new ApiError(403, 'Account is deactivated');
      }
      
      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
      }
      
      // Generate token
      const token = this.generateToken(user);
      
      logger.info(`User logged in: ${user.email}`);
      
      return { user, token };
    } catch (error: any) {
      logger.error('Error logging in:', error);
      throw error;
    }
  }
  
  generateToken(user: IUser): string {
    const payload: IJWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      workerId: user.workerId?.toString(),
      id: user._id.toString()
    };
    
    const options: SignOptions = {
      expiresIn: this.jwtExpire as any,
    };
    
    return jwt.sign(payload, this.jwtSecret, options);
  }
  
  verifyToken(token: string): IJWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as IJWTPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token');
    }
  }
  
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    return user;
  }
  
  async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser> {
    // Don't allow password update through this method
    delete (updates as any).password;
    
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    return user;
  }
  
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    
    user.password = newPassword;
    await user.save();
    
    logger.info(`Password changed for user: ${user.email}`);
  }
}
