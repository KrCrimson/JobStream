import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { logger } from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream';

const createAdminUser = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: 'sa2019062986@virtual.upt.pe' });
    
    if (existingAdmin) {
      logger.info('⚠️  Admin user already exists');
      logger.info('Email: sa2019062986@virtual.upt.pe');
      return;
    }

    // Borrar admin anterior si existe
    await User.deleteOne({ email: 'admin@jobstream.com' });

    // Crear usuario admin
    await User.create({
      email: 'sa2019062986@virtual.upt.pe',
      password: 'Elarce12',
      name: 'Administrador Principal',
      role: 'admin',
      isActive: true
    });

    logger.info('✅ Admin user created successfully!');
    logger.info('================================');
    logger.info('Email: sa2019062986@virtual.upt.pe');
    logger.info('Password: Elarce12');
    logger.info('Role: admin');
    logger.info('================================');

  } catch (error) {
    logger.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
  }
};

// Ejecutar el script
createAdminUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
