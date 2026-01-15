import { Router } from 'express';
import { WorkerController } from '../controllers/WorkerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const workerController = new WorkerController();

router.use(authenticate);

router.get('/', workerController.getWorkers.bind(workerController));
router.get('/stats', workerController.getWorkerStats.bind(workerController));
router.get('/:workerId', workerController.getWorker.bind(workerController));
router.put('/:workerId/health', workerController.updateWorkerHealth.bind(workerController));
router.post('/cleanup', authorize('admin'), workerController.cleanupStaleWorkers.bind(workerController));

export default router;
