import mongoose, { Document, Schema } from 'mongoose';
import { TurnStatus, TurnPriority } from '../types';

export interface ITurn extends Document {
  turnNumber: string; // CA001, FA001, etc.
  serviceAreaCode: string; // CA, FA, etc.
  serviceAreaName: string; // Caja, Farmacia, etc.
  status: TurnStatus;
  priority: TurnPriority;
  
  // Información del cliente (opcional según configuración)
  customerData?: {
    idNumber?: string;
    name?: string;
    lastName?: string;
    phone?: string;
    isPriority?: boolean;
    priorityType?: 'pregnant' | 'elderly' | 'disabled' | 'other';
  };
  
  // Tiempos
  createdAt: Date;
  calledAt?: Date;
  attendedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Información de atención
  workerName?: string;
  workerId?: string;
  windowNumber?: number; // Ventanilla o caja número
  
  // Estimaciones
  estimatedWaitTime?: number; // en minutos
  actualWaitTime?: number; // en minutos
  serviceDuration?: number; // en minutos
  
  // Observaciones
  notes?: string;
  cancellationReason?: string;
  
  // Notificaciones
  notificationsSent: {
    sms?: boolean;
    email?: boolean;
    display?: boolean;
  };
  
  isActive: boolean;
  
  // Métodos
  calculateCurrentWaitTime(): number;
}

// Interface para el modelo estático
export interface ITurnModel extends mongoose.Model<ITurn> {
  generateTurnNumber(serviceAreaCode: string): Promise<string>;
}

const turnSchema = new Schema<ITurn>(
  {
    turnNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    serviceAreaCode: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 5,
      index: true,
    },
    serviceAreaName: {
      type: String,
      required: true,
      maxlength: 50,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TurnStatus),
      default: TurnStatus.WAITING,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TurnPriority),
      default: TurnPriority.NORMAL,
      required: true,
      index: true,
    },
    
    // Información del cliente
    customerData: {
      idNumber: String,
      name: String,
      lastName: String,
      phone: String,
      isPriority: Boolean,
      priorityType: {
        type: String,
        enum: ['pregnant', 'elderly', 'disabled', 'other'],
      },
    },
    
    // Tiempos
    calledAt: Date,
    attendedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    
    // Información de atención
    workerName: {
      type: String,
      maxlength: 100,
    },
    workerId: {
      type: String,
      index: true,
    },
    windowNumber: {
      type: Number,
      min: 1,
      max: 99,
    },
    
    // Estimaciones
    estimatedWaitTime: {
      type: Number,
      min: 0,
      max: 480, // 8 horas máximo
    },
    actualWaitTime: {
      type: Number,
      min: 0,
    },
    serviceDuration: {
      type: Number,
      min: 0,
    },
    
    // Observaciones
    notes: {
      type: String,
      maxlength: 500,
    },
    cancellationReason: {
      type: String,
      maxlength: 200,
    },
    
    // Notificaciones
    notificationsSent: {
      sms: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: false,
      },
      display: {
        type: Boolean,
        default: false,
      },
    },
    
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos
turnSchema.index({ serviceAreaCode: 1, status: 1, priority: -1, createdAt: 1 });
turnSchema.index({ status: 1, createdAt: 1 });
turnSchema.index({ workerId: 1, status: 1 });
turnSchema.index({ createdAt: -1 });
turnSchema.index({ 'customerData.idNumber': 1 });

// Método para calcular tiempo de espera actual
turnSchema.methods.calculateCurrentWaitTime = function() {
  if (this.attendedAt) {
    return Math.round((this.attendedAt.getTime() - this.createdAt.getTime()) / (1000 * 60));
  }
  return Math.round((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60));
};

// Método estático para generar número de turno
turnSchema.statics.generateTurnNumber = async function(serviceAreaCode: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const count = await this.countDocuments({
    serviceAreaCode,
    createdAt: {
      $gte: today,
      $lt: tomorrow,
    },
  });
  
  // Valores por defecto
  let prefix = serviceAreaCode;
  let numberLength = 3;
  
  // Intentar obtener configuración sin lanzar errores
  try {
    const SystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig');
    const config = await SystemConfig.findOne().lean().exec() as any;
    
    if (config?.ticketFormat) {
      if (config.ticketFormat.useAreaCode === false && config.ticketFormat.prefix) {
        prefix = config.ticketFormat.prefix;
      }
      if (config.ticketFormat.numberLength && config.ticketFormat.numberLength > 0) {
        numberLength = config.ticketFormat.numberLength;
      }
    }
  } catch (error) {
    console.log('Usando configuración por defecto para generar turno');
  }
  
  const number = (count + 1).toString().padStart(numberLength, '0');
  return `${prefix}${number}`;
};

export const Turn = mongoose.model<ITurn, ITurnModel>('Turn', turnSchema);