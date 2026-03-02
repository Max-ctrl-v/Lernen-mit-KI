import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth.js';
import sessionsRouter from './routes/sessions.js';
import questionsRouter from './routes/questions.js';
import statsRouter from './routes/stats.js';
import quizRouter from './routes/quiz.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust first proxy (Railway/Vercel) so req.ip returns real client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Public routes (no auth required)
app.use('/api/auth', authRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes (auth required)
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/sessions', requireAuth, questionsRouter);
app.use('/api/stats', requireAuth, statsRouter);
app.use('/api/quiz', requireAuth, quizRouter);

// Generated images (DALL-E) — UUID filenames, source files deleted after processing
app.use('/uploads', express.static('uploads'));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MedAT Trainer backend running on http://localhost:${PORT}`);
});
