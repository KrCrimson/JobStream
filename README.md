# JobStream - Professional Queue System 🚀

A complete, production-ready job queue management system built with Node.js, React, MongoDB, Redis, and BullMQ.

## 🌟 Features

### Core Functionality
- **Dynamic Queue Management**: Create and manage multiple job queues
- **Job Lifecycle**: Complete job lifecycle from creation to completion
- **Worker System**: Scalable worker processes with configurable concurrency
- **Real-time Updates**: WebSocket-based live updates for jobs and metrics
- **Priority Queue**: Support for job priorities (low, normal, high, urgent)
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Scheduling**: Delayed and recurring jobs support

### Dashboard Features
- **Overview Dashboard**: System metrics and health indicators
- **Queue Management**: CRUD operations for queues
- **Job Monitoring**: Track jobs with filters and search
- **Worker Panel**: Monitor worker status and performance
- **Real-time Metrics**: Live charts and statistics

### Technical Features
- **Authentication**: JWT-based authentication with role-based access
- **API Rate Limiting**: Protection against abuse
- **Clean Architecture**: Separation of concerns (Controllers → Services → Models)
- **TypeScript**: Full type safety across frontend and backend

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 5+
- Redis 6+

## 🚀 Quick Start

3. **Access the application**
- Frontend: http://localhost
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/v1

4. **Default credentials**
```
Email: admin@jobstream.com
Password: admin123
```

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

1. **Clone the repository**
```bash
git clone <repository-url>
cd JobStream
```

2. **Start MongoDB and Redis**
```bash
# You need MongoDB and Redis running on your system
# Or use Docker if you prefer:
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7-alpine
```

3. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration if needed
```

4. **Setup Frontend**
```bash
cd ../frontend
npm install
```

5. **Start the system**

In two separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

6. **Initialize sample data**
```bash
cd backend
npm run seed
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

# Production build
npm run build
npm run preview
```

## 📁 Project Structure

```
JobStream/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # MongoDB schemas
│   │   ├── queues/          # Queue management
│   │   ├── workers/         # Job processors
│   │   ├── middleware/      # Auth, validation, etc.
│   │   ├── websockets/      # Real-time events
│   │   ├── routes/          # API routes
│   │   ├── config/          # Configuration
│   │   ├── utils/           # Helpers
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Main application pages
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API calls
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helpers
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml       # Production Docker setup
├── docker-compose.dev.yml   # Development Docker setup
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/jobstream

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Workers
WORKER_CONCURRENCY=5
WORKER_MAX_RETRIES=3
```

## 📡 API Documentation

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Queues

#### Create Queue
```http
POST /api/v1/queues
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "my-queue",
  "description": "Queue description",
  "concurrency": 5
}
```

#### Get All Queues
```http
GET /api/v1/queues
Authorization: Bearer <token>
```

### Jobs

#### Create Job
```http
POST /api/v1/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "queueName": "my-queue",
  "type": "email_sending",
  "priority": 2,
  "data": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "Test email"
  }
}
```

#### Get All Jobs
```http
GET /api/v1/jobs?queueName=my-queue&status=pending
Authorization: Bearer <token>
```

#### Retry Job
```http
POST /api/v1/jobs/:jobId/retry
Authorization: Bearer <token>
```

## 🎯 Job Types

The system supports the following job types:

- `email_sending` - Send emails
- `image_processing` - Process images
- `data_backup` - Backup data
- `report_generation` - Generate reports
- `api_sync` - Sync with external APIs
- `cleanup_tasks` - Clean up old data

## 🔐 Security

- JWT authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Monitoring

The system provides real-time monitoring for:

- Queue metrics (waiting, active, completed, failed jobs)
- Worker status and performance
- Job progress and status
- System health indicators

## 🔄 Worker Processing

Workers automatically process jobs with:

- Configurable concurrency
- Automatic retries with exponential backoff
- Progress tracking
- Error handling and logging
- Graceful shutdown

## 🛠️ Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs jobstream-mongodb
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# View Redis logs
docker logs jobstream-redis
```

### Worker Not Processing Jobs
- Check worker status in the dashboard
- Verify queue is active
- Check backend logs for errors

## 📝 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@jobstream.com or open an issue in the repository.

---

Built with ❤️ using Node.js, React, MongoDB, Redis, and BullMQ
