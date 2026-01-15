// --- SISTEMA DE TURNOS ---

export enum TurnStatus {
  WAITING = 'waiting',
  CALLED = 'called',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum TurnPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Áreas de atención (reemplaza JobType)
export enum ServiceArea {
  CAJA = 'caja',
  FARMACIA = 'farmacia', 
  INFORMACION = 'informacion',
  CONSULTA = 'consulta',
  TRAMITES = 'tramites',
  SERVICIO_CLIENTE = 'servicio_cliente',
}

// Configuración de impresión de turnos
export interface PrintConfig {
  requireCustomerInfo: boolean; // Si requiere buscar cliente en DB
  allowAnonymous: boolean; // Si permite impresión anónima
  maxTurnsPerCustomer: number; // Máximo turnos por cliente
  securityEnabled: boolean;
}

// Datos del cliente (opcional según configuración)
export interface CustomerData {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  isPriority?: boolean; // Embarazada, adulto mayor, etc.
}

// Datos del turno
export interface ITurnData {
  customerData?: CustomerData;
  serviceArea: ServiceArea;
  priority: TurnPriority;
  notes?: string;
  metadata?: any;
}

// Opciones del turno
export interface ITurnOptions {
  priority?: TurnPriority;
  customerData?: CustomerData;
  notes?: string;
}

// Información de progreso del turno
export interface ITurnProgress {
  status: TurnStatus;
  attendedBy?: string; // ID del trabajador
  calledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number; // minutos estimados
}

// --- COMPATIBILIDAD CON SISTEMA ORIGINAL ---

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DELAYED = 'delayed'
}

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum JobType {
  EMAIL = 'email',
  SMS = 'sms',
  DATA_PROCESSING = 'data_processing',
  FILE_UPLOAD = 'file_upload',
  REPORT_GENERATION = 'report_generation',
  IMAGE_PROCESSING = 'image_processing',
  BACKUP = 'backup',
  CLEANUP = 'cleanup',
  DATA_BACKUP = 'data_backup',
  FILE_CONVERSION = 'file_conversion',
  WEBHOOK = 'webhook',
  API_SYNC = 'api_sync',
  CLEANUP_TASKS = 'cleanup_tasks'
}

export interface IJobData {
  type: JobType;
  payload: any;
  priority?: JobPriority;
  attempts?: number;
  delay?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export interface IJobOptions {
  priority?: JobPriority;
  attempts?: number;
  delay?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  repeat?: {
    cron?: string;
    every?: number;
    limit?: number;
  };
}

export interface IJobResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface IWorkerMetrics {
  workerId: string;
  status: 'active' | 'idle' | 'error';
  jobsProcessed: number;
  jobsFailed: number;
  averageProcessingTime: number;
  lastJobAt?: Date;
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface IQueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface IUserRole {
  name: string;
  permissions: string[];
}

export interface IJWTPayload {
  userId: string;
  email: string;
  role: string;
  workerId?: string; // ID del Worker si el usuario es trabajador
  id: string; // Añadido para compatibilidad
}

export interface IApiResponse<T = any> {
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

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
