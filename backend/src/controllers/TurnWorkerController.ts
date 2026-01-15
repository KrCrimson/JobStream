import { Request, Response, NextFunction } from 'express';
import { Worker } from '../models/Worker';
import { User } from '../models/User';
import { ApiError } from '../utils/response';
import bcrypt from 'bcryptjs';

/* eslint-disable @typescript-eslint/no-unused-vars */

export class TurnWorkerController {
  /**
   * Obtener perfil del trabajador autenticado
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = req.user?.email;

      if (!userEmail) {
        throw new ApiError(401, 'Usuario no autenticado');
      }

      const worker = await Worker.findOne({ email: userEmail })
        .select('name lastName email isActive serviceAreas createdAt');

      if (!worker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      const responseData = {
        _id: worker._id,
        firstName: worker.name,
        lastName: worker.lastName,
        email: worker.email,
        role: 'worker',
        isActive: worker.isActive,
        serviceAreas: worker.serviceAreas || [],
        createdAt: worker.createdAt
      };

      res.json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: { worker: responseData }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los trabajadores
   */
  async getWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workers = await Worker.find()
        .select('name lastName email isActive serviceAreas createdAt')
        .sort({ name: 1, lastName: 1 });

      // Convertir al formato esperado por el frontend
      const formattedWorkers = workers.map(w => ({
        _id: w._id,
        firstName: w.name,
        lastName: w.lastName,
        email: w.email,
        role: 'worker',
        isActive: w.isActive,
        serviceAreas: w.serviceAreas || [],
        createdAt: w.createdAt
      }));

      res.json({
        success: true,
        message: 'Trabajadores obtenidos exitosamente',
        data: {
          workers: formattedWorkers,
          count: formattedWorkers.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener trabajador por ID
   */
  async getWorkerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const worker = await Worker.findById(id)
        .select('name lastName email isActive serviceAreas createdAt');

      if (!worker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      const responseData = {
        _id: worker._id,
        firstName: worker.name,
        lastName: worker.lastName,
        email: worker.email,
        role: 'worker',
        isActive: worker.isActive,
        serviceAreas: worker.serviceAreas || [],
        createdAt: worker.createdAt
      };

      res.json({
        success: true,
        message: 'Trabajador obtenido exitosamente',
        data: { worker: responseData }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear nuevo trabajador
   */
  async createWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('🔵 Recibiendo petición para crear trabajador:', req.body);
      const { firstName, lastName, email, password, serviceAreas } = req.body;

      // Validar campos requeridos
      if (!firstName || !lastName || !email || !password) {
        console.log('❌ Validación fallida - campos requeridos faltantes');
        throw new ApiError(400, 'Nombre, apellido, email y contraseña son requeridos');
      }

      // Verificar que el email no exista
      const existingWorker = await Worker.findOne({ email });
      if (existingWorker) {
        console.log('❌ Email ya existe:', email);
        throw new ApiError(400, 'Ya existe un trabajador con ese email');
      }

      // Verificar que el email no exista en User
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('❌ Email ya existe en usuarios:', email);
        throw new ApiError(400, 'Ya existe un usuario con ese email');
      }

      // Generar employeeId automáticamente
      const workerCount = await Worker.countDocuments();
      const employeeId = `EMP${String(workerCount + 1).padStart(4, '0')}`;
      console.log('📝 EmployeeId generado:', employeeId);

      // Crear usuario primero (el hook pre-save hasheará la contraseña)
      console.log('👤 Creando usuario en colección User...');
      const user = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password, // El hook pre-save lo hasheará
        role: 'worker',
        isActive: true
      });
      console.log('✅ Usuario creado:', user._id);

      // Hashear contraseña para Worker
      const passwordHash = await bcrypt.hash(password, 10);
      console.log('🔐 Contraseña hasheada exitosamente');

      // Crear trabajador con valores por defecto
      console.log('💾 Intentando crear trabajador en DB...');
      const worker = await Worker.create({
        name: firstName,
        lastName,
        employeeId,
        username: email,
        passwordHash,
        email,
        role: 'operator',
        serviceAreas: serviceAreas || [],
        isActive: true,
        isOnline: false,
        isAvailable: false,
        stats: {
          turnsAttendedToday: 0,
          turnsAttendedTotal: 0,
          averageServiceTime: 0,
          customerSatisfactionScore: 0,
          lastActivity: new Date()
        },
        settings: {
          notifications: true,
          autoCallNext: false,
          breakTimeMinutes: 15,
          preferredServiceAreas: serviceAreas || []
        },
        workSchedule: {
          monday: { start: '08:00', end: '17:00', isWorkDay: true },
          tuesday: { start: '08:00', end: '17:00', isWorkDay: true },
          wednesday: { start: '08:00', end: '17:00', isWorkDay: true },
          thursday: { start: '08:00', end: '17:00', isWorkDay: true },
          friday: { start: '08:00', end: '17:00', isWorkDay: true },
          saturday: { start: '08:00', end: '13:00', isWorkDay: false },
          sunday: { start: '00:00', end: '00:00', isWorkDay: false }
        }
      });

      console.log('✅ Trabajador creado en DB:', worker._id);

      // Retornar en formato frontend
      const responseData = {
        _id: worker._id,
        firstName: worker.name,
        lastName: worker.lastName,
        email: worker.email,
        role: 'worker',
        isActive: worker.isActive,
        serviceAreas: worker.serviceAreas || [],
        createdAt: worker.createdAt
      };

      console.log('📤 Enviando respuesta al frontend:', responseData);

      res.status(201).json({
        success: true,
        message: 'Trabajador creado exitosamente',
        data: { worker: responseData }
      });
    } catch (error) {
      console.error('❌ Error en createWorker:', error);
      next(error);
    }
  }

  /**
   * Actualizar trabajador
   */
  async updateWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, password, serviceAreas } = req.body;

