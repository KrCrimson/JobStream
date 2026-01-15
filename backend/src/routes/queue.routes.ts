import { Router } from 'express';
import { QueueController } from '../controllers/QueueController';
import { authenticate, authorize } from '../middleware/auth';
import { validateCreateQueue, validateQueueId } from '../middleware/validation';

const router = Router();
const queueController = new QueueController();

router.use(authenticate);

router.post('/', authorize('admin', 'user'), validateCreateQueue, queueController.createQueue.bind(queueController));
router.get('/', queueController.getQueues.bind(queueController));
router.get('/metrics', queueController.getAllQueuesMetrics.bind(queueController));
router.get('/:queueId', validateQueueId, queueController.getQueue.bind(queueController));
router.put('/:queueId', authorize('admin', 'user'), validateQueueId, queueController.updateQueue.bind(queueController));
router.delete('/:queueId', authorize('admin'), validateQueueId, queueController.deleteQueue.bind(queueController));
router.post('/:queueId/pause', authorize('admin', 'user'), validateQueueId, queueController.pauseQueue.bind(queueController));
router.post('/:queueId/resume', authorize('admin', 'user'), validateQueueId, queueController.resumeQueue.bind(queueController));
router.get('/:queueId/metrics', validateQueueId, queueController.getQueueMetrics.bind(queueController));

export default router;
