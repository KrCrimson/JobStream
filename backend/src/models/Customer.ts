import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  idNumber: string; // Cédula, DNI, etc.
  name: string;
  lastName: string;
  phone?: string;
  email?: string;
  isPriority: boolean; // Embarazada, adulto mayor, discapacitado
  priorityType?: 'pregnant' | 'elderly' | 'disabled' | 'other';
  notes?: string;
  visitHistory: {
    date: Date;
    serviceArea: string;
    turnNumber: string;
    attendedBy?: string;
    duration?: number; // en minutos
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    idNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
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
    phone: {
      type: String,
      trim: true,
      match: /^[\+]?[0-9\s\-\(\)]{7,20}$/,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    isPriority: {
      type: Boolean,
      default: false,
      index: true,
    },
    priorityType: {
      type: String,
      enum: ['pregnant', 'elderly', 'disabled', 'other'],
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    visitHistory: [{
      date: {
        type: Date,
        required: true,
      },
      serviceArea: {
        type: String,
        required: true,
      },
      turnNumber: {
        type: String,
        required: true,
      },
      attendedBy: String,
      duration: Number,
    }],
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

// Índices
customerSchema.index({ name: 1, lastName: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ isPriority: 1 });

// Virtual para nombre completo
customerSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.lastName}`;
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);