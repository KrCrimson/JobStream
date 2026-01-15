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
    const existingAdmin = await User.findOne({ email: 'admin@jobstream.com' });
    
    if (existingAdmin) {
      logger.info('⚠️  Admin user already exists');
      logger.info('Email: admin@jobstream.com');
      return;
    }

    // Crear usuario admin
    await User.create({
      email: 'admin@jobstream.com',
      password: 'Admin123!', // Cambiar esta contraseña en producción
      name: 'Administrador Principal',
      role: 'admin',
      isActive: true
    });

    logger.info('✅ Admin user created successfully!');
    logger.info('================================');
    logger.info('Email: admin@jobstream.com');
    logger.info('Password: Admin123!');
    logger.info('Role: admin');
    logger.info('================================');
    logger.info('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

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
