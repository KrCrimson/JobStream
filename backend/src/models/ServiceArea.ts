import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceArea extends Document {
  name: string; // Nombre del área (ej: "Caja")
  code: string; // Siglas (ej: "CA")
  description?: string;
  isActive: boolean;
  color?: string; // Color para la pantalla de llamadas
  estimatedTimePerTurn: number; // Tiempo promedio en minutos
  maxConcurrentTurns: number; // Máximo turnos siendo atendidos
  workingHours: {
    monday: { start: string; end: string; isOpen: boolean };
    tuesday: { start: string; end: string; isOpen: boolean };
    wednesday: { start: string; end: string; isOpen: boolean };
    thursday: { start: string; end: string; isOpen: boolean };
    friday: { start: string; end: string; isOpen: boolean };
    saturday: { start: string; end: string; isOpen: boolean };
    sunday: { start: string; end: string; isOpen: boolean };
  };
  settings: {
    allowPriority: boolean;
    requireCustomerInfo: boolean;
    autoCall: boolean; // Llamar automáticamente al siguiente
    maxTurnsPerDay: number;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Método
  isOpen(day: string): boolean;
}

const serviceAreaSchema = new Schema<IServiceArea>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 2,
      maxlength: 4,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    color: {
      type: String,
      default: '#007bff',
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    estimatedTimePerTurn: {
      type: Number,
      default: 5,
      min: 1,
      max: 60,
    },
    maxConcurrentTurns: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    workingHours: {
      monday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
      },
      tuesday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
      },
      wednesday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
      },
      thursday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
      },
      friday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
      },
      saturday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '12:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: false,
        },
      },
      sunday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '12:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        isOpen: {
          type: Boolean,
          default: false,
        },
      },
    },
    settings: {
      allowPriority: {
        type: Boolean,
        default: true,
      },
      requireCustomerInfo: {
        type: Boolean,
        default: false,
      },
      autoCall: {
        type: Boolean,
        default: false,
      },
      maxTurnsPerDay: {
        type: Number,
        default: 999,
        min: 1,
        max: 9999,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices
serviceAreaSchema.index({ name: 1 });
serviceAreaSchema.index({ code: 1 });
serviceAreaSchema.index({ isActive: 1 });

// Método para verificar si está abierto en un día específico
serviceAreaSchema.methods.isOpen = function(day: string) {
  const schedule = this.workingHours[day];
  if (!schedule || !schedule.isOpen) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = schedule.start.split(':').map(Number);
  const [endHour, endMin] = schedule.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
};

export const ServiceArea = mongoose.model<IServiceArea>('ServiceArea', serviceAreaSchema);