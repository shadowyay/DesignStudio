import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import userRoutes from './routes/user';
import uploadRoutes from './routes/upload';

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
    await Promise.all([
      (await import('./models/Task')).default.syncIndexes(),
    ]);
    console.log('Indexes synced');
  } catch (err) {
    console.error('Failed to sync indexes:', err);
  }
});

app.get('/', (req, res) => {
  res.send('Micro Volunteer Platform API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
