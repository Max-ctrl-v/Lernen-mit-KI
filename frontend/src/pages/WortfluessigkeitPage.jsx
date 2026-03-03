import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  generateWortfluessigkeitSet,
} from '../utils/wortfluessigkeitGenerator';
import { saveExerciseResult } from '../utils/exerciseHistory';

// ─── Constants ──────────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { key: 'MEDIUM', label: 'Mittel', desc: '6-7 Buchstaben, gebräuchliche Wörter' },
  { key: 'HARD', label: 'Schwer', desc: '7-8 Buchstaben, weniger gebräuchlich' },
  { key: 'VERY_HARD', label: 'Sehr schwer', desc: '8-10 Buchstaben, anspruchsvoll' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function WortfluessigkeitPage() {
  // ── State
  const [phase, setPhase] = useState('start'); // 'start' | 'quiz' | 'results'
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // index of clicked option
  const [answers, setAnswers] = useState([]); // array of { selectedIndex, isCorrect }

  // ── Derived
  const currentQuestion = questions[currentIdx] || null;
  const hasAnswered = selectedOption !== null;
  const score = useMemo(() => answers.filter((a) => a.isCorrect).length, [answers]);

  // ── Handlers
  const handleStart = useCallback(() => {
    const set = generateWortfluessigkeitSet(questionCount, difficulty);
    setQuestions(set);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswers([]);
    setPhase('quiz');
  }, [questionCount, difficulty]);

  const handleSelectOption = useCallback(
    (idx) => {
      if (hasAnswered) return; // ignore double-clicks
      setSelectedOption(idx);
      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          selectedIndex: idx,
          isCorrect: idx === currentQuestion.correctOptionIndex,
        },
      ]);
    },
    [hasAnswered, currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const finalScore = answers.filter((a) => a.isCorrect).length;
      saveExerciseResult('wortfluessigkeit', difficulty, finalScore, questions.length);
      setPhase('results');
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
    }
  }, [currentIdx, questions.length, answers, difficulty]);

  const handleRestart = useCallback(() => {
    setPhase('start');
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswers([]);
  }, []);

  // ── Render
  if (phase === 'start') {
    return <StartScreen
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      questionCount={questionCount}
      setQuestionCount={setQuestionCount}
      onStart={handleStart}
    />;
  }

  if (phase === 'quiz' && currentQuestion) {
    return <QuestionScreen
      question={currentQuestion}
      questionIdx={currentIdx}
      totalQuestions={questions.length}
      selectedOption={selectedOption}
      hasAnswered={hasAnswered}
      onSelectOption={handleSelectOption}
      onNext={handleNext}
      score={score}
      answeredCount={answers.length}
    />;
  }

  if (phase === 'results') {
    return <ResultsScreen
      questions={questions}
      answers={answers}
      score={score}
      onRestart={handleRestart}
    />;
  }

  return null;
}

// ─── Start Screen ───────────────────────────────────────────────────────────

