import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';
import * as statsService from '../services/statsService.js';

const router = Router();

// Simple in-memory TTL cache for stats endpoints (30 seconds)
const cache = new Map();
const CACHE_TTL = 30 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// GET /api/stats
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cacheKey = 'stats:summary';
    let summary = getCached(cacheKey);
    if (!summary) {
      summary = await statsService.getSummary();
      setCache(cacheKey, summary);
    }
    res.json(summary);
  })
);

// GET /api/stats/history
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const cacheKey = `stats:history:${page}:${limit}`;
    let history = getCached(cacheKey);
    if (!history) {
      history = await statsService.getHistory(page, limit);
      setCache(cacheKey, history);
    }
    res.json(history);
  })
);

// GET /api/stats/field-performance
router.get(
  '/field-performance',
  asyncHandler(async (req, res) => {
    const cacheKey = 'stats:field-performance';
    let performance = getCached(cacheKey);
    if (!performance) {
      performance = await statsService.getFieldPerformance();
      setCache(cacheKey, performance);
    }
    res.json(performance);
  })
);

export default router;
