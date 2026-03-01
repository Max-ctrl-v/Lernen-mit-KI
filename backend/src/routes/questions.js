import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as sessionService from '../services/sessionService.js';
import { PHASES } from '../config/constants.js';

const router = Router();

// GET /api/sessions/:id/questions
router.get(
  '/:id/questions',
  asyncHandler(async (req, res) => {
    const session = await sessionService.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (![PHASES.RECALL, PHASES.COMPLETED].includes(session.phase)) {
      return res.status(403).json({ error: 'Questions not available in this phase' });
    }

    const questions = await sessionService.getQuestions(session.id, session.phase);
    res.json(questions);
  })
);

// POST /api/sessions/:id/submit — submit all answers
router.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const { answers, recallTimeSpent } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers must be an array' });
    }
    const result = await sessionService.submitAnswers(
      req.params.id,
      answers,
      recallTimeSpent
    );
    res.json(result);
  })
);

export default router;
