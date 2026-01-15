import { Router } from 'express';
import { SystemConfigController } from '../controllers/SystemConfigController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const configController = new SystemConfigController();

/**
 * @route GET /api/v1/config
 * @desc Obtener configuración del sistema
 * @access Public (cualquiera puede ver la config para adaptar UI)
 */
router.get('/', configController.getConfig.bind(configController));

/**
 * @route PUT /api/v1/config
 * @desc Actualizar configuración del sistema
 * @access Private (Solo Admin)
 */
router.put('/', 
  authenticate, 
  authorize('admin'), 
  configController.updateConfig.bind(configController)
);

/**
 * @route POST /api/v1/config/reset
 * @desc Resetear configuración a valores por defecto
 * @access Private (Solo Admin)
 */
router.post('/reset', 
  authenticate, 
  authorize('admin'), 
  configController.resetConfig.bind(configController)
);

export default router;
