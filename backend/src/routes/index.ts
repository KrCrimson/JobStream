import { Router } from 'express';
import authRoutes from './auth.routes';
import queueRoutes from './queue.routes';
import jobRoutes from './job.routes';
import workerRoutes from './worker.routes';
import turnRoutes from './turnRoutes';
import serviceAreaRoutes from './serviceAreaRoutes';
import configRoutes from './configRoutes';
import turnWorkerRoutes from './turnWorkerRoutes';

const router = Router();

// Rutas del sistema de turnos
router.use('/turns', turnRoutes);
router.use('/service-areas', serviceAreaRoutes);
router.use('/config', configRoutes);
router.use('/turn-workers', turnWorkerRoutes);

// Rutas del sistema original (mantener por compatibilidad)
router.use('/auth', authRoutes);
router.use('/queues', queueRoutes);
router.use('/jobs', jobRoutes);
router.use('/workers', workerRoutes);

export default router;
