import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { initializeWebSocket } from './websockets';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { queueManager } from './queues/QueueManager';
import { TurnCleanupService } from './services/TurnCleanupService';
// import { workerManager } from './workers/WorkerManagerMongo';

// Load environment variables
dotenv.config();

class Server {
  private app: Application;
  private httpServer: http.Server;
  private port: number;
  
  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.port = parseInt(process.env.PORT || '5000');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  private setupMiddleware(): void {
    // Trust proxy for Render deployment
    this.app.set('trust proxy', 1);
    
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      })
    );
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Rate limiting
    this.app.use('/api', apiLimiter);
    
    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
    
    // API routes
    this.app.use('/api/v1', routes);
    
    // 404 handler
    this.app.use(notFound);
  }
  
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
    
    // Unhandled rejection
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      this.shutdown();
    });
    
    // Uncaught exception
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown();
    });
    
    // SIGTERM signal
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.shutdown();
    });
    
    // SIGINT signal
    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.shutdown();
    });
  }
  
  private async initializeServices(): Promise<void> {
    try {
      // Connect to MongoDB
      await connectDatabase();
      
      // Initialize Queue Manager
      await queueManager.initialize();
      
      // Initialize Worker Manager
      // await workerManager.initialize(); // Commented out - not needed for turn system
      
      // Initialize Turn Cleanup Service (limpieza automática a medianoche)
      TurnCleanupService.start();
      
      // Initialize WebSocket
      initializeWebSocket(this.httpServer);
      
      // Initialize default queues
      await this.initializeDefaultQueues();
      
      logger.info('✅ All services initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }
  
  private async initializeDefaultQueues(): Promise<void> {
    const defaultQueues = [
      'default',
      'high-priority', 
      'low-priority',
    ];
    
    for (const queueName of defaultQueues) {
      try {
        await queueManager.createQueue(queueName);
        logger.info(`✅ Initialized queue: ${queueName}`);
      } catch (error) {
        logger.error(`❌ Failed to initialize queue ${queueName}:`, error);
      }
    }
  }
  
  public async start(): Promise<void> {
    try {
      await this.initializeServices();
      
      this.httpServer.listen(this.port, () => {
        logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 JobStream Queue System Server                       ║
║                                                           ║
║   Port:        ${this.port}                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   API:         http://localhost:${this.port}/api/v1            ║
║   Health:      http://localhost:${this.port}/health            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
  
  private async shutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');
    
    try {
      // Stop accepting new connections
      this.httpServer.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close all workers
      // await workerManager.close(); // Commented out - not needed for turn system
      
      // Close all queues
      await queueManager.close();
      
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start();
