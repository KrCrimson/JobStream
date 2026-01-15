import { Turn, ITurn } from '../models/Turn';
import { ServiceArea } from '../models/ServiceArea';
import { Customer } from '../models/Customer';
import { Worker } from '../models/Worker';
import { TurnStatus, TurnPriority } from '../types';
import { AppError } from '../middleware/errorHandler';

interface CreateTurnData {
  serviceAreaCode: string;
  priority?: TurnPriority;
  customerData?: {
    idNumber?: string;
    name?: string;
    lastName?: string;
    phone?: string;
    isPriority?: boolean;
    priorityType?: 'pregnant' | 'elderly' | 'disabled' | 'other';
  };
  notes?: string;
}

interface TurnFilters {
  serviceAreaCode?: string;
  status?: TurnStatus;
  priority?: TurnPriority;
  workerId?: string;
  customerIdNumber?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export class TurnService {
  /**
   * Crear un nuevo turno
   */
  static async createTurn(data: CreateTurnData): Promise<ITurn> {
    try {
      // Verificar que el área de servicio existe
      const serviceArea = await ServiceArea.findOne({ 
        code: data.serviceAreaCode,
        isActive: true 
      });
      
      if (!serviceArea) {
        throw new AppError(`Área de servicio ${data.serviceAreaCode} no encontrada`, 404);
      }

      // Verificar horario de atención
      if (!this.isServiceAreaOpen(serviceArea)) {
        throw new AppError(`El área de servicio ${serviceArea.name} está cerrada`, 400);
      }

      // Generar número de turno
      const turnNumber = await Turn.generateTurnNumber(data.serviceAreaCode);

      // Determinar prioridad
      let priority = data.priority || TurnPriority.NORMAL;
      if (data.customerData?.isPriority) {
        priority = TurnPriority.HIGH;
      }

      // Calcular tiempo estimado de espera
      const estimatedWaitTime = await this.calculateEstimatedWaitTime(data.serviceAreaCode);

      // Crear el turno
      const turn = new Turn({
        turnNumber,
        serviceAreaCode: data.serviceAreaCode,
        serviceAreaName: serviceArea.name,
        status: TurnStatus.WAITING,
        priority,
        customerData: data.customerData,
        estimatedWaitTime,
        notes: data.notes,
        notificationsSent: {
          sms: false,
          email: false,
          display: false,
        },
        isActive: true,
      });

      await turn.save();

      // Si hay información del cliente y está configurado, guardar en historial
      if (data.customerData?.idNumber && serviceArea.settings.requireCustomerInfo) {
        await this.updateCustomerHistory(data.customerData, turnNumber, data.serviceAreaCode);
      }

      return turn;
    } catch (error) {
      console.error('Error creating turn:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear el turno', 500);
    }
  }

  /**
   * Llamar al siguiente turno en la cola
   */
  static async callNextTurn(serviceAreaCode: string, userEmail: string): Promise<ITurn | null> {
    try {
      // Verificar que el trabajador existe y tiene el área asignada
      const worker = await Worker.findOne({
        email: userEmail,
        isActive: true,
        serviceAreas: serviceAreaCode
      });

      if (!worker) {
        throw new AppError('Trabajador no disponible o no autorizado para esta área', 403);
      }

      // Buscar el siguiente turno en orden de prioridad y llegada
      const nextTurn = await Turn.findOneAndUpdate(
        {
          serviceAreaCode,
          status: TurnStatus.WAITING,
          isActive: true,
        },
        {
          status: TurnStatus.CALLED,
          calledAt: new Date(),
          workerId: worker._id.toString(),
          workerName: worker.fullName,
          windowNumber: worker.windowNumber,
        },
        {
          new: true,
          sort: { priority: -1, createdAt: 1 } // Alta prioridad primero, luego por orden de llegada
        }
      );

      if (!nextTurn) {
        return null; // No hay turnos en espera
      }

      // Actualizar estado del trabajador
      worker.stats.lastActivity = new Date();
      await worker.save();

      return nextTurn;
    } catch (error) {
      console.error('Error calling next turn:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al llamar el siguiente turno', 500);
    }
  }

  /**
   * Marcar turno como atendido
   */
  static async attendTurn(turnId: string, userEmail: string): Promise<ITurn> {
    try {
      const turn = await Turn.findById(turnId);
      if (!turn) {
        throw new AppError('Turno no encontrado', 404);
      }

      if (turn.status !== TurnStatus.CALLED) {
        throw new AppError('El turno debe estar en estado "llamado" para ser atendido', 400);
      }

      // Buscar trabajador por email
      const worker = await Worker.findOne({ email: userEmail, isActive: true });
      if (!worker) {
        throw new AppError('Trabajador no encontrado', 404);
      }

      // Verificar que el trabajador que atiende es el que llamó el turno
      if (turn.workerId !== worker._id.toString()) {
        throw new AppError('No autorizado para atender este turno', 403);
      }

      // Actualizar turno
      turn.status = TurnStatus.IN_PROGRESS;
      turn.attendedAt = new Date();
      turn.actualWaitTime = turn.calculateCurrentWaitTime();
      await turn.save();

      return turn;
    } catch (error) {
      console.error('Error attending turn:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al atender el turno', 500);
    }
  }

  /**
   * Completar turno
   */
  static async completeTurn(turnId: string, workerId: string): Promise<ITurn> {
    try {
      const turn = await Turn.findById(turnId);
      if (!turn) {
        throw new AppError('Turno no encontrado', 404);
      }

      if (turn.status !== TurnStatus.IN_PROGRESS) {
        throw new AppError('El turno debe estar en progreso para ser completado', 400);
      }

      if (turn.workerId !== workerId) {
        throw new AppError('No autorizado para completar este turno', 403);
      }

      // Calcular duración del servicio
      const serviceDuration = turn.attendedAt ? 
        Math.round((new Date().getTime() - turn.attendedAt.getTime()) / (1000 * 60)) : 0;

      // Actualizar turno
      turn.status = TurnStatus.COMPLETED;
      turn.completedAt = new Date();
      turn.serviceDuration = serviceDuration;
      await turn.save();

      // Actualizar estadísticas del trabajador
      const worker = await Worker.findById(workerId);
      if (worker) {
        worker.stats.turnsAttendedToday += 1;
        worker.stats.turnsAttendedTotal += 1;
        worker.stats.lastActivity = new Date();
        worker.isAvailable = true; // Disponible para el siguiente turno
        
        // Actualizar tiempo promedio de servicio
        const totalTurns = worker.stats.turnsAttendedTotal;
        worker.stats.averageServiceTime = 
          (worker.stats.averageServiceTime * (totalTurns - 1) + serviceDuration) / totalTurns;
        
        await worker.save();
      }

      return turn;
    } catch (error) {
      console.error('Error completing turn:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al completar el turno', 500);
    }
  }

  /**
   * Cancelar turno
   */
  static async cancelTurn(turnId: string, reason: string): Promise<ITurn> {
    try {
      const turn = await Turn.findById(turnId);
      if (!turn) {
        throw new AppError('Turno no encontrado', 404);
      }

      if ([TurnStatus.COMPLETED, TurnStatus.CANCELLED].includes(turn.status)) {
        throw new AppError('No se puede cancelar un turno que ya está completado o cancelado', 400);
      }

      // Actualizar turno
      turn.status = TurnStatus.CANCELLED;
      turn.cancelledAt = new Date();
      turn.cancellationReason = reason;
      await turn.save();

      // Si estaba siendo atendido, liberar al trabajador
      if (turn.workerId) {
        const worker = await Worker.findById(turn.workerId);
        if (worker) {
          worker.isAvailable = true;
          await worker.save();
        }
      }

      return turn;
    } catch (error) {
      console.error('Error cancelling turn:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al cancelar el turno', 500);
    }
  }

  /**
   * Obtener turnos con filtros
   */
  static async getTurns(filters: TurnFilters = {}): Promise<{ turns: ITurn[], total: number }> {
    try {
      const query: any = { isActive: true };

      if (filters.serviceAreaCode) query.serviceAreaCode = filters.serviceAreaCode;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.workerId) query.workerId = filters.workerId;
      if (filters.customerIdNumber) query['customerData.idNumber'] = filters.customerIdNumber;
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }

      const total = await Turn.countDocuments(query);
      const turns = await Turn.find(query)
        .sort({ priority: -1, createdAt: 1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0);

      return { turns, total };
    } catch (error) {
      console.error('Error getting turns:', error);
      throw new AppError('Error al obtener los turnos', 500);
    }
  }

