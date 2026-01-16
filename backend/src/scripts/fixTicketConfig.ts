import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SystemConfig } from '../models/SystemConfig';
import { logger } from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream';

const fixTicketConfig = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');
    
    // Actualizar o crear configuración
    const result = await SystemConfig.updateOne(
      {},
      {
        $set: {
          'ticketFormat.useAreaCode': true,
          'ticketFormat.numberLength': 3,
          'ticketFormat.prefix': 'T'
        }
      },
      { upsert: true }
    );

    logger.info('✅ Ticket configuration updated!');
    logger.info('================================');
    logger.info('useAreaCode: true (usará CA, FA, etc.)');
    logger.info('numberLength: 3 (001, 002, 003...)');
    logger.info('prefix: T (solo se usa si useAreaCode = false)');
    logger.info('================================');
    logger.info(result);

  } catch (error) {
    logger.error('❌ Error updating config:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

fixTicketConfig();
