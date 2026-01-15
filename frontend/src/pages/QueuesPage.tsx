import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Modal, Input } from '@/components/UI';
import { queueService } from '@/services/queueService';
import { Queue } from '@/types';
import { Plus, Play, Pause, Trash2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export const QueuesPage: React.FC = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    loadQueues();
  }, []);
  
  const loadQueues = async () => {
    try {
      const data = await queueService.getAllQueuesMetrics();
      setQueues(data);
    } catch (error: any) {
      toast.error('Failed to load queues');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePause = async (queue: Queue) => {
    try {
      await queueService.pauseQueue(queue._id);
      toast.success(`Queue ${queue.name} paused`);
      loadQueues();
    } catch (error: any) {
      toast.error('Failed to pause queue');
    }
  };
  
  const handleResume = async (queue: Queue) => {
    try {
      await queueService.resumeQueue(queue._id);
      toast.success(`Queue ${queue.name} resumed`);
      loadQueues();
    } catch (error: any) {
      toast.error('Failed to resume queue');
    }
  };
  
  const handleDelete = async (queue: Queue) => {
    if (!confirm(`Delete queue "${queue.name}"?`)) return;
    
    try {
      await queueService.deleteQueue(queue._id);
      toast.success('Queue deleted');
      loadQueues();
    } catch (error: any) {
      toast.error('Failed to delete queue');
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queues</h1>
          <p className="text-gray-600 mt-1">Manage your job queues</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Queue
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <Card key={queue._id} className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{queue.name}</h3>
                <p className="text-sm text-gray-600">{queue.description}</p>
              </div>
              <Badge variant={queue.isActive ? 'success' : 'default'}>
                {queue.isActive ? 'Active' : 'Paused'}
              </Badge>
            </div>
            
            {queue.bullMetrics && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="font-medium text-gray-900">{queue.bullMetrics.waiting}</p>
                  <p className="text-gray-600">Waiting</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{queue.bullMetrics.active}</p>
                  <p className="text-gray-600">Active</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{queue.bullMetrics.completed}</p>
                  <p className="text-gray-600">Done</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Link to={`/queues/${queue._id}`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </Link>
              
              {queue.isActive ? (
                <Button
                  variant="secondary"
                  onClick={() => handlePause(queue)}
                  title="Pause queue"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleResume(queue)}
                  title="Resume queue"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="danger"
                onClick={() => handleDelete(queue)}
                title="Delete queue"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <CreateQueueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadQueues}
      />
    </div>
  );
};

const CreateQueueModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [concurrency, setConcurrency] = useState('5');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await queueService.createQueue({
        name,
        description,
        concurrency: parseInt(concurrency),
      });
      
      toast.success('Queue created successfully');
      onSuccess();
      onClose();
      setName('');
      setDescription('');
      setConcurrency('5');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create queue');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Queue">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Queue Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-queue"
          required
        />
        
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Queue description"
        />
        
        <Input
          label="Concurrency"
          type="number"
          value={concurrency}
          onChange={(e) => setConcurrency(e.target.value)}
          min="1"
          max="100"
          required
        />
        
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
