import mongoose from 'mongoose';
import { Turn } from '../models/Turn';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function clearTurns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream');
    console.log('✅ Conectado a MongoDB');

    // Eliminar todos los turnos
    const result = await Turn.deleteMany({});
    console.log(`✅ ${result.deletedCount} turnos eliminados`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

clearTurns();
