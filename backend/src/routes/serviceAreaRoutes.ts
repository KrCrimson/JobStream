import { Router, Request, Response } from 'express';
import { ServiceArea } from '../models/ServiceArea';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Validaciones
const createServiceAreaValidation = [
  body('name')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('code')
    .notEmpty()
    .withMessage('El código es requerido')
    .isLength({ min: 2, max: 5 })
    .withMessage('El código debe tener entre 2 y 5 caracteres')
    .isUppercase()
    .withMessage('El código debe estar en mayúsculas'),
  
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres'),
  
  body('settings.requireCustomerInfo')
    .optional()
    .isBoolean()
    .withMessage('requireCustomerInfo debe ser un booleano'),
  
  body('settings.allowPriority')
    .optional()
    .isBoolean()
    .withMessage('allowPriority debe ser un booleano'),
  
  body('settings.maxTurnsPerDay')
    .optional()
    .isInt({ min: 1, max: 9999 })
    .withMessage('maxTurnsPerDay debe ser un número entre 1 y 9999'),
];

const updateServiceAreaValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  ...createServiceAreaValidation.map(validation => validation.optional())
];

const serviceAreaIdValidation = [
  param('id').isMongoId().withMessage('ID inválido')
];

/**
 * @route GET /api/service-areas
 * @desc Obtener todas las áreas de servicio
 * @access Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    
    const query: any = {};
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const serviceAreas = await ServiceArea.find(query)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Áreas de servicio obtenidas exitosamente',
      data: {
        serviceAreas,
        count: serviceAreas.length
      }
    });
  } catch (error) {
    console.error('Error getting service areas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route GET /api/service-areas/:id
 * @desc Obtener área de servicio por ID
 * @access Public
 */
router.get('/:id', serviceAreaIdValidation, validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const serviceArea = await ServiceArea.findById(id);

    if (!serviceArea) {
      res.status(404).json({
        success: false,
        message: 'Área de servicio no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Área de servicio obtenida exitosamente',
      data: {
        serviceArea
      }
    });
  } catch (error) {
    console.error('Error getting service area:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route GET /api/service-areas/code/:code
 * @desc Obtener área de servicio por código
 * @access Public
 */
router.get('/code/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const serviceArea = await ServiceArea.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!serviceArea) {
      res.status(404).json({
        success: false,
        message: 'Área de servicio no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Área de servicio obtenida exitosamente',
      data: {
        serviceArea
      }
    });
  } catch (error) {
    console.error('Error getting service area by code:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route POST /api/service-areas
 * @desc Crear nueva área de servicio
 * @access Private (Admin)
 */
router.post('/', authenticate, authorize('admin'), createServiceAreaValidation, validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      description,
      workingHours,
      settings
    } = req.body;

    // Verificar que el código no exista
    const existingArea = await ServiceArea.findOne({ code: code.toUpperCase() });
    if (existingArea) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un área de servicio con este código'
      });
      return;
    }

    const serviceArea = new ServiceArea({
      name,
      code: code.toUpperCase(),
      description,
      workingHours: workingHours || {
        monday: { start: '08:00', end: '17:00', isOpen: true },
        tuesday: { start: '08:00', end: '17:00', isOpen: true },
        wednesday: { start: '08:00', end: '17:00', isOpen: true },
        thursday: { start: '08:00', end: '17:00', isOpen: true },
        friday: { start: '08:00', end: '17:00', isOpen: true },
        saturday: { start: '08:00', end: '12:00', isOpen: false },
        sunday: { start: '08:00', end: '12:00', isOpen: false }
      },
      settings: {
        requireCustomerInfo: settings?.requireCustomerInfo ?? false,
        allowPriority: settings?.allowPriority ?? true,
        maxTurnsPerDay: settings?.maxTurnsPerDay ?? 999,
        estimatedServiceTime: settings?.estimatedServiceTime ?? 5,
        ...settings
      },
      isActive: true
    });

    await serviceArea.save();

    res.status(201).json({
      success: true,
      message: 'Área de servicio creada exitosamente',
      data: {
        serviceArea
      }
    });
  } catch (error) {
    console.error('Error creating service area:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un área de servicio con este código'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route PUT /api/service-areas/:id
 * @desc Actualizar área de servicio
 * @access Private (Admin)
 */
router.put('/:id', authenticate, authorize('admin'), updateServiceAreaValidation, validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si se actualiza el código, verificar que no exista
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existingArea = await ServiceArea.findOne({ 
        code: updateData.code,
        _id: { $ne: id }
      });
      
      if (existingArea) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un área de servicio con este código'
        });
      }
    }

    const serviceArea = await ServiceArea.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!serviceArea) {
      res.status(404).json({
        success: false,
        message: 'Área de servicio no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Área de servicio actualizada exitosamente',
      data: {
        serviceArea
      }
    });
  } catch (error) {
    console.error('Error updating service area:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route DELETE /api/service-areas/:id
 * @desc Eliminar (desactivar) área de servicio
 * @access Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), serviceAreaIdValidation, validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const serviceArea = await ServiceArea.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!serviceArea) {
      res.status(404).json({
        success: false,
        message: 'Área de servicio no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Área de servicio desactivada exitosamente',
      data: {
        serviceArea
      }
    });
  } catch (error) {
    console.error('Error deleting service area:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route PUT /api/service-areas/:id/activate
 * @desc Activar área de servicio
 * @access Private (Admin)
 */
router.put('/:id/activate', authenticate, authorize('admin'), serviceAreaIdValidation, validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const serviceArea = await ServiceArea.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!serviceArea) {
      res.status(404).json({
        success: false,
        message: 'Área de servicio no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Área de servicio activada exitosamente',
      data: {
        serviceArea
      }
    });
  } catch (error) {
    console.error('Error activating service area:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route GET /api/service-areas/:id/status
 * @desc Obtener estado actual del área de servicio
 * @access Public
 */
router.get('/:id/status', serviceAreaIdValidation, validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const serviceArea = await ServiceArea.findById(id);

    if (!serviceArea) {
      res.status(404).json({
        success: false,
        message: 'Área de servicio no encontrada'
      }); 
      return;
    }

    // Verificar si está abierta actualmente
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()] as keyof typeof serviceArea.workingHours;
    
    const todaySchedule = serviceArea.workingHours[today];
    const isOpen = serviceArea.isOpen(today);

    res.status(200).json({
      success: true,
      message: 'Estado del área de servicio obtenido',
      data: {
        serviceArea: {
          id: serviceArea._id,
          name: serviceArea.name,
          code: serviceArea.code,
          isActive: serviceArea.isActive,
          isOpen,
          todaySchedule,
          settings: serviceArea.settings
        }
      }
    });
  } catch (error) {
    console.error('Error getting service area status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;
