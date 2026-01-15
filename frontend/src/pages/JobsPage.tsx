import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Select } from '@/components/UI';
import { StatusBadge, ProgressBar } from '@/components/StatusBadge';
import { jobService } from '@/services/jobService';
import { queueService } from '@/services/queueService';
import { Job, JobType, JobPriority, JobStatus, Queue } from '@/types';
import { Plus, RefreshCw, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    queueName: '',
    status: '',
    type: '',
  });
  
  useEffect(() => {
    loadQueues();
    loadJobs();
    
    const interval = setInterval(loadJobs, 3000);
    return () => clearInterval(interval);
  }, [filters]);
  
  const loadQueues = async () => {
    try {
      const data = await queueService.getQueues({ limit: 100 });
      setQueues(data.queues);
    } catch (error) {
      console.error('Failed to load queues');
    }
  };
  
  const loadJobs = async () => {
    try {
      const data = await jobService.getJobs({
        queueName: filters.queueName || undefined,
        status: filters.status as JobStatus || undefined,
        type: filters.type as JobType || undefined,
        limit: 50,
      });
      setJobs(data.jobs);
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = async (job: Job) => {
    try {
      await jobService.retryJob(job.jobId);
      toast.success('Job retry initiated');
      loadJobs();
    } catch (error: any) {
      toast.error('Failed to retry job');
    }
  };
  
  const handleCancel = async (job: Job) => {
    try {
      await jobService.cancelJob(job.jobId);
      toast.success('Job cancelled');
      loadJobs();
    } catch (error: any) {
      toast.error('Failed to cancel job');
    }
  };
  
  const handleDelete = async (job: Job) => {
    if (!confirm('Delete this job?')) return;
    
    try {
      await jobService.deleteJob(job.jobId);
      toast.success('Job deleted');
      loadJobs();
    } catch (error: any) {
      toast.error('Failed to delete job');
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your jobs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>
      
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Queue"
            value={filters.queueName}
            onChange={(e) => setFilters({ ...filters, queueName: e.target.value })}
            options={[
              { value: '', label: 'All Queues' },
              ...queues.map((q) => ({ value: q.name, label: q.name })),
            ]}
          />
          
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: 'All Statuses' },
              ...Object.values(JobStatus).map((s) => ({ value: s, label: s })),
            ]}
          />
          
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: '', label: 'All Types' },
              ...Object.values(JobType).map((t) => ({ value: t, label: t })),
            ]}
          />
        </div>
      </Card>
      
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job._id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{job.type}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-sm text-gray-600">
                  Queue: {job.queueName} | ID: {job.jobId.substring(0, 8)}...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {format(new Date(job.createdAt), 'PPpp')}
                </p>
              </div>
              
              <div className="flex gap-2">
                {job.status === JobStatus.FAILED && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRetry(job)}
                    title="Retry job"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                
                {[JobStatus.PENDING, JobStatus.PROCESSING].includes(job.status) && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleCancel(job)}
                    title="Cancel job"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(job)}
                  title="Delete job"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {job.status === JobStatus.PROCESSING && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <ProgressBar progress={job.progress} />
              </div>
            )}
            
            {job.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800">{job.error}</p>
              </div>
            )}
          </Card>
        ))}
        
        {jobs.length === 0 && (
          <Card className="text-center py-12 text-gray-600">
            No jobs found
          </Card>
        )}
      </div>
      
      <CreateJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadJobs}
        queues={queues}
      />
    </div>
  );
};

const CreateJobModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  queues: Queue[];
}> = ({ isOpen, onClose, onSuccess, queues }) => {
  const [formData, setFormData] = useState({
    queueName: '',
    type: JobType.EMAIL_SENDING,
    priority: JobPriority.NORMAL,
    data: '{}',
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let data;
      try {
        data = JSON.parse(formData.data);
      } catch {
        throw new Error('Invalid JSON data');
      }
      
      await jobService.createJob({
        queueName: formData.queueName,
        type: formData.type,
        priority: formData.priority,
        data,
      });
      
      toast.success('Job created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Job">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Queue"
          value={formData.queueName}
          onChange={(e) => setFormData({ ...formData, queueName: e.target.value })}
          options={[
            { value: '', label: 'Select queue' },
            ...queues.map((q) => ({ value: q.name, label: q.name })),
          ]}
          required
        />
        
        <Select
          label="Job Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as JobType })}
          options={Object.values(JobType).map((t) => ({ value: t, label: t }))}
          required
        />
        
        <Select
          label="Priority"
          value={formData.priority.toString()}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          options={[
            { value: '1', label: 'Low' },
            { value: '2', label: 'Normal' },
            { value: '3', label: 'High' },
            { value: '4', label: 'Urgent' },
          ]}
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Data (JSON)
          </label>
          <textarea
            className="input h-32"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            placeholder='{"key": "value"}'
            required
          />
        </div>
        
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Job
          </Button>
        </div>
      </form>
    </Modal>
  );
};