function StartScreen({ difficulty, setDifficulty, questionCount, setQuestionCount, onStart }) {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center animate-fade-up">
        <div
          className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-5"
          style={{ boxShadow: '0 4px 20px rgba(255,128,16,0.3), 0 0 0 1px rgba(255,128,16,0.1)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-gray-900 tracking-heading mb-3">
          Wortflüssigkeit
        </h1>
        <p className="text-gray-500 font-body text-lg max-w-lg mx-auto leading-body">
          Buchstaben werden in zufälliger Reihenfolge angezeigt. Finde heraus, welches Wort sie
          bilden, und bestimme den <strong className="text-gray-700">Anfangsbuchstaben</strong>.
        </p>
      </div>

      {/* Rules card */}
      <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h2 className="font-display text-xl text-gray-800 tracking-heading mb-4">So funktioniert es</h2>
        <ul className="space-y-2.5 text-sm text-gray-600 font-body leading-body">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Dir werden <strong className="text-gray-800">verwürfelte Buchstaben</strong> angezeigt.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Finde das deutsche Substantiv, das sich daraus bilden lässt.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Wähle den <strong className="text-gray-800">Anfangsbuchstaben</strong> dieses Wortes aus den Antwortmöglichkeiten.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
            <span>Option E bedeutet: <em>&quot;Keine der Antworten A-D ist richtig.&quot;</em></span>
          </li>
        </ul>
      </div>

      {/* Difficulty selector */}
      <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-display text-xl text-gray-800 tracking-heading mb-4">Schwierigkeit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`text-left p-5 rounded-2xl border-2 transition-transform duration-200 group
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                active:scale-[0.98] ${
                difficulty === d.key
                  ? 'border-accent-400 bg-accent-50/60 shadow-glow-accent'
                  : 'border-border bg-white shadow-raised hover:border-accent-200 hover:shadow-elevated'
              }`}
            >
              <h3 className={`font-display text-lg tracking-heading mb-1 ${
                difficulty === d.key ? 'text-accent-700' : 'text-gray-800'
              }`}>
                {d.label}
              </h3>
              <p className="text-xs text-gray-500 leading-body">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Question count slider */}
      <div className="surface-raised p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">Anzahl der Fragen</span>
          <span className="text-sm font-bold text-accent-700 bg-accent-50 px-3 py-1 rounded-full">
            {questionCount} Fragen
          </span>
        </label>
        <input
          type="range"
          min={5}
          max={20}
          step={1}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>5</span>
          <span>20</span>
        </div>
      </div>

      {/* Start button */}
      <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <button onClick={onStart} className="btn-brand text-lg px-10 py-4">
          Training starten
        </button>
        <Link
          to="/"
          className="text-brand-600 hover:text-brand-700 text-sm font-medium
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
            active:scale-95 transition-transform duration-150"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}

// ─── Question Screen ────────────────────────────────────────────────────────

function QuestionScreen({
  question,
  questionIdx,
  totalQuestions,
  selectedOption,
  hasAnswered,
  onSelectOption,
  onNext,
  score,
  answeredCount,
}) {
  const isCorrect = hasAnswered && selectedOption === question.correctOptionIndex;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-up">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl text-gray-900 tracking-heading">
          Frage {questionIdx + 1} von {totalQuestions}
        </h2>
        <span className="text-sm font-semibold text-accent-700 bg-accent-50 px-3 py-1 rounded-full border border-accent-200">
          {score}/{answeredCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06))' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((questionIdx + 1) / totalQuestions) * 100}%`,
            background: 'linear-gradient(90deg, #ff8010, #ff9d37)',
          }}
        />
      </div>

      {/* Prompt */}
      <div className="text-center">
        <p className="text-gray-600 font-body text-base sm:text-lg leading-body">
          Welcher Buchstabe steht am Anfang des gesuchten Wortes?
        </p>
      </div>

      {/* Scrambled letter tiles */}
      <div className="surface-elevated p-6 sm:p-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {question.scrambledLetters.split('').map((letter, i) => (
            <div
              key={i}
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center
                text-xl sm:text-2xl font-bold text-gray-800 select-none
                border-2 border-border bg-white"
              style={{
                boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                fontFamily: '"DM Sans", ui-monospace, monospace',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {question.options.map((opt, idx) => {
          const isThisCorrect = idx === question.correctOptionIndex;
          const isThisSelected = selectedOption === idx;

          let tileClass =
            'relative p-4 sm:p-5 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 active:scale-[0.97]';

          if (!hasAnswered) {
            // Not answered yet
            tileClass += ' border-border bg-white shadow-raised hover:border-accent-300 hover:shadow-elevated';
          } else if (isThisCorrect) {
            // This is the correct answer
            tileClass += ' border-emerald-400 bg-emerald-50 shadow-raised';
          } else if (isThisSelected && !isThisCorrect) {
            // User selected wrong
            tileClass += ' border-red-400 bg-red-50 shadow-raised';
          } else {
            // Other non-selected, non-correct
            tileClass += ' border-border bg-gray-50 opacity-50';
          }

          // Option E is wider on mobile
          const isOptionE = idx === 4;

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              disabled={hasAnswered}
              className={`${tileClass} ${isOptionE ? 'col-span-2 sm:col-span-1' : ''} disabled:cursor-default`}
            >
              {/* Option label badge */}
              <span className={`absolute top-2 left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                hasAnswered && isThisCorrect
                  ? 'bg-emerald-500 text-white'
                  : hasAnswered && isThisSelected && !isThisCorrect
                  ? 'bg-red-400 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {opt.label}
              </span>

              {/* Letter display */}
              <span className={`block text-2xl sm:text-3xl font-bold mt-2 ${
                isOptionE ? 'text-sm sm:text-base' : ''
              } ${
                hasAnswered && isThisCorrect
                  ? 'text-emerald-700'
                  : hasAnswered && isThisSelected && !isThisCorrect
                  ? 'text-red-600'
                  : 'text-gray-800'
              }`}
                style={isOptionE ? {} : { fontFamily: '"DM Sans", ui-monospace, monospace' }}
              >
                {isOptionE ? 'Keine richtig' : opt.letter}
              </span>

              {/* Feedback icons */}
              {hasAnswered && isThisCorrect && (
                <span className="absolute top-2 right-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
              {hasAnswered && isThisSelected && !isThisCorrect && (
                <span className="absolute top-2 right-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback / Explanation panel */}
      {hasAnswered && (
        <div
          className={`p-5 rounded-2xl border-2 animate-fade-up ${
            isCorrect
              ? 'border-emerald-300 bg-emerald-50/80'
              : 'border-red-300 bg-red-50/80'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isCorrect ? 'bg-emerald-500' : 'bg-red-400'
            }`}>
              {isCorrect ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-semibold text-sm ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                {isCorrect ? 'Richtig!' : 'Leider falsch.'}
              </p>
              <p className="text-sm text-gray-700 font-body mt-1 leading-body">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next button */}
      {hasAnswered && (
        <div className="flex justify-center animate-fade-up">
          <button onClick={onNext} className="btn-brand px-8 py-3 text-base">
            {questionIdx + 1 >= totalQuestions ? 'Ergebnis anzeigen' : 'Nächste Frage'} &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Results Screen ─────────────────────────────────────────────────────────

function ResultsScreen({ questions, answers, score, onRestart }) {
  const total = questions.length;
  const pct = Math.round((score / total) * 100);

  let gradeLabel, gradeColor, gradeBg;
  if (pct >= 90) { gradeLabel = 'Hervorragend!'; gradeColor = 'text-brand-700'; gradeBg = 'bg-brand-50 border-brand-200'; }
  else if (pct >= 75) { gradeLabel = 'Sehr gut!'; gradeColor = 'text-brand-600'; gradeBg = 'bg-brand-50 border-brand-200'; }
  else if (pct >= 50) { gradeLabel = 'Gut \u2014 weiter so!'; gradeColor = 'text-amber-700'; gradeBg = 'bg-amber-50 border-amber-200'; }
  else { gradeLabel = 'Übe weiter!'; gradeColor = 'text-red-600'; gradeBg = 'bg-red-50 border-red-200'; }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Score display */}
      <div className="text-center py-8 animate-fade-up">
        <ScoreRing score={score} maxScore={total} pct={pct} />
        <div className="mt-4">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${gradeColor} ${gradeBg}`}>
            {gradeLabel}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">Gesamtleistung</span>
          <span className="font-semibold text-accent-700">{pct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06))' }}>
          <div
            className="h-full rounded-full origin-left animate-score-fill"
            style={{
              width: `${pct}%`,
              background: pct >= 80
                ? 'linear-gradient(90deg, #14bd6e, #3dd68e)'
                : pct >= 50
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
            }}
          />
        </div>
      </div>

      {/* Question review */}
      <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="font-display text-xl text-gray-800 tracking-heading mb-5">Fragenübersicht</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const answer = answers[i];
            const isCorrect = answer?.isCorrect;
            const userOption = answer ? q.options[answer.selectedIndex] : null;
            const correctOption = q.options[q.correctOptionIndex];

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border-l-4 ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-red-400 bg-red-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Number badge */}
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
                  }`}>
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Scrambled → solved */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Scrambled tiles (small) */}
                      <div className="flex gap-1 flex-wrap">
                        {q.scrambledLetters.split('').map((letter, li) => (
                          <span
                            key={li}
                            className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center border border-border bg-white text-gray-600"
                            style={{ fontFamily: '"DM Sans", ui-monospace, monospace' }}
                          >
                            {letter}
                          </span>
                        ))}
                      </div>

                      {/* Arrow */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>

                      {/* Solved word */}
                      <span className="font-bold text-sm text-gray-800" style={{ fontFamily: '"DM Sans", ui-monospace, monospace' }}>
                        {q.correctWord}
                      </span>
                    </div>

                    {/* Answer details */}
                    <div className="mt-1.5 text-xs text-gray-500 font-body space-x-2">
                      <span>
                        Deine Antwort:{' '}
                        <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                          {userOption
                            ? `${userOption.label}) ${userOption.label === 'E' ? 'Keine richtig' : userOption.letter}`
                            : '---'}
                        </strong>
                      </span>
                      {!isCorrect && (
                        <span>
                          Richtig:{' '}
                          <strong className="text-emerald-700">
                            {correctOption.label}) {correctOption.label === 'E' ? 'Keine richtig' : correctOption.letter}
                          </strong>
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
        <button onClick={onRestart} className="btn-brand">
          Nochmal trainieren
        </button>
        <Link to="/" className="btn-secondary">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}

// ─── Score Ring (adapted from ResultsPage) ──────────────────────────────────

function ScoreRing({ score, maxScore, pct }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
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
