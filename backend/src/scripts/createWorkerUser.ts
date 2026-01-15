import mongoose from 'mongoose';
import { User } from '../models/User';
import { Worker } from '../models/Worker';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const createWorkerUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream';
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe
    const existingUser = await User.findOne({ email: 'trabajador@jobstream.com' });
    if (existingUser) {
      console.log('⚠️  El usuario trabajador@jobstream.com ya existe');
      console.log('Actualizando rol y contraseña...');
      existingUser.role = 'worker';
      existingUser.password = 'Worker123!'; // El hook pre-save lo hasheará automáticamente
      await existingUser.save();
      console.log('✅ Rol y contraseña actualizados');
    } else {
      // Crear usuario con rol worker
      const newUser = new User({
        name: 'Juan Trabajador',
        email: 'trabajador@jobstream.com',
        password: 'Worker123!', // El hook pre-save lo hasheará automáticamente
        role: 'worker',
        isActive: true,
      });
      await newUser.save();
      console.log('✅ Usuario worker creado');
    }

    // Verificar si ya existe un worker con ese email
    const existingWorker = await Worker.findOne({ email: 'trabajador@jobstream.com' });
    if (existingWorker) {
      console.log('⚠️  El trabajador ya existe');
      console.log('Áreas asignadas:', existingWorker.serviceAreas);
    } else {
      // Crear registro de trabajador
      const workerCount = await Worker.countDocuments();
      const newWorker = new Worker({
        name: 'Juan',
        lastName: 'Trabajador',
        employeeId: `EMP${String(workerCount + 1).padStart(4, '0')}`,
        username: 'trabajador',
        passwordHash: await bcrypt.hash('Worker123!', 10),
        email: 'trabajador@jobstream.com',
        role: 'operator',
        serviceAreas: ['CA', 'FA'], // Asignar a Caja y Farmacia
        isActive: true,
        isOnline: false,
        isAvailable: true,
        stats: {
          turnsAttendedToday: 0,
          turnsAttendedTotal: 0,
          averageServiceTime: 0,
          customerSatisfactionScore: 0,
          lastActivity: new Date(),
        },
        settings: {
          notifications: true,
          autoCallNext: false,
          breakTimeMinutes: 15,
          preferredServiceAreas: ['CA'],
        },
        workSchedule: {
          monday: { start: '08:00', end: '17:00', isWorkDay: true },
          tuesday: { start: '08:00', end: '17:00', isWorkDay: true },
          wednesday: { start: '08:00', end: '17:00', isWorkDay: true },
          thursday: { start: '08:00', end: '17:00', isWorkDay: true },
          friday: { start: '08:00', end: '17:00', isWorkDay: true },
          saturday: { start: '09:00', end: '14:00', isWorkDay: true },
          sunday: { start: '00:00', end: '00:00', isWorkDay: false },
        },
      });
      await newWorker.save();
      console.log('✅ Trabajador creado con áreas asignadas:', newWorker.serviceAreas);
    }

    console.log('\n📋 Credenciales:');
    console.log('   Email: trabajador@jobstream.com');
    console.log('   Password: Worker123!');
    console.log('   Rol: worker');
    console.log('   Áreas: CA (Caja), FA (Farmacia)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

createWorkerUser();
