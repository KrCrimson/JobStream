import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { logger } from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream';

const updateAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Eliminar usuario admin anterior
    const deleted = await User.deleteMany({ 
      $or: [
        { email: 'admin@jobstream.com' },
        { email: 'sa2019062986@virtual.upt.pe' }
      ]
    });
    logger.info(`🗑️  Deleted ${deleted.deletedCount} admin user(s)`);

    // Crear nuevo usuario admin
    const newAdmin = await User.create({
      email: 'sa2019062986@virtual.upt.pe',
      password: 'Elarce12',
      name: 'Administrador Principal',
      role: 'admin',
      isActive: true
    });

    logger.info('✅ New admin user created!');
    logger.info('================================');
    logger.info('Email: sa2019062986@virtual.upt.pe');
    logger.info('Password: Elarce12');
    logger.info('Role: admin');
    logger.info('================================');

  } catch (error) {
    logger.error('❌ Error updating admin:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

updateAdmin();
