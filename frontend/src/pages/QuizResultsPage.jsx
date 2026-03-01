import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { UI } from '../utils/strings';

export default function QuizResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quiz, questions, loadQuiz, clearQuiz, retakeQuiz } = useQuiz();
  const [copied, setCopied] = useState(false);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    if (!quiz || quiz.id !== id) {
      loadQuiz(id).catch(() => navigate('/quiz'));
    }
  }, [id]);

  if (!quiz) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const score = quiz.score ?? 0;
  const maxScore = quiz.maxScore ?? questions.length;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const handleExport = useCallback(() => {
    const lines = [`${quiz.title} — ${score}/${maxScore} (${pct}%)`, ''];
    questions.forEach((q, i) => {
      const opts = JSON.parse(q.options || '[]');
      const mark = q.isCorrect ? '+' : q.selectedIndex != null ? 'x' : '-';
      lines.push(`${mark} ${i + 1}. ${q.questionText}`);
      if (q.selectedIndex != null) {
        lines.push(`   Deine Antwort: ${opts[q.selectedIndex]}`);
      }
      if (!q.isCorrect) {
        lines.push(`   Richtig: ${opts[q.correctIndex]}`);
      }
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [quiz, questions, score, maxScore, pct]);

  const handleRetake = async () => {
    setRetaking(true);
    try {
      const q = await retakeQuiz(quiz.id);
      navigate(`/quiz/${q.id}/play`);
    } catch (err) {
      console.error(err);
      setRetaking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Score ring */}
      <div className="text-center py-8 animate-fade-up">
        <ScoreRing score={score} maxScore={maxScore} pct={pct} />
        <div className="mt-3">
          <GradeLabel pct={pct} />
        </div>
        <p className="mt-2 text-gray-500 font-body text-sm">{quiz.title}</p>
      </div>

      {/* Question review */}
      <div className="surface-elevated p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h3 className="font-display text-lg sm:text-xl text-gray-800 tracking-heading mb-4 sm:mb-5">
          Fragenübersicht
        </h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const options = JSON.parse(q.options || '[]');
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
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isCorrect
                        ? 'bg-emerald-500 text-white'
                        : wasAnswered
                        ? 'bg-red-400 text-white'
                        : 'bg-gray-300 text-white'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {q.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden" style={{
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                      }}>
                        <img
                          src={q.imageUrl}
                          alt="Illustration zur Frage"
                          className="w-full max-h-40 object-contain bg-white"
                        />
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-800 font-body">
                      {q.questionText}
                    </p>
                    <div className="mt-1.5 text-xs text-gray-500 font-body space-x-2">
                      {wasAnswered && (
                        <span>
                          Deine Antwort:{' '}
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                            {options[q.selectedIndex]}
                          </strong>
                        </span>
                      )}
                      {!wasAnswered && (
                        <span className="text-gray-400">{UI.unanswered}</span>
                      )}
                      {!isCorrect && (
                        <span>
                          Richtig:{' '}
                          <strong className="text-emerald-700">
                            {options[q.correctIndex]}
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Explanation for wrong answers */}
                    {!isCorrect && q.explanation && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                          {UI.quizExplanation}
                        </p>
                        <p className="text-xs text-amber-800 font-body leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 pb-4 animate-fade-up" style={{ animationDelay: '0.25s' }}>
        <button
          onClick={handleRetake}
          disabled={retaking}
          className="btn-brand disabled:opacity-50"
        >
          {retaking ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            </span>
          ) : (
            UI.quizRetake
          )}
        </button>
        <Link to="/quiz" onClick={() => clearQuiz()} className="btn-secondary">
          {UI.quizAgain}
        </Link>
        <button
          onClick={handleExport}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-xl border border-border bg-white
            hover:bg-gray-50 hover:border-gray-300
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
            active:scale-95 transition-transform duration-150
            flex items-center gap-2"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-brand-500">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {UI.exportCopied}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400">
                <path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              {UI.exportResults}
            </>
          )}
        </button>
        <Link
          to="/quiz/history"
          className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-xl border border-border bg-white
            hover:bg-gray-50 hover:border-gray-300
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
            active:scale-95 transition-transform duration-150"
        >
          {UI.quizHistory}
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
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#eef1f4" strokeWidth="10" />
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
