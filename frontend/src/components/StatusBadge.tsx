import React from 'react';
import { JobStatus } from '@/types';
import { Badge } from './UI';

interface StatusBadgeProps {
  status: JobStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<JobStatus, { variant: any; label: string }> = {
    [JobStatus.PENDING]: { variant: 'default', label: 'Pending' },
    [JobStatus.PROCESSING]: { variant: 'info', label: 'Processing' },
    [JobStatus.COMPLETED]: { variant: 'success', label: 'Completed' },
    [JobStatus.FAILED]: { variant: 'error', label: 'Failed' },
    [JobStatus.DELAYED]: { variant: 'warning', label: 'Delayed' },
    [JobStatus.PAUSED]: { variant: 'warning', label: 'Paused' },
  };
  
  const config = statusConfig[status];
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};
