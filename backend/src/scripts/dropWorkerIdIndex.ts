import mongoose from 'mongoose';
import { Worker } from '../models/Worker';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function dropWorkerIdIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream');
    console.log('✅ Conectado a MongoDB');

    // Eliminar el índice workerId_1 que está causando problemas
    await Worker.collection.dropIndex('workerId_1');
    console.log('✅ Índice workerId_1 eliminado exitosamente');

  } catch (error: any) {
    if (error.code === 27) {
      console.log('ℹ️  El índice workerId_1 no existe (ya fue eliminado)');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

dropWorkerIdIndex();
