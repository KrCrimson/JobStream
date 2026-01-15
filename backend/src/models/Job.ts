import mongoose, { Document, Schema } from 'mongoose';
import { JobStatus, JobPriority, JobType } from '../types';

export interface IJob extends Document {
  jobId: string;
  queueId: mongoose.Types.ObjectId;
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
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  nextRetryAt?: Date;
  dependsOn: string[];
  webhookUrl?: string;
  metadata: {
    startedBy?: string;
    tags?: string[];
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    queueId: {
      type: Schema.Types.ObjectId,
      ref: 'Queue',
      required: true,
      index: true,
    },
    queueName: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(JobPriority),
      default: JobPriority.NORMAL,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    result: {
      type: Schema.Types.Mixed,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    error: String,
    stackTrace: String,
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    delay: Number,
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    nextRetryAt: Date,
    dependsOn: {
      type: [String],
      default: [],
    },
    webhookUrl: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
jobSchema.index({ status: 1, priority: -1, createdAt: 1 });
jobSchema.index({ queueName: 1, status: 1 });
jobSchema.index({ type: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>('Job', jobSchema);
