import { Router } from 'express';
import { TurnController } from '../controllers/TurnController';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { TurnCleanupService } from '../services/TurnCleanupService';

const router = Router();

// Validaciones
const createTurnValidation = [
  body('serviceAreaCode')
    .notEmpty()
    .withMessage('El código del área de servicio es requerido')
    .isLength({ min: 2, max: 5 })
    .withMessage('El código del área de servicio debe tener entre 2 y 5 caracteres'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
    .withMessage('Prioridad inválida'),
  
  body('customerData.idNumber')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 20 })
    .withMessage('Número de identificación inválido'),
  
  body('customerData.name')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 50 })
    .withMessage('Nombre inválido'),
  
  body('customerData.lastName')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 50 })
    .withMessage('Apellido inválido'),
  
  body('customerData.phone')
    .optional({ checkFalsy: true })
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Número de teléfono inválido'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
];

const cancelTurnValidation = [
  body('reason')
    .notEmpty()
    .withMessage('La razón de cancelación es requerida')
    .isLength({ min: 1, max: 200 })
    .withMessage('La razón debe tener entre 1 y 200 caracteres'),
];

const turnIdValidation = [
  param('turnId')
    .isMongoId()
    .withMessage('ID de turno inválido'),
];

const serviceAreaCodeValidation = [
  param('serviceAreaCode')
    .notEmpty()
    .withMessage('El código del área de servicio es requerido')
    .isLength({ min: 2, max: 5 })
    .withMessage('El código del área de servicio debe tener entre 2 y 5 caracteres'),
];

const turnNumberValidation = [
  param('turnNumber')
    .notEmpty()
    .withMessage('El número de turno es requerido')
    .matches(/^[A-Z]{2,5}\d{3,4}$/)
    .withMessage('Formato de número de turno inválido'),
];

// Rutas públicas (sin autenticación)
/**
 * @route POST /api/turns
 * @desc Crear un nuevo turno
 * @access Public
 */
router.post('/', createTurnValidation, validateRequest, TurnController.createTurn);

/**
 * @route GET /api/turns/number/:turnNumber
 * @desc Obtener información básica de un turno por número
 * @access Public
 */
router.get('/number/:turnNumber', turnNumberValidation, validateRequest, TurnController.getTurnByNumber);

/**
 * @route GET /api/turns/display
 * @desc Obtener turnos para pantalla de llamadas
 * @access Public
 */
router.get('/display', TurnController.getDisplayTurns);

// Rutas que requieren autenticación (trabajadores)
/**
 * @route POST /api/turns/call/:serviceAreaCode
 * @desc Llamar al siguiente turno en la cola
 * @access Private (Worker)
 */
router.post('/call/:serviceAreaCode', 
  authenticate,
  authorize('admin', 'worker'),
  serviceAreaCodeValidation, 
  validateRequest, 
  TurnController.callNextTurn
);

/**
 * @route PUT /api/turns/:turnId/attend
 * @desc Marcar turno como en atención
 * @access Private (Worker)
 */
router.put('/:turnId/attend', 
  authenticate,
  authorize('admin', 'worker'),
  turnIdValidation, 
  validateRequest, 
  TurnController.attendTurn
);

/**
 * @route PUT /api/turns/:turnId/complete
 * @desc Completar turno
 * @access Private (Worker)
 */
router.put('/:turnId/complete', 
  authenticate,
  authorize('admin', 'worker'),
  turnIdValidation, 
  validateRequest, 
  TurnController.completeTurn
);

/**
 * @route PUT /api/turns/:turnId/cancel
 * @desc Cancelar turno
 * @access Private (Worker/Admin)
 */
router.put('/:turnId/cancel', 
  authenticate,
  authorize('admin', 'worker'),
  turnIdValidation, 
  cancelTurnValidation, 
  validateRequest, 
  TurnController.cancelTurn
);

/**
 * @route GET /api/turns
 * @desc Obtener turnos con filtros
 * @access Private (Worker/Admin)
 */
router.get('/', 
  authenticate,
  authorize('admin', 'worker'),
  TurnController.getTurns
);

/**
 * @route GET /api/turns/active
 * @desc Obtener turnos activos (waiting o in-progress)
 * @access Public
 */
router.get('/active', 
  TurnController.getActiveTurns
);

/**
 * @route GET /api/turns/stats/summary
 * @desc Obtener estadísticas de turnos
 * @access Private (Admin)
 */
router.get('/stats/summary', 
  authenticate,
  authorize('admin'),
  TurnController.getTurnStats
);

/**
 * @route GET /api/turns/:turnId
 * @desc Obtener turno por ID
 * @access Private (Worker/Admin)
 */
router.get('/:turnId', 
  authenticate,
  authorize('admin', 'worker'),
  turnIdValidation, 
  validateRequest, 
  TurnController.getTurnById
);

/**
 * @route POST /api/turns/cleanup/manual
 * @desc Ejecutar limpieza manual de turnos antiguos (solo para testing)
 * @access Private (Admin)
 */
router.post('/cleanup/manual',
  authenticate,
  authorize('admin'),
  async (_req, res) => {
    try {
      await TurnCleanupService.manualCleanup();
      res.json({
        success: true,
        message: 'Limpieza manual ejecutada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al ejecutar limpieza manual'
      });
    }
  }
);

export default router;