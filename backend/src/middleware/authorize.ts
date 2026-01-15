import { Request, Response, NextFunction } from 'express';
import { IJWTPayload } from '../types';

export interface AuthRequest extends Request {
  user?: IJWTPayload;
}

/**
 * Middleware para autorizar acceso basado en roles
 * @param roles - Array de roles permitidos
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que el trabajador solo acceda a sus propios recursos
 */
export const authorizeWorkerOwn = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
    return;
  }

  // Admin puede acceder a todo
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Verificar que el trabajador solo acceda a sus propios datos
  const resourceWorkerId = req.params.workerId || req.body.workerId;
  
  if (req.user.role === 'worker' && req.user.workerId !== resourceWorkerId) {
    res.status(403).json({
      success: false,
      message: 'Solo puedes acceder a tus propios datos'
    });
    return;
  }

  next();
};
