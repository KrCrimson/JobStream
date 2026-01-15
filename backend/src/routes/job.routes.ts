import { Router } from 'express';
import { JobController } from '../controllers/JobController';
import { authenticate, authorize } from '../middleware/auth';
import { jobCreationLimiter } from '../middleware/rateLimiter';
import { validateCreateJob, validateGetJobs, validateJobId } from '../middleware/validation';

const router = Router();
const jobController = new JobController();

router.use(authenticate);

router.post('/', authorize('admin', 'user'), jobCreationLimiter, validateCreateJob, jobController.createJob.bind(jobController));
router.get('/', validateGetJobs, jobController.getJobs.bind(jobController));
router.get('/stats', jobController.getJobStats.bind(jobController));
router.get('/:jobId', validateJobId, jobController.getJob.bind(jobController));
router.post('/:jobId/retry', authorize('admin', 'user'), validateJobId, jobController.retryJob.bind(jobController));
router.post('/:jobId/cancel', authorize('admin', 'user'), validateJobId, jobController.cancelJob.bind(jobController));
router.delete('/:jobId', authorize('admin'), validateJobId, jobController.deleteJob.bind(jobController));
router.post('/bulk-retry', authorize('admin', 'user'), jobController.bulkRetry.bind(jobController));

export default router;
