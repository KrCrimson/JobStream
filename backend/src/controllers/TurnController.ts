import { Request, Response } from 'express';
import { TurnService } from '../services/TurnService';
import { TurnStatus, TurnPriority } from '../types';
import { AppError } from '../middleware/errorHandler';

export class TurnController {
  /**
   * Crear un nuevo turno
   */
  static async createTurn(req: Request, res: Response): Promise<void> {
    try {
      console.log('🎫 Creando turno - Request body:', req.body);
      
      const {
        serviceAreaCode,
        priority,
        customerData,
        notes
      } = req.body;

      if (!serviceAreaCode) {
        throw new AppError('El código del área de servicio es requerido', 400);
      }

      console.log('📋 serviceAreaCode:', serviceAreaCode);
      console.log('👤 customerData:', customerData);

      const turn = await TurnService.createTurn({
        serviceAreaCode: serviceAreaCode.toUpperCase(),
        priority,
        customerData,
        notes
      });

      console.log('✅ Turno creado exitosamente:', turn.turnNumber);

      res.status(201).json({
        success: true,
        message: 'Turno creado exitosamente',
        data: {
          turn
        }
      });
    } catch (error: any) {
      console.error('❌ Error in createTurn:', error);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Error message:', error?.message);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  }

  /**
   * Llamar al siguiente turno
   */
  static async callNextTurn(req: Request, res: Response): Promise<void> {
    try {
      const { serviceAreaCode } = req.params;
      const userEmail = req.user?.email; // Email del usuario autenticado

      if (!userEmail) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const turn = await TurnService.callNextTurn(
        serviceAreaCode.toUpperCase(),
        userEmail
      );

      if (!turn) {
        res.status(200).json({
          success: true,
          message: 'No hay turnos en espera',
          data: {
            turn: null
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Turno llamado exitosamente',
        data: {
          turn
        }
      });
    } catch (error) {
      console.error('Error in callNextTurn:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Atender turno
   */
  static async attendTurn(req: Request, res: Response): Promise<void> {
    try {
      const { turnId } = req.params;
      const userEmail = req.user?.email;

      if (!userEmail) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const turn = await TurnService.attendTurn(turnId, userEmail);

      res.status(200).json({
        success: true,
        message: 'Turno marcado como en atención',
        data: {
          turn
        }
      });
    } catch (error) {
      console.error('Error in attendTurn:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Completar turno
   */
  static async completeTurn(req: Request, res: Response): Promise<void> {
    try {
      const { turnId } = req.params;
      const workerId = req.user?.id;

      if (!workerId) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const turn = await TurnService.completeTurn(turnId, workerId);

      res.status(200).json({
        success: true,
        message: 'Turno completado exitosamente',
        data: {
          turn
        }
      });
    } catch (error) {
      console.error('Error in completeTurn:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Cancelar turno
   */
  static async cancelTurn(req: Request, res: Response): Promise<void> {
    try {
      const { turnId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new AppError('La razón de cancelación es requerida', 400);
      }

      const turn = await TurnService.cancelTurn(turnId, reason);

      res.status(200).json({
        success: true,
        message: 'Turno cancelado exitosamente',
        data: {
          turn
        }
      });
    } catch (error) {
      console.error('Error in cancelTurn:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Obtener turnos con filtros
   */
  static async getTurns(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceAreaCode,
        status,
        priority,
        workerId,
        customerIdNumber,
        startDate,
        endDate,
        limit = 50,
        skip = 0
      } = req.query;

      const filters: any = {};

      if (serviceAreaCode) filters.serviceAreaCode = (serviceAreaCode as string).toUpperCase();
      if (status && Object.values(TurnStatus).includes(status as TurnStatus)) {
        filters.status = status;
      }
      if (priority && Object.values(TurnPriority).includes(priority as TurnPriority)) {
        filters.priority = priority;
      }
      if (workerId) filters.workerId = workerId;
      if (customerIdNumber) filters.customerIdNumber = customerIdNumber;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      filters.limit = parseInt(limit as string);
      filters.skip = parseInt(skip as string);

      const result = await TurnService.getTurns(filters);

      res.status(200).json({
        success: true,
        message: 'Turnos obtenidos exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error in getTurns:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener turno por ID
   */
  static async getTurnById(req: Request, res: Response): Promise<void> {
    try {
      const { turnId } = req.params;
      
      const result = await TurnService.getTurns({ customerIdNumber: turnId });
      
      if (result.turns.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Turno no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Turno obtenido exitosamente',
        data: {
          turn: result.turns[0]
        }
      });
    } catch (error) {
      console.error('Error in getTurnById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de turnos
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { serviceAreaCode, date } = req.query;

      const targetDate = date ? new Date(date as string) : undefined;
      const areaCode = serviceAreaCode ? (serviceAreaCode as string).toUpperCase() : undefined;

      const statistics = await TurnService.getStatistics(areaCode, targetDate);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          statistics
        }
      });
    } catch (error) {
      console.error('Error in getStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener turnos para pantalla de llamadas (display)
   */
  static async getDisplayTurns(req: Request, res: Response): Promise<void> {
    try {
      const { serviceAreaCode } = req.query;

      const filters: any = {
        status: TurnStatus.CALLED,
        limit: 10,
        skip: 0
      };

      if (serviceAreaCode) {
        filters.serviceAreaCode = (serviceAreaCode as string).toUpperCase();
      }

      const result = await TurnService.getTurns(filters);

      // También obtener el siguiente turno en espera
      const nextInWaiting = await TurnService.getTurns({
        status: TurnStatus.WAITING,
        serviceAreaCode: filters.serviceAreaCode,
        limit: 1,
        skip: 0
      });

      res.status(200).json({
        success: true,
        message: 'Turnos para pantalla obtenidos exitosamente',
        data: {
          calledTurns: result.turns,
          nextTurn: nextInWaiting.turns[0] || null,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error in getDisplayTurns:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener información del turno para el cliente (por número)
   */
  static async getTurnByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { turnNumber } = req.params;

      const result = await TurnService.getTurns({});
      const turn = result.turns.find(t => t.turnNumber === turnNumber.toUpperCase());

      if (!turn) {
        res.status(404).json({
          success: false,
          message: 'Turno no encontrado'
        });
        return;
      }

      // Solo devolver información básica para el cliente
      const publicTurnInfo = {
        turnNumber: turn.turnNumber,
        serviceAreaName: turn.serviceAreaName,
        status: turn.status,
        estimatedWaitTime: turn.estimatedWaitTime,
        actualWaitTime: turn.actualWaitTime,
        windowNumber: turn.windowNumber,
        createdAt: turn.createdAt,
        calledAt: turn.calledAt
      };

      res.status(200).json({
        success: true,
        message: 'Información del turno obtenida',
        data: {
          turn: publicTurnInfo
        }
      });
    } catch (error) {
      console.error('Error in getTurnByNumber:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener turnos activos (en espera o en progreso)
   */
  static async getActiveTurns(_req: Request, res: Response): Promise<void> {
    try {
      const [waitingResult, calledResult, inProgressResult] = await Promise.all([
        TurnService.getTurns({ status: TurnStatus.WAITING, limit: 100, skip: 0 }),
        TurnService.getTurns({ status: TurnStatus.CALLED, limit: 100, skip: 0 }),
        TurnService.getTurns({ status: TurnStatus.IN_PROGRESS, limit: 100, skip: 0 }),
      ]);

      const allActive = [...waitingResult.turns, ...calledResult.turns, ...inProgressResult.turns].sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      res.status(200).json({
        success: true,
        message: 'Turnos activos obtenidos',
        data: allActive
      });
    } catch (error) {
      console.error('Error in getActiveTurns:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de turnos
   */
  static async getTurnStats(_req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalToday, waiting, inProgress, completed, cancelled] = await Promise.all([
        TurnService.getTurns({ startDate: today, limit: 9999 }),
        TurnService.getTurns({ status: TurnStatus.WAITING, limit: 9999 }),
        TurnService.getTurns({ status: TurnStatus.IN_PROGRESS, limit: 9999 }),
        TurnService.getTurns({ status: TurnStatus.COMPLETED, startDate: today, limit: 9999 }),
        TurnService.getTurns({ status: TurnStatus.CANCELLED, startDate: today, limit: 9999 }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas',
        data: {
          totalToday: totalToday.turns?.length || 0,
          waiting: waiting.turns?.length || 0,
          inProgress: inProgress.turns?.length || 0,
          completed: completed.turns?.length || 0,
          cancelled: cancelled.turns?.length || 0,
          averageWaitTime: 0, // TODO: Calcular tiempo promedio
          activeWorkers: 0, // TODO: Obtener trabajadores activos
          totalServiceAreas: 0, // TODO: Obtener áreas totales
        }
      });
    } catch (error) {
      console.error('Error in getTurnStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}