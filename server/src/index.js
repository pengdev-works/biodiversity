/**
 * src/index.js
 * ABRAVENTURE / BIODIVERSITY backend entry point.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';

import { initializeDatabase } from './db.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import speciesRouter from './routes/species.js';
import photosRouter from './routes/photos.js';
import modelsRouter from './routes/models.js';
import magazineRouter from './routes/magazine.js';
import publicRouter from './routes/public.js';
import teamRouter from './routes/team.js';
import contributorsRouter from './routes/contributors.js';

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...configuredOrigins,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    try {
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const hostname = new URL(origin).hostname;

      // Allow configured origins, any vercel.app domain, localhost, or non-production
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        hostname.endsWith('.vercel.app') ||
        hostname === 'localhost' ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
    } catch {
      // If URL parsing fails, fallback
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/species', speciesRouter);
app.use('/api/photos', photosRouter);
app.use('/api/models', modelsRouter);
app.use('/api/magazine', magazineRouter);
app.use('/api/public', publicRouter);
app.use('/api/team', teamRouter);
app.use('/api/contributors', contributorsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'BIODIVERSITY Interactive 3D Digital Magazine',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
  try {
    await initializeDatabase();
  } catch (dbErr) {
    console.warn('⚠️ Non-fatal database initialization warning:', dbErr.message);
  }

  try {
    const server = app.listen(PORT, () => {
      console.log(`✓ BIODIVERSITY API Server listening on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use. Please terminate the conflicting process.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to start HTTP server:', err);
    process.exit(1);
  }
}

startServer();

