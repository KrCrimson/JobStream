import mongoose from 'mongoose';
import { Worker } from '../models/Worker';
import { Turn } from '../models/Turn';
import { ServiceArea } from '../models/ServiceArea';
import { Customer } from '../models/Customer';

async function clearDatabase() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream';
    await mongoose.connect(mongoUri);

    console.log('🔄 Conectado a MongoDB');
    console.log('🗑️  Limpiando colecciones...');

    // Limpiar todas las colecciones excepto User y SystemConfig
    await Worker.deleteMany({});
    console.log('✅ Trabajadores eliminados');

    await Turn.deleteMany({});
    console.log('✅ Turnos eliminados');

    await ServiceArea.deleteMany({});
    console.log('✅ Áreas de servicio eliminadas');

    await Customer.deleteMany({});
    console.log('✅ Clientes eliminados');

    console.log('\n🎉 Base de datos limpiada exitosamente!');
    console.log('ℹ️  Se mantuvieron: Users y SystemConfig');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    process.exit(1);
  }
}

clearDatabase();
