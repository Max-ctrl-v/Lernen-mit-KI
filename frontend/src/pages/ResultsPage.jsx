import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { UI, FIELD_LABELS } from '../utils/strings';

export default function ResultsPage() {
  const { session, questions } = useSession();

  // Memoize parsed options for all questions
  const parsedQuestions = useMemo(
    () => questions.map((q) => ({ ...q, parsedOptions: JSON.parse(q.options || '[]') })),
    [questions]
  );

  // Memoize field breakdown
  const fieldStats = useMemo(() => {
    const stats = {};
    for (const q of questions) {
      const f = q.fieldTested;
      if (!stats[f]) stats[f] = { total: 0, correct: 0 };
      stats[f].total++;
      if (q.isCorrect) stats[f].correct++;
    }
    return stats;
  }, [questions]);

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4 font-body">Keine aktive Sitzung.</p>
        <Link to="/" className="btn-brand">Zurück zum Start</Link>
      </div>
    );
  }

  const score = session.score ?? 0;
  const maxScore = session.maxScore ?? 25;
  const pct = Math.round((score / maxScore) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Score ring */}
      <div className="text-center py-8 animate-fade-up">
        <ScoreRing score={score} maxScore={maxScore} pct={pct} />
        <div className="mt-3">
          <GradeLabel pct={pct} />
        </div>
      </div>

      {/* Improvement bar per field */}
      <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h3 className="font-display text-xl text-gray-800 tracking-heading mb-5">
          {UI.fieldPerformance}
        </h3>
        <div className="space-y-4">
          {Object.entries(fieldStats).map(([field, { total, correct }], idx) => {
            const fieldPct = total > 0 ? (correct / total) * 100 : 0;
            return (
              <div key={field}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-600">
                    {FIELD_LABELS[field] || field}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {correct}/{total}
                  </span>
                </div>
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06))' }}
                >
                  <div
                    className="h-full rounded-full origin-left animate-score-fill"
                    style={{
                      width: `${fieldPct}%`,
                      background: fieldPct >= 80
                        ? 'linear-gradient(90deg, #14bd6e, #3dd68e)'
                        : fieldPct >= 50
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                      animationDelay: `${0.3 + idx * 0.08}s`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question review */}
      <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
        <h3 className="font-display text-xl text-gray-800 tracking-heading mb-5">Fragenübersicht</h3>
        <div className="space-y-2.5">
          {parsedQuestions.map((q, i) => {
            const isCorrect = q.isCorrect;
            const wasAnswered = q.selectedIndex != null;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border-l-4 ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : wasAnswered
                    ? 'border-red-400 bg-red-50/60'
                    : 'border-gray-300 bg-gray-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    isCorrect ? 'bg-emerald-500 text-white' : wasAnswered ? 'bg-red-400 text-white' : 'bg-gray-300 text-white'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 font-body">{q.questionText}</p>
                    <div className="mt-1.5 text-xs text-gray-500 font-body space-x-2">
                      {wasAnswered && (
                        <span>
                          Deine Antwort:{' '}
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                            {q.parsedOptions[q.selectedIndex]}
                          </strong>
                        </span>
                      )}
                      {!wasAnswered && <span className="text-gray-400">{UI.unanswered}</span>}
                      {!isCorrect && (
                        <span>
                          Richtig:{' '}
                          <strong className="text-emerald-700">{q.parsedOptions[q.correctIndex]}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pb-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <Link to="/" className="btn-brand">
          {UI.practiceAgain}
        </Link>
        <Link to="/history" className="btn-secondary">
          {UI.showHistory}
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ score, maxScore, pct }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (pct / 100) * circumference);
    }, 200);
    return () => clearTimeout(timer);
  }, [pct, circumference]);

  const color = pct >= 80 ? '#14bd6e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="inline-block relative">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background ring */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#eef1f4" strokeWidth="10" />
        {/* Score ring */}
        <circle
          cx="90" cy="90" r={radius} fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-circle"
          transform="rotate(-90 90 90)"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl tracking-heading text-gray-900 animate-score-count">
          {score}
        </span>
        <span className="text-sm text-gray-400 font-body">von {maxScore}</span>
      </div>
    </div>
  );
}

function GradeLabel({ pct }) {
  let label, color, bg;
  if (pct >= 90) { label = 'Hervorragend!'; color = 'text-brand-700'; bg = 'bg-brand-50 border-brand-200'; }
  else if (pct >= 75) { label = 'Sehr gut!'; color = 'text-brand-600'; bg = 'bg-brand-50 border-brand-200'; }
  else if (pct >= 50) { label = 'Gut — weiter so!'; color = 'text-amber-700'; bg = 'bg-amber-50 border-amber-200'; }
  else { label = 'Übe weiter!'; color = 'text-red-600'; bg = 'bg-red-50 border-red-200'; }

  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${color} ${bg}`}>
      {label}
    </span>
  );
}
