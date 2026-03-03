import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ScoreChart from '../components/ScoreChart';
import { UI, FIELD_LABELS } from '../utils/strings';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  getExerciseHistory,
  getExerciseStats,
  EXERCISE_LABELS,
  DIFFICULTY_LABELS,
} from '../utils/exerciseHistory';

export default function HistoryPage() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [fieldPerf, setFieldPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exercises'); // 'exercises' | 'allergy'

  // Exercise history from localStorage
  const exerciseHistory = useMemo(() => getExerciseHistory(null, 100), []);
  const exerciseStats = useMemo(() => getExerciseStats(), []);

  useEffect(() => {
    const controller = new AbortController();

    // Fetch each API independently so one failure doesn't break everything
    const statsReq = api.get('/stats', { signal: controller.signal }).catch(() => null);
    const histReq = api.get('/stats/history?limit=50', { signal: controller.signal }).catch(() => null);
    const fieldReq = api.get('/stats/field-performance', { signal: controller.signal }).catch(() => null);

    Promise.all([statsReq, histReq, fieldReq])
      .then(([statsRes, histRes, fieldRes]) => {
        if (!controller.signal.aborted) {
          if (statsRes) setStats(statsRes.data);
          if (histRes) setHistory(histRes.data?.sessions || []);
          if (fieldRes) setFieldPerf(fieldRes.data || []);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const hasExercises = exerciseHistory.length > 0;
  const hasAllergy = history.length > 0;
  const hasAnyData = hasExercises || hasAllergy;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="font-display text-3xl text-gray-900 tracking-heading">{UI.history}</h1>
        <Link to="/" className="btn-brand text-sm px-5 py-2.5">
          {UI.practiceAgain}
        </Link>
      </div>

      {!hasAnyData ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14bd6e" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
          <p className="text-gray-500 font-body text-lg">{UI.noHistory}</p>
          <p className="text-gray-400 font-body text-sm mt-2">Absolviere ein Training, um deinen Verlauf zu sehen.</p>
          <Link to="/" className="btn-brand mt-6 inline-block">{UI.startSession}</Link>
        </div>
      ) : (
        <>
          {/* Exercise Progress Overview */}
          {hasExercises && (
            <ExerciseOverview stats={exerciseStats} history={exerciseHistory} />
          )}

          {/* Tab selector when both types exist */}
          {hasExercises && hasAllergy && (
            <div className="flex gap-2 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <button
                onClick={() => setActiveTab('exercises')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'exercises'
                    ? 'bg-brand-600 text-white shadow-glow-brand'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Übungen
              </button>
              <button
                onClick={() => setActiveTab('allergy')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'allergy'
                    ? 'bg-brand-600 text-white shadow-glow-brand'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Allergieausweise
              </button>
            </div>
          )}

          {/* Exercise History */}
          {(activeTab === 'exercises' || !hasAllergy) && hasExercises && (
            <ExerciseHistoryTable entries={exerciseHistory} />
          )}

          {/* Allergy Card History */}
          {(activeTab === 'allergy' || !hasExercises) && hasAllergy && (
            <>
              {/* Allergy scoreboard */}
              {stats && (
                <div className="relative overflow-hidden rounded-2xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950" />
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 30%, rgba(61,214,142,0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(255,157,55,0.3) 0%, transparent 50%)',
                    }}
                  />
                  <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-1 p-1.5">
                    <ScoreboardCell value={stats.totalSessions} label={UI.totalSessions} />
                    <ScoreboardCell value={`${stats.averageScore}`} suffix="/25" label={UI.averageScore} accent />
                    <ScoreboardCell value={`${stats.bestScore}`} suffix="/25" label={UI.bestScore} />
                    <ScoreboardCell
                      value={stats.trend === 'improving' ? '\u2191' : stats.trend === 'declining' ? '\u2193' : '\u2192'}
                      label={stats.trend === 'improving' ? UI.improving : stats.trend === 'declining' ? UI.declining : UI.neutral}
                    />
                  </div>
                </div>
              )}

              {/* Score chart */}
              <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
                <ScoreChart sessions={history} />
              </div>

              {/* Field performance */}
              {fieldPerf.length > 0 && (
                <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  <h3 className="font-display text-xl text-gray-800 tracking-heading mb-4">{UI.fieldPerformance}</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={fieldPerf.map((f) => ({
                        name: FIELD_LABELS[f.field] || f.field,
                        Genauigkeit: f.accuracy,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#e2e6eb' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} unit="%" axisLine={{ stroke: '#e2e6eb' }} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff', border: '1px solid #e2e6eb',
                          borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Bar dataKey="Genauigkeit" radius={[6, 6, 0, 0]}>
                        {fieldPerf.map((f, i) => (
                          <Cell
                            key={i}
                            fill={f.accuracy >= 80 ? '#14bd6e' : f.accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Session table */}
              <div className="surface-elevated overflow-hidden animate-fade-up" style={{ animationDelay: '0.25s' }}>
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Datum</th>
                      <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Modus</th>
                      <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">{UI.score}</th>
                      <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Leistung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s) => {
                      const pct = Math.round(((s.score ?? 0) / s.maxScore) * 100);
                      return (
                        <tr key={s.id} className="border-b border-border-subtle last:border-0 hover:bg-brand-50/30 transition-colors duration-150">
                          <td className="px-5 py-3.5 text-gray-600">
                            {new Date(s.createdAt).toLocaleDateString('de-AT', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              s.mode === 'EXAM'
                                ? 'bg-accent-100 text-accent-700'
                                : 'bg-brand-100 text-brand-700'
                            }`}>
                              {s.mode === 'EXAM' ? UI.examMode : UI.practiceMode}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-gray-800">
                            {s.score}/{s.maxScore}
                          </td>
                          <td className="px-5 py-3.5">
                            <PerformanceBar pct={pct} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Exercise Overview with Improvement Bar ─────────────────────────────────

function ExerciseOverview({ stats, history }) {
  const overallAvg = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((sum, e) => sum + e.pct, 0) / history.length);
  }, [history]);

  const typeCards = useMemo(() => {
    return Object.entries(stats.byType).map(([type, data]) => ({
      type,
      label: EXERCISE_LABELS[type] || type,
      total: data.total,
      avg: data.avg,
      best: data.best,
    }));
  }, [stats.byType]);

  const trendData = useMemo(() => {
    return history.slice(0, 10).reverse();
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Overall progress card */}
      <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 mb-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600">
            <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="font-display text-xl text-gray-800 tracking-heading">Fortschritt Übungen</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center py-3 px-2 rounded-xl bg-brand-50 border border-brand-200">
            <div className="text-2xl font-bold font-display tracking-heading text-brand-700">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Übungen</div>
          </div>
          <div className="text-center py-3 px-2 rounded-xl bg-gray-50 border border-border-subtle">
            <div className="text-2xl font-bold font-display tracking-heading text-gray-800">
              {overallAvg}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Durchschnitt</div>
          </div>
          <div className="text-center py-3 px-2 rounded-xl bg-gray-50 border border-border-subtle">
            <div className="text-2xl font-bold font-display tracking-heading text-gray-800">
              {history.length > 0 ? Math.max(...history.map((e) => e.pct)) : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Bestleistung</div>
          </div>
        </div>

        {/* Overall improvement bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Gesamtleistung</span>
            <span className="font-semibold text-brand-700">{overallAvg}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden relative"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06))' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${overallAvg}%`,
                background: overallAvg >= 80
                  ? 'linear-gradient(90deg, #14bd6e, #3dd68e)'
                  : overallAvg >= 50
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
        </div>

        {/* Improvement indicator */}
        {stats.improvement !== null && (
          <div className="mt-4 flex items-center gap-2">
            {stats.improvement > 0 && (
              <>
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#099958" strokeWidth="3" strokeLinecap="round"><path d="M12 19V5m-7 7 7-7 7 7"/></svg>
                </div>
                <span className="text-sm font-semibold text-brand-700">+{stats.improvement}%</span>
                <span className="text-xs text-gray-400">vs. letzte Übung</span>
              </>
            )}
            {stats.improvement < 0 && (
              <>
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14m7-7-7 7-7-7"/></svg>
                </div>
                <span className="text-sm font-semibold text-red-600">{stats.improvement}%</span>
                <span className="text-xs text-gray-400">vs. letzte Übung</span>
              </>
            )}
            {stats.improvement === 0 && (
              <>
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
                </div>
                <span className="text-sm font-medium text-gray-500">Gleiche Leistung</span>
              </>
            )}
          </div>
        )}

        {/* Mini trend chart */}
        {trendData.length >= 2 && (
          <div className="mt-5 pt-4 border-t border-border-subtle">
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Letzte Übungen</p>
            <div className="flex items-end gap-1.5 h-16">
              {trendData.map((entry, i) => (
                <div key={entry.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] font-semibold text-gray-500 truncate w-full text-center">
                    {entry.pct}%
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: `${Math.max(entry.pct * 0.5, 4)}px`,
                      background: i === trendData.length - 1
                        ? 'linear-gradient(to top, #14bd6e, #3dd68e)'
                        : 'linear-gradient(to top, #e2e6eb, #cdd3db)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-type breakdown */}
      {typeCards.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {typeCards.map((card) => (
            <div key={card.type} className="surface-elevated p-4">
              <h4 className="font-display text-base text-gray-800 tracking-heading mb-3">{card.label}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{card.total} Übungen</span>
                  <span className="font-semibold text-gray-700">{card.avg}%</span>
                </div>
                <PerformanceBar pct={card.avg} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exercise History Table ─────────────────────────────────────────────────

function ExerciseHistoryTable({ entries }) {
  return (
    <div className="surface-elevated overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <table className="w-full text-sm font-body">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Datum</th>
            <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Übung</th>
            <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Schwierigkeit</th>
            <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">{UI.score}</th>
            <th className="px-5 py-3.5 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Leistung</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className={`border-b border-border-subtle last:border-0 hover:bg-brand-50/30 transition-colors duration-150 ${entry.partial ? 'opacity-70' : ''}`}>
              <td className="px-5 py-3.5 text-gray-600">
                {new Date(entry.date).toLocaleDateString('de-AT', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <ExerciseTypeBadge type={entry.type} />
                  {entry.partial && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                      Abgebrochen
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-gray-600 text-xs">
                {DIFFICULTY_LABELS[entry.difficulty] || entry.difficulty}
              </td>
              <td className="px-5 py-3.5 font-bold text-gray-800">
                {entry.score}/{entry.maxScore}
              </td>
              <td className="px-5 py-3.5">
                <PerformanceBar pct={entry.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────

function PerformanceBar({ pct }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 80 ? '#14bd6e' : pct >= 50 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
      <span className="text-xs text-gray-500 font-medium w-8">{pct}%</span>
    </div>
  );
}

function ExerciseTypeBadge({ type }) {
  const config = {
    zahlenfolgen: { label: 'Zahlenfolgen', bg: 'bg-brand-100', text: 'text-brand-700' },
    figuren: { label: 'Figuren', bg: 'bg-blue-100', text: 'text-blue-700' },
    wortfluessigkeit: { label: 'Wortflüssigkeit', bg: 'bg-accent-100', text: 'text-accent-700' },
  };
  const c = config[type] || { label: type, bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function ScoreboardCell({ value, suffix, label, accent }) {
  return (
    <div className={`rounded-xl p-5 text-center ${accent ? 'bg-brand-800/60' : 'bg-white/[0.07]'}`}>
      <div className="text-2xl font-display tracking-heading text-white">
        {value}
        {suffix && <span className="text-sm text-white/50 font-body">{suffix}</span>}
      </div>
      <div className="text-xs text-white/50 mt-1 font-body">{label}</div>
    </div>
  );
}
