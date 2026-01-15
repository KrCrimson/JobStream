#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 JobStream System Check\n');

// Check backend structure
const backendFiles = [
  'src/server.ts',
  'src/types/index.ts',
  'src/models/User.ts',
  'src/models/Job.ts',
  'src/models/Queue.ts',
  'src/models/Worker.ts',
  'src/services/AuthService.ts',
  'src/services/JobService.ts',
  'src/services/QueueService.ts',
  'src/services/WorkerService.ts',
  'src/controllers/AuthController.ts',
  'src/controllers/JobController.ts',
  'src/controllers/QueueController.ts',
  'src/controllers/WorkerController.ts',
  'src/routes/index.ts',
  'src/queues/QueueManager.ts',
  'src/workers/WorkerManager.ts',
  'src/websockets/index.ts',
  'package.json',
  '.env',
  'seed.ts'
];

const frontendFiles = [
  'src/App.tsx',
  'src/main.tsx',
  'src/types/index.ts',
  'src/components/Layout.tsx',
  'src/components/UI.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/QueuesPage.tsx',
  'src/pages/JobsPage.tsx',
  'src/pages/WorkersPage.tsx',
  'src/contexts/AuthContext.tsx',
  'src/contexts/SocketContext.tsx',
  'src/services/api.ts',
  'src/services/authService.ts',
  'src/services/queueService.ts',
  'src/services/jobService.ts',
  'src/services/workerService.ts',
  'src/services/socketService.ts',
  'package.json'
];

console.log('📁 Backend Files:');
let backendMissing = 0;
backendFiles.forEach(file => {
  const filePath = path.join(__dirname, 'backend', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    backendMissing++;
  }
});

console.log('\n📁 Frontend Files:');
let frontendMissing = 0;
frontendFiles.forEach(file => {
  const filePath = path.join(__dirname, 'frontend', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    frontendMissing++;
  }
});

console.log('\n📊 Summary:');
console.log(`Backend: ${backendFiles.length - backendMissing}/${backendFiles.length} files ✅`);
console.log(`Frontend: ${frontendFiles.length - frontendMissing}/${frontendFiles.length} files ✅`);

if (backendMissing === 0 && frontendMissing === 0) {
  console.log('\n🎉 SYSTEM COMPLETE - All files present!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start MongoDB and Redis');
  console.log('2. cd backend && npm install && npm run dev');
  console.log('3. cd frontend && npm install && npm run dev');
  console.log('4. cd backend && npm run seed');
  console.log('5. Open http://localhost:5173');
} else {
  console.log('\n⚠️  SYSTEM INCOMPLETE - Some files are missing!');
}