import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import passport from './config/passport.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Allowlist-based CORS — handles trailing slashes and multiple environments
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  env.FRONTEND_URL.replace(/\/$/, ''), // strip trailing slash from env var
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(helmet());
app.use(passport.initialize());

// Health check — root route so Render/browser visitors get a clear signal
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: '🚀 Intelligent Code Review System API is running',
    version: '1.0.0',
    docs: '/api',
  });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
