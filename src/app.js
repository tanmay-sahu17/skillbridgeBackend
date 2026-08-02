import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import errorHandler from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.route.js';
import collegeRoutes from './modules/college/college.route.js';
import studentRoutes from './modules/student/student.route.js';

const app = express();

// ── Security & Parsing Middlewares ──
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──
app.use(errorHandler);

export default app;
