/**
 * localStorage-based exercise history for client-side exercises
 * (Zahlenfolgen, Figuren, Wortflüssigkeit).
 *
 * Each entry: { id, type, difficulty, score, maxScore, mode, date }
 */

const STORAGE_KEY = 'medat_exercise_history';
const MAX_ENTRIES = 200;

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

/**
 * Save a completed exercise session.
 * @param {'zahlenfolgen'|'figuren'|'wortfluessigkeit'} type
 * @param {string} difficulty - MEDIUM | HARD | VERY_HARD
 * @param {number} score
 * @param {number} maxScore
 */
export function saveExerciseResult(type, difficulty, score, maxScore, mode = 'practice', { partial = false } = {}) {
  const entries = readAll();
  const entry = {
    id: `${type}-${Date.now()}`,
    type,
    difficulty,
    score,
    maxScore,
    mode,
    pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    date: new Date().toISOString(),
  };
  if (partial) entry.partial = true;
  entries.unshift(entry);
  writeAll(entries);
}

/**
 * Get all exercise history, optionally filtered by type.
 * @param {string} [type] - filter by exercise type
 * @param {number} [limit] - max entries to return
 * @returns {Array}
 */
export function getExerciseHistory(type, limit) {
  let entries = readAll();
  if (type) entries = entries.filter((e) => e.type === type);
  if (limit) entries = entries.slice(0, limit);
  return entries;
}

/**
 * Get summary stats for exercises.
 * @returns {{ total: number, byType: Object, recentTrend: string, improvement: number|null }}
 */
export function getExerciseStats() {
  const all = readAll();

  const byType = {};
  for (const entry of all) {
    if (!byType[entry.type]) {
      byType[entry.type] = { total: 0, totalPct: 0, best: 0 };
    }
    byType[entry.type].total++;
    byType[entry.type].totalPct += entry.pct;
    if (entry.pct > byType[entry.type].best) byType[entry.type].best = entry.pct;
  }

  for (const key of Object.keys(byType)) {
    byType[key].avg = byType[key].total > 0
      ? Math.round(byType[key].totalPct / byType[key].total)
      : 0;
  }

  // Trend: compare last 3 vs previous 3
  let recentTrend = 'neutral';
  let improvement = null;
  if (all.length >= 2) {
    improvement = all[0].pct - all[1].pct;
  }
  if (all.length >= 6) {
    const recent = (all[0].pct + all[1].pct + all[2].pct) / 3;
    const previous = (all[3].pct + all[4].pct + all[5].pct) / 3;
    recentTrend = recent > previous ? 'improving' : recent < previous ? 'declining' : 'neutral';
  }

  return {
    total: all.length,
    byType,
    recentTrend,
    improvement,
  };
}

// ---------------------------------------------------------------------------
// Active session persistence (resume after browser close)
// ---------------------------------------------------------------------------

const SESSION_PREFIX = 'medat_session_';

/**
 * Save the active session state so it can be restored after a page reload.
 * @param {'zahlenfolgen'|'figuren'|'wortfluessigkeit'} type
 * @param {Object} state - full session state to persist
 */
export function saveSessionState(type, state) {
  try {
    localStorage.setItem(SESSION_PREFIX + type, JSON.stringify({
      ...state,
      savedAt: Date.now(),
    }));
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Restore a previously saved session state.
 * Returns null if no session exists or it's older than 24 hours.
 * @param {'zahlenfolgen'|'figuren'|'wortfluessigkeit'} type
 * @returns {Object|null}
 */
export function getSessionState(type) {
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + type);
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Expire sessions older than 24 hours
    if (Date.now() - state.savedAt > 24 * 60 * 60 * 1000) {
      clearSessionState(type);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

/**
 * Remove the saved session state (called on completion or explicit discard).
 * @param {'zahlenfolgen'|'figuren'|'wortfluessigkeit'} type
 */
export function clearSessionState(type) {
  localStorage.removeItem(SESSION_PREFIX + type);
}

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------

/** Type labels for display */
export const EXERCISE_LABELS = {
  zahlenfolgen: 'Zahlenfolgen',
  figuren: 'Figuren',
  wortfluessigkeit: 'Wortflüssigkeit',
};

/** Difficulty labels */
export const DIFFICULTY_LABELS = {
  MEDIUM: 'Mittel',
  HARD: 'Schwer',
  VERY_HARD: 'Sehr schwer',
};
