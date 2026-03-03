import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { UI } from '../utils/strings';
import api from '../services/api';

export default function QuizHistoryPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(null);
  const { retakeQuiz } = useQuiz();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api.get('/quiz/history?limit=50', { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) setQuizzes(res.data.quizzes || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleRetake = async (quizId) => {
    setRetaking(quizId);
    try {
      const quiz = await retakeQuiz(quizId);
      navigate(`/quiz/${quiz.id}/play`);
    } catch (err) {
      console.error(err);
      setRetaking(null);
    }
  };

  const handleView = (quizId) => {
    navigate(`/quiz/${quizId}/results`);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center animate-fade-up">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-5"
          style={{ boxShadow: '0 4px 20px rgba(20,189,110,0.3), 0 0 0 1px rgba(20,189,110,0.1)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-gray-900 tracking-heading mb-3">
          {UI.quizHistoryTitle}
        </h1>
        <p className="text-gray-500 font-body text-lg max-w-md mx-auto leading-body">
          Deine abgeschlossenen Quizze auf einen Blick.
        </p>
      </div>

      {/* Quiz list */}
      {quizzes.length === 0 ? (
        <div className="surface-elevated p-10 text-center animate-fade-up">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-gray-500 font-body">{UI.noQuizzes}</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {quizzes.map((q) => {
            const pct = q.maxScore > 0 ? Math.round((q.score / q.maxScore) * 100) : 0;
            const color = pct >= 80 ? 'brand' : pct >= 50 ? 'amber' : 'red';

            return (
              <div key={q.id} className="surface-elevated p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Score circle */}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    color === 'brand' ? 'bg-brand-50 border border-brand-200'
                    : color === 'amber' ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                  }`}>
                    <span className={`font-display text-base sm:text-lg font-bold tracking-heading ${
                      color === 'brand' ? 'text-brand-700'
                      : color === 'amber' ? 'text-amber-700'
                      : 'text-red-600'
                    }`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base text-gray-800 tracking-heading truncate">
                      {q.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-gray-400 font-body">
                        {q.score}/{q.maxScore}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400 font-body">
                        {q.questionCount} Fragen
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400 font-body">
                        {formatDate(q.completedAt || q.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop actions */}
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleView(q.id)}
                      className="px-3 py-2 text-xs font-medium text-gray-600 rounded-lg border border-border
                        hover:bg-gray-50 hover:border-gray-300
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                        active:scale-95 transition-transform duration-150"
                    >
                      Ansehen
                    </button>
                    <button
                      onClick={() => handleRetake(q.id)}
                      disabled={retaking === q.id}
                      className="px-3 py-2 text-xs font-medium text-brand-700 rounded-lg border border-brand-200 bg-brand-50
                        hover:bg-brand-100 hover:border-brand-300
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                        active:scale-95 transition-transform duration-150
                        disabled:opacity-50"
                    >
                      {retaking === q.id ? (
                        <span className="flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
                        </span>
                      ) : (
                        UI.quizRetake
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile actions */}
                <div className="flex sm:hidden gap-2 mt-3 ml-[60px]">
                  <button
                    onClick={() => handleView(q.id)}
                    className="flex-1 py-2.5 text-xs font-medium text-gray-600 rounded-lg border border-border text-center
                      hover:bg-gray-50
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                      active:scale-95 transition-transform duration-150"
                  >
                    Ansehen
                  </button>
                  <button
                    onClick={() => handleRetake(q.id)}
                    disabled={retaking === q.id}
                    className="flex-1 py-2.5 text-xs font-medium text-brand-700 rounded-lg border border-brand-200 bg-brand-50 text-center
                      hover:bg-brand-100
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                      active:scale-95 transition-transform duration-150
                      disabled:opacity-50"
                  >
                    {retaking === q.id ? (
                      <span className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
                      </span>
                    ) : (
                      UI.quizRetake
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back to quiz */}
      <div className="flex justify-center pb-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => navigate('/quiz')}
          className="btn-brand"
        >
          {UI.quizAgain}
        </button>
      </div>
    </div>
  );
}
