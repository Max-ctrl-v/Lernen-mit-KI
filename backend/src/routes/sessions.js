import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as sessionService from '../services/sessionService.js';
import { MODES } from '../config/constants.js';

const router = Router();

// POST /api/sessions — create new session
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { mode = MODES.PRACTICE, distractionDuration } = req.body;
    if (![MODES.PRACTICE, MODES.EXAM].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    const session = await sessionService.createSession(mode, distractionDuration);
    res.status(201).json(session);
  })
);

// GET /api/sessions/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = await sessionService.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  })
);

// PATCH /api/sessions/:id/phase — advance phase
router.patch(
  '/:id/phase',
  asyncHandler(async (req, res) => {
    const { phase, timeSpent } = req.body;
    const session = await sessionService.advancePhase(req.params.id, phase, timeSpent);
    res.json(session);
  })
);

// DELETE /api/sessions/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await sessionService.deleteSession(req.params.id);
    res.status(204).end();
  })
);

export default router;
