import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import userRoutes from './routes/user';
import uploadRoutes from './routes/upload';
import businessRoutes from './routes/business';
import historyRoutes from './routes/history';
import adminRoutes from './routes/admin';
import { CronJobService } from './services/cronJobService';

dotenv.config();

const app = express();
app.use(cors({
  origin: true, // Allow all origins for now to debug the issue
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));




const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is not set. Please check your .env file.');
}

console.log('MongoDB URI:', MONGO_URI);
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Ensure indexes are created (including TTL on tasks)
mongoose.connection.on('open', async () => {
  try {
    const models = [
      { name: 'User', model: (await import('./models/User')).default },
      { name: 'Task', model: (await import('./models/Task')).default },
      { name: 'Business', model: (await import('./models/Business')).default },
      { name: 'TaskHistory', model: (await import('./models/TaskHistory')).TaskHistory },
    ];

    for (const { name, model } of models) {
      try {
        await model.syncIndexes();
        console.log(`${name} indexes synced`);
      } catch (indexErr: unknown) {
        const error = indexErr as { code?: number; message?: string };
        if (error.code === 86) { // IndexKeySpecsConflict
          console.warn(`Index conflict in ${name} model - existing indexes may differ:`, error.message);
        } else {
          console.error(`Failed to sync ${name} indexes:`, error.message);
        }
      }
    }
    console.log('Index synchronization completed');
  } catch (err) {
    console.error('Failed to sync indexes:', err);
  }
});

app.get('/', (req, res) => {
  res.send('Micro Volunteer Platform API is running');
});

// First register auth routes without auth middleware
app.use('/api/auth', authRoutes);

// Then register all other routes with auth middleware
app.use('/api/tasks', taskRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize cron jobs for streak management
  try {
    CronJobService.initializeCronJobs();
    console.log('🚀 Volunteer streak management system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error);
  }
});
