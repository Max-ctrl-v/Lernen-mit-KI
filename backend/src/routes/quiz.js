import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';
import { upload } from '../middleware/upload.js';
import { quizRateLimit } from '../middleware/quizRateLimit.js';
import * as quizService from '../services/quizService.js';

const router = Router();

// GET /api/quiz/history — must be before /:id
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const history = await quizService.getQuizHistory(page, limit);
    res.json(history);
  })
);

// POST /api/quiz — upload file + generate quiz (rate limited)
router.post(
  '/',
  quizRateLimit,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const questionCount = parseInt(req.body.questionCount) || 10;
    if (questionCount < 5 || questionCount > 30) {
      return res.status(400).json({ error: 'Fragenanzahl muss zwischen 5 und 30 liegen.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen.' });
    }
    const skipImages = req.body.skipImages === 'true';
    const quiz = await quizService.createQuiz(req.file, questionCount, skipImages);
    res.status(201).json(quiz);
  })
);

// POST /api/quiz/:id/retake — reset quiz for retaking
router.post(
  '/:id/retake',
  asyncHandler(async (req, res) => {
    const quiz = await quizService.retakeQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz nicht gefunden' });
    res.json(quiz);
  })
);

// GET /api/quiz/:id — get quiz with questions
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const quiz = await quizService.getQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz nicht gefunden' });
    res.json(quiz);
  })
);

// POST /api/quiz/:id/submit — submit quiz answers
router.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length > 100) {
      return res.status(400).json({ error: 'answers muss ein Array mit max. 100 Einträgen sein' });
    }
    const result = await quizService.submitQuizAnswers(req.params.id, answers);
    res.json(result);
  })
);

// DELETE /api/quiz/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await quizService.deleteQuiz(req.params.id);
    res.status(204).end();
  })
);

export default router;
