import { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from '../services/SystemConfigService';

const configService = new SystemConfigService();

export class SystemConfigController {
  /**
   * Obtener configuración del sistema
   */
  async getConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await configService.getConfig();
      
      res.json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: { config }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar configuración del sistema
   */
  async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updates = req.body;
      const config = await configService.updateConfig(updates);
      
      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: { config }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resetear configuración a valores por defecto
   */
  async resetConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await configService.resetConfig();
      
      res.json({
        success: true,
        message: 'Configuración restablecida a valores por defecto',
        data: { config }
      });
    } catch (error) {
      next(error);
    }
  }
}
