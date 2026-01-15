import mongoose, { Document, Schema } from 'mongoose';

export interface IQueue extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const queueSchema = new Schema<IQueue>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    concurrency: {
      type: Number,
      default: 5,
      min: 1,
      max: 100,
    },
    rateLimit: {
      max: {
        type: Number,
        default: 100,
      },
      duration: {
        type: Number,
        default: 60000, // 1 minute
      },
    },
    defaultJobOptions: {
      attempts: {
        type: Number,
        default: 3,
      },
      backoff: {
        type: {
          type: String,
          enum: ['exponential', 'fixed'],
          default: 'exponential',
        },
        delay: {
          type: Number,
          default: 5000,
        },
      },
      timeout: {
        type: Number,
        default: 60000,
      },
    },
    metrics: {
      totalJobs: {
        type: Number,
        default: 0,
      },
      completedJobs: {
        type: Number,
        default: 0,
      },
      failedJobs: {
        type: Number,
        default: 0,
      },
      averageProcessingTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Queue = mongoose.model<IQueue>('Queue', queueSchema);
