import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { AuthService } from '../services/AuthService';

export class WebSocketServer {
  private io: Server;
  private authService: AuthService;
  
  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
    
    this.authService = new AuthService();
    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket server initialized');
  }
  
  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }
        
        const decoded = this.authService.verifyToken(token);
        (socket as any).user = decoded;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      logger.info(`Client connected: ${socket.id} (User: ${user.email})`);
      
      // Join user-specific room
      socket.join(`user:${user.userId}`);
      
      // Subscribe to queue updates
      socket.on('subscribe:queue', (queueName: string) => {
        socket.join(`queue:${queueName}`);
        logger.info(`Client ${socket.id} subscribed to queue: ${queueName}`);
      });
      
      // Unsubscribe from queue updates
      socket.on('unsubscribe:queue', (queueName: string) => {
        socket.leave(`queue:${queueName}`);
        logger.info(`Client ${socket.id} unsubscribed from queue: ${queueName}`);
      });
      
      // Subscribe to job updates
      socket.on('subscribe:job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        logger.info(`Client ${socket.id} subscribed to job: ${jobId}`);
      });
      
      // Unsubscribe from job updates
      socket.on('unsubscribe:job', (jobId: string) => {
        socket.leave(`job:${jobId}`);
        logger.info(`Client ${socket.id} unsubscribed from job: ${jobId}`);
      });
      
      // Subscribe to worker updates
      socket.on('subscribe:workers', () => {
        socket.join('workers');
        logger.info(`Client ${socket.id} subscribed to workers`);
      });
      
      // Request current metrics
      socket.on('request:metrics', () => {
        // This would be handled by emitting current metrics
        logger.info(`Client ${socket.id} requested metrics`);
      });
      
      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
      
      // Error handling
      socket.on('error', (error: Error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }
  
  // Emit job events
  public emitJobCreated(queueName: string, job: any): void {
    this.io.to(`queue:${queueName}`).emit('job:created', job);
  }
  
  public emitJobUpdated(jobId: string, queueName: string, job: any): void {
    this.io.to(`job:${jobId}`).to(`queue:${queueName}`).emit('job:updated', job);
  }
  
  public emitJobProgress(jobId: string, queueName: string, progress: number): void {
    this.io.to(`job:${jobId}`).to(`queue:${queueName}`).emit('job:progress', {
      jobId,
      progress,
    });
  }
  
  public emitJobCompleted(jobId: string, queueName: string, result: any): void {
    this.io.to(`job:${jobId}`).to(`queue:${queueName}`).emit('job:completed', {
      jobId,
      result,
    });
  }
  
  public emitJobFailed(jobId: string, queueName: string, error: string): void {
    this.io.to(`job:${jobId}`).to(`queue:${queueName}`).emit('job:failed', {
      jobId,
      error,
    });
  }
  
  // Emit queue events
  public emitQueueMetrics(queueName: string, metrics: any): void {
    this.io.to(`queue:${queueName}`).emit('queue:metrics', metrics);
  }
  
  public emitQueueStatusChanged(queueName: string, status: string): void {
    this.io.emit('queue:status', { queueName, status });
  }
  
  // Emit worker events
  public emitWorkerStatusChanged(workerId: string, status: string): void {
    this.io.to('workers').emit('worker:status', { workerId, status });
  }
  
  public emitWorkerMetrics(workerId: string, metrics: any): void {
    this.io.to('workers').emit('worker:metrics', { workerId, metrics });
  }
  
  // Emit system events
  public emitSystemMetrics(metrics: any): void {
    this.io.emit('system:metrics', metrics);
  }
  
  public emitSystemAlert(alert: { type: string; message: string; severity: string }): void {
    this.io.emit('system:alert', alert);
  }
  
  // Get IO instance for external use
  public getIO(): Server {
    return this.io;
  }
}

export let wsServer: WebSocketServer | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): WebSocketServer => {
  wsServer = new WebSocketServer(httpServer);
  return wsServer;
};

export const getWebSocketServer = (): WebSocketServer | null => {
  return wsServer;
};
