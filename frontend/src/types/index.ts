export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

export enum JobType {
  EMAIL_SENDING = 'email_sending',
  IMAGE_PROCESSING = 'image_processing',
  DATA_BACKUP = 'data_backup',
  REPORT_GENERATION = 'report_generation',
  API_SYNC = 'api_sync',
  CLEANUP_TASKS = 'cleanup_tasks',
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer' | 'worker';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Queue {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  concurrency: number;
  rateLimit?: {
    max: number;
    duration: number;
  };
  defaultJobOptions: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    timeout?: number;
  };
  metrics: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
  };
  createdAt: string;
  updatedAt: string;
  bullMetrics?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
}

export interface Job {
  _id: string;
  jobId: string;
  queueId: string;
  queueName: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  data: any;
  result?: any;
  progress: number;
  error?: string;
  stackTrace?: string;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  nextRetryAt?: string;
  dependsOn: string[];
  webhookUrl?: string;
  metadata: {
    startedBy?: string;
    tags?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  _id: string;
  workerId: string;
  queueName: string;
  status: 'active' | 'idle' | 'error' | 'stopped';
  currentJobId?: string;
  concurrency: number;
  metrics: {
    jobsProcessed: number;
    jobsFailed: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
  };
  health: {
    lastHeartbeat: string;
    cpuUsage?: number;
    memoryUsage?: number;
    errors: string[];
  };
  startedAt: string;
  stoppedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface DashboardStats {
  queues: {
    total: number;
    active: number;
  };
  jobs: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  workers: {
    total: number;
    active: number;
    idle: number;
  };
}
