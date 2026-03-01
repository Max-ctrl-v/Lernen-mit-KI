import { useState } from 'react';
import { UI } from '../utils/strings';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizQuestionCard({ question, selectedIndex, onAnswer, showFeedback }) {
  const options = JSON.parse(question.options || '[]');
  const correctIndex = question.correctIndex;
  const isAnswered = selectedIndex != null;
  const isCorrect = selectedIndex === correctIndex;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="surface-elevated p-4 sm:p-7 max-w-2xl mx-auto">
      {/* Question image */}
      {question.imageUrl && (
        <div className="mb-6 rounded-xl overflow-hidden relative" style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}>
          {!imageLoaded && (
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin" />
            </div>
          )}
          <img
            src={question.imageUrl}
            alt="Illustration zur Frage"
            className={`w-full max-h-72 object-contain bg-white transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 rounded-xl" style={{
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      <h3 className="font-display text-lg sm:text-xl text-gray-900 tracking-heading mb-4 sm:mb-6">
        {question.questionText}
      </h3>

      <div className="space-y-3">
        {options.map((option, i) => {
          let cls =
            'w-full text-left px-3.5 sm:px-5 py-3 sm:py-3.5 rounded-xl border-2 font-body text-sm transition-transform duration-200 flex items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

          if (showFeedback && isAnswered) {
            if (i === correctIndex) {
              cls += ' border-emerald-500 bg-emerald-50 text-emerald-800';
            } else if (i === selectedIndex) {
              cls += ' border-red-400 bg-red-50 text-red-700';
            } else {
              cls += ' border-border-subtle bg-gray-50/50 text-gray-400';
            }
          } else if (i === selectedIndex) {
            cls += ' border-brand-400 bg-brand-50 shadow-glow-brand text-brand-800';
          } else {
            cls +=
              ' border-border hover:border-brand-300 text-gray-700 cursor-pointer active:scale-[0.98]';
          }

          return (
            <button
              key={i}
              onClick={() => !showFeedback && onAnswer(i)}
              disabled={showFeedback}
              className={cls}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  showFeedback && i === correctIndex
                    ? 'bg-emerald-500 text-white'
                    : showFeedback && i === selectedIndex && !isCorrect
                    ? 'bg-red-400 text-white'
                    : i === selectedIndex
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
              {showFeedback && i === correctIndex && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-emerald-500 flex-shrink-0">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {showFeedback && i === selectedIndex && !isCorrect && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-red-400 flex-shrink-0">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation panel — shown after wrong answer */}
      {showFeedback && isAnswered && !isCorrect && (
        <div className="mt-5 p-5 rounded-xl bg-amber-50 border border-amber-200 animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-700">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                {UI.quizExplanation}
              </p>
              <p className="text-sm text-amber-800 font-body leading-body">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Correct feedback */}
      {showFeedback && isAnswered && isCorrect && (
        <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-emerald-700">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-700">{UI.correct}!</p>
          </div>
        </div>
      )}
    </div>
  );
}
