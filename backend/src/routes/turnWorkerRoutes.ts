import { Router } from 'express';
import { TurnWorkerController } from '../controllers/TurnWorkerController';
import { authenticate, authorize } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const workerController = new TurnWorkerController();

// Validaciones
const createWorkerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('lastName')
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('email')
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Email inválido'),
  
  body('serviceAreas')
    .optional()
    .isArray()
    .withMessage('serviceAreas debe ser un array'),
];

const workerIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de trabajador inválido'),
];

/**
 * @route GET /api/v1/turn-workers/me
 * @desc Obtener datos del trabajador autenticado
 * @access Private (Worker)
 */
router.get('/me', 
  authenticate, 
  authorize('worker'), 
  workerController.getMyProfile.bind(workerController)
);

/**
 * @route GET /api/v1/turn-workers
 * @desc Obtener todos los trabajadores
 * @access Private (Admin, Worker)
 */
router.get('/', 
  authenticate, 
  authorize('admin', 'worker'), 
  workerController.getWorkers.bind(workerController)
);

/**
 * @route GET /api/v1/turn-workers/:id
 * @desc Obtener trabajador por ID
 * @access Private (Admin, Worker)
 */
router.get('/:id', 
  authenticate, 
  authorize('admin', 'worker'), 
  workerIdValidation,
  validateRequest,
  workerController.getWorkerById.bind(workerController)
);

/**
 * @route POST /api/v1/turn-workers
 * @desc Crear nuevo trabajador
 * @access Private (Admin)
 */
router.post('/', 
  authenticate, 
  authorize('admin'), 
  createWorkerValidation,
  validateRequest,
  workerController.createWorker.bind(workerController)
);

/**
 * @route PUT /api/v1/turn-workers/:id
 * @desc Actualizar trabajador
 * @access Private (Admin)
 */
router.put('/:id', 
  authenticate, 
  authorize('admin'), 
  workerIdValidation,
  validateRequest,
  workerController.updateWorker.bind(workerController)
);

/**
 * @route DELETE /api/v1/turn-workers/:id
 * @desc Desactivar trabajador
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticate, 
  authorize('admin'), 
  workerIdValidation,
  validateRequest,
  workerController.deleteWorker.bind(workerController)
);

/**
 * @route PUT /api/v1/turn-workers/:id/service-areas
 * @desc Asignar áreas de servicio a trabajador
 * @access Private (Admin)
 */
router.put('/:id/service-areas', 
  authenticate, 
  authorize('admin'), 
  workerIdValidation,
  validateRequest,
  workerController.assignServiceAreas.bind(workerController)
);

/**
 * @route GET /api/v1/turn-workers/:id/stats
 * @desc Obtener estadísticas del trabajador
 * @access Private (Admin, Worker - solo sus propias stats)
 */
router.get('/:id/stats', 
  authenticate, 
  authorize('admin', 'worker'), 
  workerIdValidation,
  validateRequest,
  workerController.getWorkerStats.bind(workerController)
);

export default router;
