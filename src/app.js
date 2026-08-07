import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import errorHandler from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.route.js';
import collegeRoutes from './modules/college/college.route.js';
import studentRoutes from './modules/student/student.route.js';
import searchRoutes from './modules/search/search.route.js';
import adminRoutes from './modules/admin/admin.route.js';
import gigRoutes from './modules/gig/gig.route.js';
import uploadRoutes from './modules/upload/upload.route.js';

const app = express();

// ── Security & Parsing Middlewares ──
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Frontend dev URLs
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static Files ──
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
    },
    message: 'System health is optimal.',
  });
});

// ── API Routes (v1) ──
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/college', collegeRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/gig', gigRoutes);
app.use('/api/v1/upload', uploadRoutes);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──
app.use(errorHandler);

export default app;
