import mongoose, { Document, Schema } from 'mongoose';

export interface IWorker extends Document {
  name: string;
  lastName: string;
  employeeId: string; // ID del empleado
  username: string; // Usuario para login
  passwordHash: string; // Contraseña hasheada
  role: 'admin' | 'supervisor' | 'operator';
  
  // Áreas de servicio que puede atender
  serviceAreas: string[]; // ['CA', 'FA'] códigos de áreas
  
  // Configuración de trabajo
  isActive: boolean;
  isOnline: boolean; // Si está conectado al sistema
  isAvailable: boolean; // Si está disponible para atender
  
  // Información de ventanilla/caja
  windowNumber?: number; // Número de ventanilla asignada
  currentServiceArea?: string; // Área de servicio actual
  
  // Estadísticas
  stats: {
    turnsAttendedToday: number;
    turnsAttendedTotal: number;
    averageServiceTime: number; // en minutos
    customerSatisfactionScore: number; // 1-5
    lastActivity: Date;
  };
  
  // Configuración personal
  settings: {
    notifications: boolean;
    autoCallNext: boolean; // Llamar automáticamente al siguiente turno
    breakTimeMinutes: number; // Tiempo de descanso en minutos
    preferredServiceAreas: string[];
  };
  
  // Información de contacto
  email?: string;
  phone?: string;
  
  // Horarios de trabajo
  workSchedule: {
    monday: { start: string; end: string; isWorkDay: boolean };
    tuesday: { start: string; end: string; isWorkDay: boolean };
    wednesday: { start: string; end: string; isWorkDay: boolean };
    thursday: { start: string; end: string; isWorkDay: boolean };
    friday: { start: string; end: string; isWorkDay: boolean };
    saturday: { start: string; end: string; isWorkDay: boolean };
    sunday: { start: string; end: string; isWorkDay: boolean };
  };
  
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Virtual
  fullName: string;
  
  // Métodos
  isInWorkingHours(): boolean;
  resetDailyStats(): Promise<IWorker>;
}

const workerSchema = new Schema<IWorker>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'operator'],
      default: 'operator',
      required: true,
      index: true,
    },
    
    // Áreas de servicio
    serviceAreas: [{
      type: String,
      maxlength: 50,
    }],
    
    // Estado
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Información de ventanilla
    windowNumber: {
      type: Number,
      min: 1,
      max: 99,
    },
    currentServiceArea: {
      type: String,
      maxlength: 50,
    },
    
    // Estadísticas
    stats: {
      turnsAttendedToday: {
        type: Number,
        default: 0,
        min: 0,
      },
      turnsAttendedTotal: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageServiceTime: {
        type: Number,
        default: 0,
        min: 0,
      },
      customerSatisfactionScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      lastActivity: {
        type: Date,
        default: Date.now,
      },
    },
    
    // Configuración personal
    settings: {
      notifications: {
        type: Boolean,
        default: true,
      },
      autoCallNext: {
        type: Boolean,
        default: false,
      },
      breakTimeMinutes: {
        type: Number,
        default: 15,
        min: 5,
        max: 60,
      },
      preferredServiceAreas: [{
        type: String,
        maxlength: 50,
      }],
    },
    
    // Contacto
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      trim: true,
      match: /^[\+]?[0-9\s\-\(\)]{7,20}$/,
    },
    
    // Horarios
    workSchedule: {
      monday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "17:00" },
        isWorkDay: { type: Boolean, default: true },
      },
      tuesday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "17:00" },
        isWorkDay: { type: Boolean, default: true },
      },
      wednesday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "17:00" },
        isWorkDay: { type: Boolean, default: true },
      },
      thursday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "17:00" },
        isWorkDay: { type: Boolean, default: true },
      },
      friday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "17:00" },
        isWorkDay: { type: Boolean, default: true },
      },
      saturday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "12:00" },
        isWorkDay: { type: Boolean, default: false },
      },
      sunday: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "12:00" },
        isWorkDay: { type: Boolean, default: false },
      },
    },
    
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

// Índices
workerSchema.index({ role: 1, isActive: 1 });
workerSchema.index({ serviceAreas: 1, isActive: 1 });
workerSchema.index({ isOnline: 1, isAvailable: 1 });
workerSchema.index({ currentServiceArea: 1 });
workerSchema.index({ windowNumber: 1 });

// Virtual para nombre completo
workerSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.lastName}`;
});

// Método para verificar si está en horario de trabajo
workerSchema.methods.isInWorkingHours = function() {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()] as keyof typeof this.workSchedule;
  
  const schedule = this.workSchedule[today];
  if (!schedule.isWorkDay) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = schedule.start.split(':').map(Number);
  const [endHour, endMin] = schedule.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Método para resetear estadísticas diarias
workerSchema.methods.resetDailyStats = function() {
  this.stats.turnsAttendedToday = 0;
  return this.save();
};

export const Worker = mongoose.model<IWorker>('Worker', workerSchema);
