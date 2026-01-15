import { SystemConfig, ISystemConfig } from '../models/SystemConfig';
import { logger } from '../utils/logger';

export class SystemConfigService {
  /**
   * Obtener la configuración del sistema
   */
  async getConfig(): Promise<ISystemConfig> {
    try {
      const config = await (SystemConfig as any).getConfig();
      return config;
    } catch (error) {
      logger.error('Error getting system config:', error);
      throw error;
    }
  }

  /**
   * Actualizar la configuración del sistema
   */
  async updateConfig(updates: Partial<ISystemConfig>): Promise<ISystemConfig> {
    try {
      let config = await SystemConfig.findOne();
      
      if (!config) {
        config = await SystemConfig.create(updates);
      } else {
        Object.assign(config, updates);
        await config.save();
      }
      
      logger.info('System config updated');
      return config;
    } catch (error) {
      logger.error('Error updating system config:', error);
      throw error;
    }
  }

  /**
   * Resetear configuración a valores por defecto
   */
  async resetConfig(): Promise<ISystemConfig> {
    try {
      await SystemConfig.deleteMany({});
      const config = await SystemConfig.create({});
      
      logger.info('System config reset to defaults');
      return config;
    } catch (error) {
      logger.error('Error resetting system config:', error);
      throw error;
    }
  }
}
