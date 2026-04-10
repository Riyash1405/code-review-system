import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import routes from './routes/index.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

app.use('/api', routes);

export default app;
