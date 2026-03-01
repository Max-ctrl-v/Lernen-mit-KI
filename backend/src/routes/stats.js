import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as statsService from '../services/statsService.js';

const router = Router();

// GET /api/stats
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const summary = await statsService.getSummary();
    res.json(summary);
  })
);

// GET /api/stats/history
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const history = await statsService.getHistory(page, limit);
    res.json(history);
  })
);

// GET /api/stats/field-performance
router.get(
  '/field-performance',
  asyncHandler(async (req, res) => {
    const performance = await statsService.getFieldPerformance();
    res.json(performance);
  })
);

export default router;
