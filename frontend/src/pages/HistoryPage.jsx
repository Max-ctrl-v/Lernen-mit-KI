import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ScoreChart from '../components/ScoreChart';
import { UI, FIELD_LABELS } from '../utils/strings';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function HistoryPage() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [fieldPerf, setFieldPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats'),
      api.get('/stats/history?limit=50'),
      api.get('/stats/field-performance'),
    ])
      .then(([statsRes, histRes, fieldRes]) => {
        setStats(statsRes.data);
        setHistory(histRes.data.sessions || []);
        setFieldPerf(fieldRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const trendConfig = {
    improving: { label: UI.improving, icon: '\u2191', color: 'text-brand-700', bg: 'bg-brand-50' },
    declining: { label: UI.declining, icon: '\u2193', color: 'text-red-600', bg: 'bg-red-50' },
    neutral: { label: UI.neutral, icon: '\u2192', color: 'text-gray-600', bg: 'bg-gray-100' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="font-display text-3xl text-gray-900 tracking-heading">{UI.history}</h1>
        <Link to="/" className="btn-brand text-sm px-5 py-2.5">
          {UI.practiceAgain}
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14bd6e" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
          <p className="text-gray-500 font-body text-lg">{UI.noHistory}</p>
          <Link to="/" className="btn-brand mt-6 inline-block">{UI.startSession}</Link>
        </div>
      ) : (
        <>
          {/* Scoreboard */}
          {stats && (
            <div className="relative overflow-hidden rounded-2xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950" />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'radial-gradient(ellipse at 30% 30%, rgba(61,214,142,0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(255,157,55,0.3) 0%, transparent 50%)',
                }}
              />
              <div className="absolute inset-0 opacity-[0.04]" style={{ filter: 'url(#grain)' }} />

              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-1 p-1.5">
                <ScoreboardCell value={stats.totalSessions} label={UI.totalSessions} />
                <ScoreboardCell value={`${stats.averageScore}`} suffix="/25" label={UI.averageScore} accent />
                <ScoreboardCell value={`${stats.bestScore}`} suffix="/25" label={UI.bestScore} />
                <ScoreboardCell
                  value={trendConfig[stats.trend]?.icon || '-'}
                  label={trendConfig[stats.trend]?.label || stats.trend}
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
                    _raw: f,
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

          {/* Session list */}
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
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 80 ? '#14bd6e' : pct >= 50 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
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
