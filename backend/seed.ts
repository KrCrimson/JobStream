import mongoose from 'mongoose';
import { User } from './src/models/User';
import { Queue } from './src/models/Queue';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobstream');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Queue.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Create admin user
    const adminUser = await User.create({
      email: 'admin@jobstream.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    });
    console.log('✅ Created admin user');
    
    // Create regular user
    const regularUser = await User.create({
      email: 'user@jobstream.com',
      password: 'user123',
      name: 'Regular User',
      role: 'user',
    });
    console.log('✅ Created regular user');
    
    // Create default queues
    const queues = [
      {
        name: 'default',
        description: 'Default queue for general tasks',
        concurrency: 5,
        isActive: true,
      },
      {
        name: 'high-priority',
        description: 'High priority queue for urgent tasks',
        concurrency: 10,
        isActive: true,
      },
      {
        name: 'low-priority',
        description: 'Low priority queue for background tasks',
        concurrency: 2,
        isActive: true,
      },
      {
        name: 'emails',
        description: 'Queue for email processing',
        concurrency: 5,
        isActive: true,
      },
    ];
    
    await Queue.insertMany(queues);
    console.log('✅ Created default queues');
    
    console.log('\n📊 Seed data created successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@jobstream.com / admin123');
    console.log('   User:  user@jobstream.com / user123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
