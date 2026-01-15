import { io, Socket } from 'socket.io-client';
import { authService } from './authService';

class SocketService {
  private socket: Socket | null = null;
  
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }
    
    const token = authService.getToken();
    
    this.socket = io('http://localhost:5000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    return this.socket;
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  getSocket(): Socket | null {
    return this.socket;
  }
  
  subscribeToQueue(queueName: string): void {
    this.socket?.emit('subscribe:queue', queueName);
  }
  
  unsubscribeFromQueue(queueName: string): void {
    this.socket?.emit('unsubscribe:queue', queueName);
  }
  
  subscribeToJob(jobId: string): void {
    this.socket?.emit('subscribe:job', jobId);
  }
  
  unsubscribeFromJob(jobId: string): void {
    this.socket?.emit('unsubscribe:job', jobId);
  }
  
  subscribeToWorkers(): void {
    this.socket?.emit('subscribe:workers');
  }
  
  requestMetrics(): void {
    this.socket?.emit('request:metrics');
  }
  
  onJobCreated(callback: (job: any) => void): void {
    this.socket?.on('job:created', callback);
  }
  
  onJobUpdated(callback: (job: any) => void): void {
    this.socket?.on('job:updated', callback);
  }
  
  onJobProgress(callback: (data: { jobId: string; progress: number }) => void): void {
    this.socket?.on('job:progress', callback);
  }
  
  onJobCompleted(callback: (data: { jobId: string; result: any }) => void): void {
    this.socket?.on('job:completed', callback);
  }
  
  onJobFailed(callback: (data: { jobId: string; error: string }) => void): void {
    this.socket?.on('job:failed', callback);
  }
  
  onQueueMetrics(callback: (metrics: any) => void): void {
    this.socket?.on('queue:metrics', callback);
  }
  
  onQueueStatusChanged(callback: (data: { queueName: string; status: string }) => void): void {
    this.socket?.on('queue:status', callback);
  }
  
  onWorkerStatusChanged(callback: (data: { workerId: string; status: string }) => void): void {
    this.socket?.on('worker:status', callback);
  }
  
  onWorkerMetrics(callback: (data: { workerId: string; metrics: any }) => void): void {
    this.socket?.on('worker:metrics', callback);
  }
  
  onSystemMetrics(callback: (metrics: any) => void): void {
    this.socket?.on('system:metrics', callback);
  }
  
  onSystemAlert(callback: (alert: { type: string; message: string; severity: string }) => void): void {
    this.socket?.on('system:alert', callback);
  }
  
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export const socketService = new SocketService();
