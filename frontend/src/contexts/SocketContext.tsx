import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '@/services/socketService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToQueue: (queueName: string) => void;
  unsubscribeFromQueue: (queueName: string) => void;
  subscribeToJob: (jobId: string) => void;
  unsubscribeFromJob: (jobId: string) => void;
  subscribeToWorkers: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      const socketInstance = socketService.connect();
      setSocket(socketInstance);
      
      socketInstance.on('connect', () => {
        setIsConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });
      
      // Listen to system alerts
      socketService.onSystemAlert((alert) => {
        if (alert.severity === 'error') {
          toast.error(alert.message);
        } else if (alert.severity === 'warning') {
          toast(alert.message, { icon: '⚠️' });
        } else {
          toast.success(alert.message);
        }
      });
      
      return () => {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated]);
  
  const subscribeToQueue = (queueName: string) => {
    socketService.subscribeToQueue(queueName);
  };
  
  const unsubscribeFromQueue = (queueName: string) => {
    socketService.unsubscribeFromQueue(queueName);
  };
  
  const subscribeToJob = (jobId: string) => {
    socketService.subscribeToJob(jobId);
  };
  
  const unsubscribeFromJob = (jobId: string) => {
    socketService.unsubscribeFromJob(jobId);
  };
  
  const subscribeToWorkers = () => {
    socketService.subscribeToWorkers();
  };
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        subscribeToQueue,
        unsubscribeFromQueue,
        subscribeToJob,
        unsubscribeFromJob,
        subscribeToWorkers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
