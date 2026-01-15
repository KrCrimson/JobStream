import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI';
import { Badge } from '@/components/UI';
import { workerService } from '@/services/workerService';
import { Worker } from '@/types';
import { Cpu, Activity, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const loadWorkers = async () => {
    try {
      const data = await workerService.getWorkers({ limit: 100 });
      setWorkers(data.workers);
    } catch (error) {
      console.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workers</h1>
        <p className="text-gray-600 mt-1">Monitor worker processes</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <Card key={worker._id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{worker.workerId}</h3>
                <p className="text-sm text-gray-600">Queue: {worker.queueName}</p>
              </div>
              <Badge
                variant={
                  worker.status === 'active'
                    ? 'success'
                    : worker.status === 'idle'
                    ? 'info'
                    : worker.status === 'error'
                    ? 'error'
                    : 'default'
                }
              >
                {worker.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">{worker.metrics.jobsProcessed}</p>
                <p className="text-gray-600">Processed</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Activity className="w-4 h-4 text-red-600" />
                </div>
                <p className="font-medium text-gray-900">{worker.metrics.jobsFailed}</p>
                <p className="text-gray-600">Failed</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Cpu className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">{worker.concurrency}</p>
                <p className="text-gray-600">Concurrency</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>Avg time: {worker.metrics.averageProcessingTime.toFixed(0)}ms</p>
              <p>Last heartbeat: {format(new Date(worker.health.lastHeartbeat), 'PPpp')}</p>
              {worker.currentJobId && (
                <p className="text-primary-600">Processing: {worker.currentJobId.substring(0, 8)}...</p>
              )}
            </div>
          </Card>
        ))}
        
        {workers.length === 0 && (
          <Card className="col-span-full text-center py-12 text-gray-600">
            No workers found
          </Card>
        )}
      </div>
    </div>
  );
};
