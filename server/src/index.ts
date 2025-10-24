import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import habitRoutes from './routes/habits';
import challengeRoutes from './routes/challenges';
import friendRoutes from './routes/friends';
import progressRoutes from './routes/progress';
import { authenticateToken } from './middleware/auth';

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
const allowed = [process.env.CLIENT_URL || 'http://localhost:3001', 'http://localhost:3001', 'http://localhost:3000', 'https://yatharth023.github.io'];
app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (curl, same-origin server) or match list
    if (!origin || allowed.indexOf(origin) !== -1) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,  // if you send cookies or auth
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', authenticateToken, habitRoutes);
app.use('/api/challenges', authenticateToken, challengeRoutes);
app.use('/api/friends', authenticateToken, friendRoutes);
app.use('/api/progress', authenticateToken, progressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
