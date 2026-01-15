import cron from 'node-cron';
import { Turn } from '../models/Turn';
import { TurnStatus } from '../types';

export class TurnCleanupService {
  private static isRunning = false;

  /**
   * Iniciar el servicio de limpieza automática
   */
  static start() {
    // Ejecutar todos los días a las 00:00 (medianoche)
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldTurns();
    });

    console.log('🧹 Servicio de limpieza automática de turnos iniciado');
    console.log('⏰ Se ejecutará todos los días a las 00:00');
  }

  /**
   * Limpiar turnos antiguos
   */
  static async cleanupOldTurns() {
    if (this.isRunning) {
      console.log('⚠️ Ya hay una limpieza en proceso, omitiendo...');
      return;
    }

    this.isRunning = true;
    console.log('🧹 Iniciando limpieza automática de turnos...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      // Eliminar turnos completados y cancelados de días anteriores
      const result = await Turn.deleteMany({
        createdAt: { $lt: yesterday },
        status: { $in: [TurnStatus.COMPLETED, TurnStatus.CANCELLED] }
      });

      console.log(`✅ Limpieza completada: ${result.deletedCount} turnos eliminados`);

      // Verificar si hay turnos antiguos en espera o en progreso (posible error)
      const stuckTurns = await Turn.find({
        createdAt: { $lt: yesterday },
        status: { $in: [TurnStatus.WAITING, TurnStatus.IN_PROGRESS] }
      });

      if (stuckTurns.length > 0) {
        console.log(`⚠️ Encontrados ${stuckTurns.length} turnos antiguos sin completar`);
        
        // Cancelar automáticamente turnos viejos que quedaron en espera o en progreso
        await Turn.updateMany(
          {
            createdAt: { $lt: yesterday },
            status: { $in: [TurnStatus.WAITING, TurnStatus.IN_PROGRESS] }
          },
          {
            $set: {
              status: TurnStatus.CANCELLED,
              cancelledAt: new Date(),
              cancellationReason: 'Auto-cancelado por limpieza automática (turno del día anterior)'
            }
          }
        );
        
        console.log(`✅ ${stuckTurns.length} turnos antiguos cancelados automáticamente`);
      }

      // Mostrar estadísticas del día actual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await Turn.aggregate([
        {
          $match: {
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('📊 Estadísticas del día actual:');
      todayStats.forEach(stat => {
        console.log(`   - ${stat._id}: ${stat.count}`);
      });

    } catch (error) {
      console.error('❌ Error en limpieza automática:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Ejecutar limpieza manual (para testing)
   */
  static async manualCleanup() {
    console.log('🧹 Ejecutando limpieza manual...');
    await this.cleanupOldTurns();
  }
}