  /**
   * Obtener estadísticas de turnos
   */
  static async getStatistics(serviceAreaCode?: string, date?: Date): Promise<any> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const query: any = {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isActive: true
      };

      if (serviceAreaCode) {
        query.serviceAreaCode = serviceAreaCode;
      }

      const stats = await Turn.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgWaitTime: { $avg: '$actualWaitTime' },
            avgServiceTime: { $avg: '$serviceDuration' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new AppError('Error al obtener las estadísticas', 500);
    }
  }

  /**
   * Verificar si el área de servicio está abierta
   */
  private static isServiceAreaOpen(serviceArea: any): boolean {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()];
    
    const workingHours = serviceArea.workingHours[today];
    if (!workingHours.isOpen) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Calcular tiempo estimado de espera
   */
  private static async calculateEstimatedWaitTime(serviceAreaCode: string): Promise<number> {
    try {
      // Obtener número de turnos en espera
      const waitingTurns = await Turn.countDocuments({
        serviceAreaCode,
        status: TurnStatus.WAITING,
        isActive: true
      });

      // Obtener trabajadores activos en esta área
      const activeWorkers = await Worker.countDocuments({
        serviceAreas: serviceAreaCode,
        isActive: true,
        isOnline: true
      });

      if (activeWorkers === 0) return 60; // 1 hora si no hay trabajadores

      // Calcular tiempo promedio de servicio
      const avgServiceTime = await Turn.aggregate([
        {
          $match: {
            serviceAreaCode,
            status: TurnStatus.COMPLETED,
            serviceDuration: { $exists: true, $gt: 0 },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // últimos 7 días
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$serviceDuration' }
          }
        }
      ]);

      const averageServiceTime = avgServiceTime[0]?.avgDuration || 5; // 5 minutos por defecto
      
      // Calcular tiempo estimado
      const estimatedTime = Math.round((waitingTurns * averageServiceTime) / activeWorkers);
      
      return Math.max(estimatedTime, 1); // Mínimo 1 minuto
    } catch (error) {
      console.error('Error calculating wait time:', error);
      return 10; // Tiempo por defecto en caso de error
    }
  }

  /**
   * Actualizar historial del cliente
   */
  private static async updateCustomerHistory(customerData: any, turnNumber: string, serviceAreaCode: string) {
    try {
      if (!customerData.idNumber) return;

      let customer = await Customer.findOne({ idNumber: customerData.idNumber });
      
      if (!customer) {
        // Crear nuevo cliente
        customer = new Customer({
          idNumber: customerData.idNumber,
          name: customerData.name || 'No proporcionado',
          lastName: customerData.lastName || 'No proporcionado',
          phone: customerData.phone,
          isPriority: customerData.isPriority || false,
          priorityType: customerData.priorityType,
          visitHistory: []
        });
      }

      // Agregar visita al historial
      customer.visitHistory.push({
        date: new Date(),
        serviceArea: serviceAreaCode,
        turnNumber,
        attendedBy: undefined, // Se actualizará cuando sea atendido
        duration: undefined
      });

      await customer.save();
    } catch (error) {
      console.error('Error updating customer history:', error);
      // No lanzar error para no afectar la creación del turno
    }
  }
}