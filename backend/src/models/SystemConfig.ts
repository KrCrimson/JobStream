import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
  // Modo de operación
  operationMode: 'single' | 'multiple'; // Una cola o múltiples colas
  
  // Validación de clientes
  requireCustomerValidation: boolean; // Si se requiere validar cliente
  validationType: 'dni' | 'phone' | 'email' | 'none'; // Tipo de validación
  
  // Configuración de tickets
  ticketFormat: {
    prefix: string; // Prefijo del ticket (ej: "A", "T")
    useAreaCode: boolean; // Usar código de área en lugar del prefijo
    numberLength: number; // Longitud del número (ej: 3 para 001, 5 para 00001)
    showQueueCode: boolean; // Mostrar código de cola
    showQueueName: boolean; // Mostrar nombre de cola
    showEstimatedWait: boolean; // Mostrar tiempo estimado
    printLogo: boolean; // Imprimir logo en ticket
    logoUrl?: string; // URL del logo
    footerText?: string; // Texto al pie del ticket
  };
  
  // Configuración de display
  displayConfig: {
    autoRefresh: boolean; // Auto-refrescar pantalla
    refreshInterval: number; // Intervalo en segundos
    showLastCalled: number; // Cantidad de últimos turnos llamados a mostrar
    playSound: boolean; // Reproducir sonido al llamar
    soundUrl?: string; // URL del sonido
  };
  
  // Configuración general
  businessName: string; // Nombre del negocio
  businessAddress?: string; // Dirección
  businessPhone?: string; // Teléfono
  
  // Horarios de atención
  workingHours: {
    monday: { open: string; close: string; enabled: boolean };
    tuesday: { open: string; close: string; enabled: boolean };
    wednesday: { open: string; close: string; enabled: boolean };
    thursday: { open: string; close: string; enabled: boolean };
    friday: { open: string; close: string; enabled: boolean };
    saturday: { open: string; close: string; enabled: boolean };
    sunday: { open: string; close: string; enabled: boolean };
  };
  
  // Configuración de turnos
  turnConfig: {
    maxTurnsPerDay: number; // Máximo de turnos por día
    estimatedServiceTime: number; // Tiempo estimado de atención (minutos)
    allowPriority: boolean; // Permitir turnos prioritarios
    allowCancellation: boolean; // Permitir cancelación de turnos
  };
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    operationMode: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'multiple',
      required: true,
    },
    requireCustomerValidation: {
      type: Boolean,
      default: false,
    },
    validationType: {
      type: String,
      enum: ['dni', 'phone', 'email', 'none'],
      default: 'none',
    },
    ticketFormat: {
      prefix: {
        type: String,
        default: 'T',
        maxlength: 5,
      },
      useAreaCode: {
        type: Boolean,
        default: true,
      },
      numberLength: {
        type: Number,
        default: 3,
        min: 3,
        max: 10,
      },
      showQueueCode: {
        type: Boolean,
        default: true,
      },
      showQueueName: {
        type: Boolean,
        default: true,
      },
      showEstimatedWait: {
        type: Boolean,
        default: true,
      },
      printLogo: {
        type: Boolean,
        default: false,
      },
      logoUrl: {
        type: String,
        required: false,
      },
      footerText: {
        type: String,
        required: false,
      },
    },
    displayConfig: {
      autoRefresh: {
        type: Boolean,
        default: true,
      },
      refreshInterval: {
        type: Number,
        default: 5, // 5 segundos
      },
      showLastCalled: {
        type: Number,
        default: 10,
      },
      playSound: {
        type: Boolean,
        default: true,
      },
      soundUrl: {
        type: String,
        required: false,
      },
    },
    businessName: {
      type: String,
      required: true,
      default: 'JobStream',
    },
    businessAddress: {
      type: String,
      required: false,
    },
    businessPhone: {
      type: String,
      required: false,
    },
    workingHours: {
      monday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '18:00' },
        enabled: { type: Boolean, default: true },
      },
      tuesday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '18:00' },
        enabled: { type: Boolean, default: true },
      },
      wednesday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '18:00' },
        enabled: { type: Boolean, default: true },
      },
      thursday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '18:00' },
        enabled: { type: Boolean, default: true },
      },
      friday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '18:00' },
        enabled: { type: Boolean, default: true },
      },
      saturday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '13:00' },
        enabled: { type: Boolean, default: false },
      },
      sunday: {
        open: { type: String, default: '00:00' },
        close: { type: String, default: '00:00' },
        enabled: { type: Boolean, default: false },
      },
    },
    turnConfig: {
      maxTurnsPerDay: {
        type: Number,
        default: 1000,
      },
      estimatedServiceTime: {
        type: Number,
        default: 10, // 10 minutos
      },
      allowPriority: {
        type: Boolean,
        default: true,
      },
      allowCancellation: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Solo debe haber una configuración en la BD
systemConfigSchema.statics.getConfig = async function (): Promise<ISystemConfig> {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
