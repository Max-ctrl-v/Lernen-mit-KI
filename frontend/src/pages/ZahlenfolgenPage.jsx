import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { generateZahlenfolgenSet } from '../utils/zahlenfolgenGenerator';
import { saveExerciseResult } from '../utils/exerciseHistory';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTIES = [
  { key: 'MEDIUM', label: 'Mittel', desc: 'Einfache Muster, kleine Zahlen' },
  { key: 'HARD', label: 'Schwer', desc: 'Verschachtelte Folgen, gr\u00f6\u00dfere Zahlen' },
  { key: 'VERY_HARD', label: 'Sehr schwer', desc: 'Komplexe Mehrstufen-Muster' },
];

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 20;

// ---------------------------------------------------------------------------
// Phase: START
// ---------------------------------------------------------------------------

function StartScreen({ onStart }) {
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [count, setCount] = useState(10);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center animate-fade-up">
        <div
          className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-5"
          style={{ boxShadow: '0 4px 20px rgba(20,189,110,0.3), 0 0 0 1px rgba(20,189,110,0.1)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M4.745 3A23.933 23.933 0 0 0 3 12c0 3.183.62 6.22 1.745 9M19.255 3C20.38 5.78 21 8.817 21 12s-.62 6.22-1.745 9M9 6.75l3 5.25-3 5.25M15 6.75l-3 5.25 3 5.25" />
          </svg>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-gray-900 tracking-heading mb-3">
          Zahlenfolgen
        </h1>
        <p className="text-gray-500 font-body text-lg max-w-md mx-auto leading-body">
          Finde das Muster in der Zahlenfolge und bestimme die n&auml;chsten zwei Zahlen &mdash; wie im echten MedAT.
        </p>
      </div>

      {/* Difficulty selector */}
      <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-display text-xl text-gray-800 tracking-heading mb-4">
          Schwierigkeit w&auml;hlen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`text-left p-5 rounded-2xl border-2 transition-transform duration-200 group
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                active:scale-[0.98] ${
                difficulty === d.key
                  ? 'border-brand-400 bg-brand-50/60 shadow-glow-brand'
                  : 'border-border bg-white shadow-raised hover:border-brand-200 hover:shadow-elevated'
              }`}
            >
              <h3 className={`font-display text-lg tracking-heading mb-1 ${
                difficulty === d.key ? 'text-brand-800' : 'text-gray-800'
              }`}>
                {d.label}
              </h3>
              <p className="text-sm text-gray-500 leading-body">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Question count slider */}
      <div className="surface-raised p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">Anzahl der Fragen</span>
          <span className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
            {count} Fragen
          </span>
        </label>
        <input
          type="range"
          min={MIN_QUESTIONS}
          max={MAX_QUESTIONS}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>{MIN_QUESTIONS}</span>
          <span>{MAX_QUESTIONS}</span>
        </div>
      </div>

      {/* Start button */}
      <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => onStart(difficulty, count)}
          className="btn-brand text-lg px-10 py-4"
        >
          Training starten
        </button>
        <Link
          to="/"
          className="text-brand-600 hover:text-brand-700 text-sm font-medium
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
            active:scale-95 transition-transform duration-150"
        >
          &larr; Zur&uuml;ck zum Start
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase: QUIZ
// ---------------------------------------------------------------------------