      console.log('🔵 Actualizando trabajador:', id);
      console.log('📝 Datos recibidos:', { firstName, lastName, email, serviceAreas });

      // Buscar el trabajador actual
      const currentWorker = await Worker.findById(id);
      if (!currentWorker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      const updates: any = {};

      if (firstName) updates.name = firstName;
      if (lastName) updates.lastName = lastName;
      if (email) updates.email = email;
      if (serviceAreas !== undefined) {
        updates.serviceAreas = serviceAreas;
        console.log('✅ ServiceAreas a actualizar:', serviceAreas);
      }

      // Si se actualiza la contraseña, hashearla
      if (password) {
        updates.passwordHash = await bcrypt.hash(password, 10);
      }

      console.log('💾 Updates a aplicar:', updates);

      const worker = await Worker.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('name lastName email isActive serviceAreas createdAt');

      if (!worker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      console.log('✅ Trabajador actualizado, serviceAreas en DB:', worker.serviceAreas);

      // Actualizar también el usuario en la colección User si existe
      const userUpdates: any = {};
      if (firstName || lastName) {
        userUpdates.name = `${firstName || currentWorker.name} ${lastName || currentWorker.lastName}`;
      }
      if (email) userUpdates.email = email;
      if (password) userUpdates.password = password; // El hook pre-save lo hasheará

      if (Object.keys(userUpdates).length > 0) {
        await User.findOneAndUpdate(
          { email: currentWorker.email },
          { $set: userUpdates }
        );
        console.log('✅ Usuario actualizado también');
      }

      // Retornar en formato frontend
      const responseData = {
        _id: worker._id,
        firstName: worker.name,
        lastName: worker.lastName,
        email: worker.email,
        role: 'worker',
        isActive: worker.isActive,
        serviceAreas: worker.serviceAreas || [],
        createdAt: worker.createdAt
      };

      console.log('📤 Respuesta al frontend:', responseData);

      res.json({
        success: true,
        message: 'Trabajador actualizado exitosamente',
        data: { worker: responseData }
      });
    } catch (error) {
      console.error('❌ Error en updateWorker:', error);
      next(error);
    }
  }

  /**
   * Eliminar trabajador
   */
  async deleteWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const worker = await Worker.findById(id);

      if (!worker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      // Eliminar también el usuario asociado
      await User.findOneAndDelete({ email: worker.email });
      console.log('✅ Usuario asociado eliminado');

      // Eliminar el trabajador
      await Worker.findByIdAndDelete(id);
      console.log('✅ Trabajador eliminado');

      res.json({
        success: true,
        message: 'Trabajador eliminado exitosamente',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Asignar áreas de servicio
   */
  async assignServiceAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { serviceAreas } = req.body;

      if (!Array.isArray(serviceAreas)) {
        throw new ApiError(400, 'serviceAreas debe ser un array');
      }

      const worker = await Worker.findByIdAndUpdate(
        id,
        { $set: { serviceAreas } },
        { new: true, runValidators: true }
      ).select('name lastName email isActive serviceAreas createdAt');

      if (!worker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      const responseData = {
        _id: worker._id,
        firstName: worker.name,
        lastName: worker.lastName,
        email: worker.email,
        role: 'worker',
        isActive: worker.isActive,
        serviceAreas: worker.serviceAreas || [],
        createdAt: worker.createdAt
      };

      res.json({
        success: true,
        message: 'Áreas asignadas exitosamente',
        data: { worker: responseData }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas del trabajador
   */
  async getWorkerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const worker = await Worker.findById(id).select('stats name lastName');

      if (!worker) {
        throw new ApiError(404, 'Trabajador no encontrado');
      }

      res.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          worker: {
            name: worker.name,
            lastName: worker.lastName,
            stats: worker.stats
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
