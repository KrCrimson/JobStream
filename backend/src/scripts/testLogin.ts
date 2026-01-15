import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { logger } from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream';

const testLogin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Buscar usuario admin
    const user = await User.findOne({ email: 'admin@jobstream.com' }).select('+password');
    
    if (!user) {
      logger.error('❌ Admin user not found');
      return;
    }

    logger.info('✅ Admin user found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Probar contraseña
    const testPassword = 'Admin123!';
    const isValid = await user.comparePassword(testPassword);
    
    logger.info(`Password test result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    // Probar hash manual
    const bcrypt = require('bcryptjs');
    const manualCheck = await bcrypt.compare(testPassword, user.password);
    logger.info(`Manual bcrypt check: ${manualCheck ? '✅ VALID' : '❌ INVALID'}`);

  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
  }
};

// Ejecutar el script
testLogin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