function QuizScreen({ questions, onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [idx]: selectedOptionIndex }
  const [feedback, setFeedback] = useState({}); // { [idx]: true } — means feedback was shown

  const question = questions[currentIdx];
  const selectedForCurrent = answers[currentIdx] ?? null;
  const showFeedback = !!feedback[currentIdx];

  const handleAnswer = useCallback((optionIdx) => {
    if (showFeedback) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
    setFeedback((prev) => ({ ...prev, [currentIdx]: true }));
  }, [currentIdx, showFeedback]);

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Last question — finish
      onFinish(answers);
    }
  };

  const isCorrect = selectedForCurrent === question.correctOptionIndex;

  return (
    <div className="max-w-3xl mx-auto space-y-5 sm:space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl text-gray-900 tracking-heading">
          Frage {currentIdx + 1} von {questions.length}
        </h2>
        <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          {Object.keys(answers).length}/{questions.length}
        </span>
      </div>

      {/* Navigation dots */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, i) => {
          const isAnswered = answers[i] != null;
          const isCurrent = i === currentIdx;
          const hasFeedback = feedback[i];
          const wasCorrect = hasFeedback && answers[i] === questions[i].correctOptionIndex;

          let cls =
            'w-11 h-11 rounded-lg text-sm font-bold transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-90';

          if (isCurrent) {
            cls += ' bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand';
          } else if (hasFeedback && wasCorrect) {
            cls += ' bg-emerald-100 text-emerald-700 border border-emerald-300';
          } else if (hasFeedback && !wasCorrect) {
            cls += ' bg-red-100 text-red-600 border border-red-300';
          } else if (isAnswered) {
            cls += ' bg-brand-100 text-brand-700 border border-brand-300';
          } else {
            cls += ' bg-gray-100 text-gray-500 hover:bg-gray-200';
          }

          return (
            <button key={i} onClick={() => setCurrentIdx(i)} className={cls}>
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Sequence display */}
      <div className="surface-elevated p-4 sm:p-7">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Finde die n&auml;chsten zwei Zahlen
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-2">
          {question.sequence.map((num, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <div className="min-w-[3rem] sm:min-w-[3.5rem] h-12 sm:h-14 rounded-xl bg-gray-50 border-2 border-border
                flex items-center justify-center px-2
                font-display text-xl sm:text-2xl text-gray-900 tracking-heading"
              >
                {num}
              </div>
              {i < question.sequence.length - 1 && (
                <div className="w-px h-6 bg-border-strong hidden sm:block" />
              )}
            </div>
          ))}
          {/* Question mark boxes for the two missing values */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-px h-6 bg-border-strong hidden sm:block" />
            <div className="min-w-[3rem] sm:min-w-[3.5rem] h-12 sm:h-14 rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/40
              flex items-center justify-center px-2
              font-display text-xl sm:text-2xl text-brand-500 tracking-heading"
            >
              ?
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-[3rem] sm:min-w-[3.5rem] h-12 sm:h-14 rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/40
              flex items-center justify-center px-2
              font-display text-xl sm:text-2xl text-brand-500 tracking-heading"
            >
              ?
            </div>
          </div>
        </div>
      </div>

      {/* Answer options */}
      <div className="space-y-3">
        {question.options.map((option, i) => {
          const isSelected = selectedForCurrent === i;
          const isCorrectOption = i === question.correctOptionIndex;

          let cls =
            'w-full text-left px-3.5 sm:px-5 py-3 sm:py-3.5 rounded-xl border-2 font-body text-sm transition-transform duration-200 flex items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

          if (showFeedback) {
            if (isCorrectOption) {
              cls += ' border-emerald-500 bg-emerald-50 text-emerald-800';
            } else if (isSelected) {
              cls += ' border-red-400 bg-red-50 text-red-700';
            } else {
              cls += ' border-border-subtle bg-gray-50/50 text-gray-400';
            }
          } else if (isSelected) {
            cls += ' border-brand-400 bg-brand-50 shadow-glow-brand text-brand-800';
          } else {
            cls += ' border-border hover:border-brand-300 text-gray-700 cursor-pointer active:scale-[0.98]';
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showFeedback}
              className={cls}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  showFeedback && isCorrectOption
                    ? 'bg-emerald-500 text-white'
                    : showFeedback && isSelected && !isCorrect
                    ? 'bg-red-400 text-white'
                    : isSelected
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {option.label}
              </span>
              <span className="flex-1 font-medium">{option.display}</span>
              {showFeedback && isCorrectOption && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-emerald-500 flex-shrink-0">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-red-400 flex-shrink-0">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation panel */}
      {showFeedback && isCorrect && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-emerald-700">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-700">Richtig!</p>
          </div>
          <div className="mt-3 pl-11 text-sm text-emerald-700 font-body leading-body">
            {question.explanation}
          </div>
        </div>
      )}

      {showFeedback && !isCorrect && (
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-700">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Erkl&auml;rung
              </p>
              <p className="text-sm text-amber-800 font-body leading-body">
                {question.explanation}
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-800">
                Richtige Antwort: {question.correctAnswer[0]}, {question.correctAnswer[1]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next button */}
      {showFeedback && (
        <div className="flex justify-end animate-fade-up">
          <button onClick={goNext} className="btn-brand px-6 py-3">
            {currentIdx < questions.length - 1 ? (
              <>N&auml;chste Frage &rarr;</>
            ) : (
              'Ergebnis anzeigen'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase: RESULTS
// ---------------------------------------------------------------------------

function ResultsScreen({ questions, answers, onRestart }) {
  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) correct++;
    });
    return correct;
  }, [questions, answers]);

  const maxScore = questions.length;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Score ring */}
      <div className="text-center py-8 animate-fade-up">
        <ScoreRing score={score} maxScore={maxScore} pct={pct} />
        <div className="mt-3">
          <GradeLabel pct={pct} />
        </div>
        <p className="mt-2 text-gray-500 font-body text-sm">Zahlenfolgen-Training</p>
      </div>

      {/* Question review */}
      <div className="surface-elevated p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h3 className="font-display text-lg sm:text-xl text-gray-800 tracking-heading mb-4 sm:mb-5">
          Fragen&uuml;bersicht
        </h3>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.correctOptionIndex;
            const wasAnswered = userAnswer != null;

            return (
              <div
                key={i}
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
                    {/* Sequence display */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {q.sequence.map((num, j) => (
                        <span key={j} className="inline-flex items-center justify-center min-w-[2rem] h-8 px-1.5 rounded-lg bg-gray-100 border border-border-subtle font-display text-sm text-gray-800 tracking-heading">
                          {num}
                        </span>
                      ))}
                      <span className="text-gray-400 font-bold mx-1">&rarr;</span>
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-1.5 rounded-lg bg-emerald-100 border border-emerald-300 font-display text-sm text-emerald-800 tracking-heading font-bold">
                        {q.correctAnswer[0]}
                      </span>
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-1.5 rounded-lg bg-emerald-100 border border-emerald-300 font-display text-sm text-emerald-800 tracking-heading font-bold">
                        {q.correctAnswer[1]}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 font-body space-y-0.5">
                      {wasAnswered && (
                        <p>
                          Deine Antwort:{' '}
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                            {q.options[userAnswer].display}
                          </strong>
                        </p>
                      )}
                      {!wasAnswered && (
                        <p className="text-gray-400">Nicht beantwortet</p>
                      )}
                      {!isCorrect && (
                        <p>
                          Richtig:{' '}
                          <strong className="text-emerald-700">
                            {q.correctAnswer[0]}, {q.correctAnswer[1]}
                          </strong>
                        </p>
                      )}
                    </div>

                    {/* Explanation */}
                    {!isCorrect && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                          Erkl&auml;rung
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
        <button onClick={onRestart} className="btn-brand">
          Nochmal &uuml;ben
        </button>
        <Link
          to="/"
          className="btn-secondary"
        >
          Zur&uuml;ck zum Start
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

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
  else if (pct >= 50) { label = 'Gut \u2014 weiter so!'; color = 'text-amber-700'; bg = 'bg-amber-50 border-amber-200'; }
  else { label = '\u00dcbe weiter!'; color = 'text-red-600'; bg = 'bg-red-50 border-red-200'; }

  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${color} ${bg}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ZahlenfolgenPage() {
  const [phase, setPhase] = useState('START'); // START | QUIZ | RESULTS
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const difficultyRef = useRef('MEDIUM');

  const handleStart = useCallback((difficulty, count) => {
    difficultyRef.current = difficulty;
    const generated = generateZahlenfolgenSet(count, difficulty);
    setQuestions(generated);
    setUserAnswers({});
    setPhase('QUIZ');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFinish = useCallback((answers) => {
    setUserAnswers(answers);
    // Save results to localStorage
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) correct++;
    });
    saveExerciseResult('zahlenfolgen', difficultyRef.current, correct, questions.length);
    setPhase('RESULTS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questions]);

  const handleRestart = useCallback(() => {
    setPhase('START');
    setQuestions([]);
    setUserAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (phase === 'START') {
    return <StartScreen onStart={handleStart} />;
  }

  if (phase === 'QUIZ') {
    return <QuizScreen questions={questions} onFinish={handleFinish} />;
  }

  return <ResultsScreen questions={questions} answers={userAnswers} onRestart={handleRestart} />;
}
