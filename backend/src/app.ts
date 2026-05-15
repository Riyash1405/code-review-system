import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import passport from './config/passport.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

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
