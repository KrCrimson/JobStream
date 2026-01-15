import mongoose from 'mongoose';
import { ServiceArea } from '../models/ServiceArea';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function openServiceAreas() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream');
    console.log('✅ Conectado a MongoDB');

    // Abrir todas las áreas de servicio
    const result = await ServiceArea.updateMany(
      {},
      { 
        $set: { 
          isOpen: true,
          'workingHours.monday.isOpen': true,
          'workingHours.monday.start': '00:00',
          'workingHours.monday.end': '23:59',
          'workingHours.tuesday.isOpen': true,
          'workingHours.tuesday.start': '00:00',
          'workingHours.tuesday.end': '23:59',
          'workingHours.wednesday.isOpen': true,
          'workingHours.wednesday.start': '00:00',
          'workingHours.wednesday.end': '23:59',
          'workingHours.thursday.isOpen': true,
          'workingHours.thursday.start': '00:00',
          'workingHours.thursday.end': '23:59',
          'workingHours.friday.isOpen': true,
          'workingHours.friday.start': '00:00',
          'workingHours.friday.end': '23:59',
          'workingHours.saturday.isOpen': true,
          'workingHours.saturday.start': '00:00',
          'workingHours.saturday.end': '23:59',
          'workingHours.sunday.isOpen': true,
          'workingHours.sunday.start': '00:00',
          'workingHours.sunday.end': '23:59'
        } 
      }
    );

    console.log(`✅ ${result.modifiedCount} áreas de servicio abiertas (24/7)`);

    const areas = await ServiceArea.find();
    console.log('\n📋 Áreas actualizadas:');
    areas.forEach(area => {
      console.log(`  - ${area.name} (${area.code}): 🟢 Abierta 24/7`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

openServiceAreas();
