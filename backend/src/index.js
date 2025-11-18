import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Routes
import authRoutes from './routes/auth.js';
import causesRoutes from './routes/causes.js';
import stepsRoutes from './routes/steps.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'protest-simulator-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize data directories
const dataPath = join(__dirname, '../data');
const initDataDirs = async () => {
  const dirs = ['causes', 'users', 'steps', 'messages'];
  for (const dir of dirs) {
    const dirPath = join(dataPath, dir);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/causes', causesRoutes);
app.use('/api/steps', stepsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
initDataDirs().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Protest Simulator Backend running on port ${PORT}`);
    console.log(`📊 Data stored in: ${dataPath}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Failed to initialize data directories:', err);
  process.exit(1);
});

export default app;
