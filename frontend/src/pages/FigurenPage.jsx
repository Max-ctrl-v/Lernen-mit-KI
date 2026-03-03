import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { generateFigurenSet } from '../utils/figurenGenerator';
import { saveExerciseResult } from '../utils/exerciseHistory';
import { useTimer } from '../hooks/useTimer';
import Timer from '../components/Timer';
import { UI } from '../utils/strings';

// ---------------------------------------------------------------------------
// SVG rendering helpers
// ---------------------------------------------------------------------------

function PieceSvg({ path, rotation, x, y, scale }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotation}, 50, 50)`}>
      <path
        d={path}
        fill="#e0e7ef"
        stroke="#475569"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  );
}

function PiecesDisplay({ pieces }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-2xl border-2 border-border bg-gray-50 overflow-hidden"
        style={{ width: '100%', maxWidth: 340, aspectRatio: '1' }}
      >
        <svg viewBox="0 0 300 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {pieces.map((p, i) => (
            <PieceSvg key={i} {...p} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function ShapeThumbnail({ path, viewBox, isNone, small }) {
  if (isNone) {
    return (
      <div className={`flex items-center justify-center ${small ? 'w-12 h-12' : 'w-full h-full'}`}>
        <span className="text-xs text-gray-500 font-medium text-center leading-tight px-1">
          Keine Antwort ist richtig
        </span>
      </div>
    );
  }
  return (
    <svg
      viewBox={viewBox || '0 0 100 100'}
      className={small ? 'w-12 h-12' : 'w-full h-full'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={path} fill="#e0e7ef" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Assembled Solution — shows how pieces fit together with distinct colors
// ---------------------------------------------------------------------------

const PIECE_COLORS = [
  { fill: '#bfdbfe', stroke: '#3b82f6' },
  { fill: '#bbf7d0', stroke: '#22c55e' },
  { fill: '#fecdd3', stroke: '#f43f5e' },
  { fill: '#fed7aa', stroke: '#f97316' },
  { fill: '#ddd6fe', stroke: '#8b5cf6' },
  { fill: '#fef08a', stroke: '#eab308' },
];

function AssembledSolution({ pieces, correctShape, size = 200, label = true }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <p className="text-xs font-medium text-gray-500">{UI.assembledSolutionLabel}</p>
      )}
      <div
        className="rounded-2xl bg-white border-2 border-border p-3 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg viewBox={correctShape.viewBox || '0 0 100 100'} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {pieces.map((piece, i) => (
            <path
              key={i}
              d={piece.path}
              fill={PIECE_COLORS[i % PIECE_COLORS.length].fill}
              stroke={PIECE_COLORS[i % PIECE_COLORS.length].stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ))}
          <path
            d={correctShape.path}
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTIES = [
  { key: 'MEDIUM', label: 'Mittel', desc: '3 Teile, unterschiedliche Figuren' },
  { key: 'HARD', label: 'Schwer', desc: '4\u20135 Teile, ähnlichere Figuren' },
  { key: 'VERY_HARD', label: 'Sehr schwer', desc: '5\u20136 Teile, sehr ähnliche Figuren' },
];

const EXAM_CONFIG = { questions: 15, timeSeconds: 20 * 60, difficulty: 'HARD' };

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function FigurenPage() {
  const [phase, setPhase] = useState('start');
  const [mode, setMode] = useState('practice');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [timerExpired, setTimerExpired] = useState(false);

  const isExam = mode === 'exam';
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;

  // Timer for exam mode
  const handleTimerExpire = useCallback(() => {
    if (modeRef.current === 'exam') {
      setTimerExpired(true);
      setPhase('results');
    }
  }, []);

  const { remaining } = useTimer(
    EXAM_CONFIG.timeSeconds,
    handleTimerExpire,
    isExam && phase === 'play'
  );

  const handleStart = useCallback(() => {
    const count = isExam ? EXAM_CONFIG.questions : questionCount;
    const diff = isExam ? EXAM_CONFIG.difficulty : difficulty;
    const qs = generateFigurenSet(count, diff);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers({});
    setShowFeedback({});
    setTimerExpired(false);
    setPhase('play');
  }, [questionCount, difficulty, isExam]);

  const handleAnswer = useCallback(
    (optionIdx) => {
      if (isExam) {
        setAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
      } else {
        if (answers[currentIdx] != null) return;
        setAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
        setShowFeedback((prev) => ({ ...prev, [currentIdx]: true }));
      }
    },
    [currentIdx, answers, isExam]
  );

  const goNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
  };
  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  // Compute score
  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) correct++;
    });
    return correct;
  }, [questions, answers]);

  const handleFinish = useCallback(() => {
    const diff = isExam ? EXAM_CONFIG.difficulty : diffRef.current;
    saveExerciseResult('figuren', diff, score, questions.length, mode);
    setPhase('results');
  }, [isExam, score, questions.length, mode]);

  const handleRestart = () => {
    setPhase('start');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setShowFeedback({});
    setTimerExpired(false);
  };

  // ─── START SCREEN ───────────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Hero */}
        <div className="text-center animate-fade-up">
          <div
            className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-5"
            style={{ boxShadow: '0 4px 20px rgba(20,189,110,0.3), 0 0 0 1px rgba(20,189,110,0.1)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
              <path d="M12 22 L12 15.5" />
              <path d="M22 8.5 L12 15.5 L2 8.5" />
              <path d="M2 15.5 L12 8.5 L22 15.5" opacity="0.3" />
            </svg>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-gray-900 tracking-heading mb-3">
            Figuren zusammensetzen
          </h1>
          <p className="text-gray-500 font-body text-base sm:text-lg max-w-lg mx-auto leading-body">
            Dir werden geometrische Einzelteile gezeigt. Bestimme, welche vollständige Figur sie ergeben,
            wenn du sie zusammensetzt. Die Teile dürfen gedreht, aber nicht gespiegelt oder skaliert werden.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex rounded-xl border-2 border-border bg-gray-50 p-1">
            <button
              onClick={() => setMode('practice')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isExam ? 'bg-white text-brand-700 shadow-raised' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {UI.exercisePractice}
            </button>
            <button
              onClick={() => setMode('exam')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isExam ? 'bg-white text-brand-700 shadow-raised' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {UI.exerciseExam}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center max-w-sm">
            {isExam ? UI.exerciseExamDesc : UI.exercisePracticeDesc}
          </p>
        </div>

        {/* Exam info card */}
        {isExam && (
          <div className="surface-elevated p-5 animate-fade-up text-center" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span className="font-semibold">20 Minuten</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold">15 Fragen</span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold">Schwer</span>
            </div>
            <p className="text-xs text-gray-500">
              Kein sofortiges Feedback. Ergebnis erst nach Abgabe oder Zeitablauf.
            </p>
          </div>
        )}

        {/* Difficulty selector — practice only */}
        {!isExam && (
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-display text-xl text-gray-800 tracking-heading mb-4">
              Schwierigkeitsgrad
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`text-left p-5 rounded-2xl border-2 transition-transform duration-200
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
        )}

        {/* Question count slider — practice only */}
        {!isExam && (
          <div className="surface-raised p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Anzahl der Fragen</span>
              <span className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
                {questionCount}
              </span>
            </label>
            <input
              type="range"
              min={5}
              max={15}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>5</span>
              <span>15</span>
            </div>
          </div>
        )}

        {/* Start button */}
        <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <button onClick={handleStart} className="btn-brand text-lg px-10 py-4">
            {isExam ? UI.startExam : UI.startTraining}
          </button>
          <Link
            to="/"
            className="text-brand-600 hover:text-brand-700 text-sm font-medium
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
              active:scale-95 transition-transform duration-150"
          >
            &larr; Zurück zum Start
          </Link>
        </div>
      </div>
    );
  }

  // ─── PLAY SCREEN ────────────────────────────────────────────────────────
  if (phase === 'play') {
    const question = questions[currentIdx];
    if (!question) return null;

    const selectedIdx = answers[currentIdx] ?? null;
    const hasFeedback = !isExam && !!showFeedback[currentIdx];
    const isCorrect = hasFeedback && selectedIdx === question.correctOptionIndex;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
        {/* Header + Timer */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display text-xl sm:text-2xl text-gray-900 tracking-heading">
            Frage {currentIdx + 1} von {questions.length}
          </h2>
          {isExam ? (
            <Timer remaining={remaining} total={EXAM_CONFIG.timeSeconds} />
          ) : (
            <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              {answeredCount}/{questions.length}
            </span>
          )}
        </div>

        {/* Question nav grid */}
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const isAnswered = answers[i] != null;
            const isCurrent = i === currentIdx;
            const hasFb = !isExam && !!showFeedback[i];
            const wasCorrect = hasFb && answers[i] === q.correctOptionIndex;

            let cls =
              'w-10 h-10 rounded-lg text-sm font-bold transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-90';

            if (isCurrent) {
              cls += ' bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand';
            } else if (hasFb && wasCorrect) {
              cls += ' bg-emerald-100 text-emerald-700 border border-emerald-300';
            } else if (hasFb && !wasCorrect) {
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

        {/* Prompt */}
        <p className="text-center text-gray-600 font-body text-sm sm:text-base">
          Welche Figur ergibt sich aus diesen Teilen?
        </p>

        {/* Pieces display */}
        <PiecesDisplay pieces={question.pieces} />

        {/* Answer options */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {question.options.map((opt, i) => {
            const isSelected = selectedIdx === i;
            const isCorrectOption = i === question.correctOptionIndex;

            let borderCls = 'border-border';
            let bgCls = 'bg-white hover:border-brand-300 hover:shadow-elevated';
            let ringCls = '';

            if (isExam) {
              // Exam mode: only show selection, no correct/incorrect colors
              if (isSelected) {
                borderCls = 'border-brand-400';
                bgCls = 'bg-brand-50';
                ringCls = 'ring-2 ring-brand-300';
              }
            } else if (hasFeedback) {
              if (isCorrectOption) {
                borderCls = 'border-emerald-400';
                bgCls = 'bg-emerald-50';
                ringCls = 'ring-2 ring-emerald-300';
              } else if (isSelected && !isCorrectOption) {
                borderCls = 'border-red-400';
                bgCls = 'bg-red-50';
                ringCls = 'ring-2 ring-red-300';
              } else {
                bgCls = 'bg-gray-50 opacity-60';
              }
            } else if (isSelected) {
              borderCls = 'border-brand-400';
              bgCls = 'bg-brand-50';
              ringCls = 'ring-2 ring-brand-300';
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={hasFeedback}
                className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2
                  transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                  active:scale-[0.97] disabled:cursor-default
                  ${borderCls} ${bgCls} ${ringCls}`}
                style={{ minHeight: 90 }}
              >
                <span className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold
                  ${hasFeedback && isCorrectOption
                    ? 'bg-emerald-500 text-white'
                    : hasFeedback && isSelected && !isCorrectOption
                    ? 'bg-red-400 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {opt.label}
                </span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mt-2">
                  <ShapeThumbnail path={opt.path} viewBox={opt.viewBox} isNone={opt.isNone} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback — practice mode only */}
        {hasFeedback && (
          <div className={`p-4 rounded-xl border ${
            isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
          } animate-fade-up`}>
            <div className="flex items-start gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isCorrect ? 'bg-emerald-500' : 'bg-red-400'
              }`}>
                {isCorrect ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Richtig!' : 'Leider falsch.'}
                </p>
                <p className="text-sm text-gray-600 font-body mt-1">{question.explanation}</p>
                {!isCorrect && (
                  <div className="mt-3">
                    <AssembledSolution pieces={question.pieces} correctShape={question.correctShape} size={200} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="btn-secondary px-4 sm:px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &larr; Zurück
          </button>

          <div className="flex gap-2">
            {/* Exam: show submit button always */}
            {isExam && (
              <button
                onClick={handleFinish}
                className="px-5 sm:px-6 py-2.5 rounded-xl font-semibold text-white text-sm
                  bg-gradient-to-r from-accent-500 to-accent-600
                  shadow-[0_2px_8px_rgba(255,128,16,0.3),0_0_0_1px_rgba(255,128,16,0.2)]
                  hover:shadow-[0_4px_16px_rgba(255,128,16,0.4)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                  active:scale-95 transition-transform duration-200"
              >
                Auswertung ({answeredCount}/{questions.length})
              </button>
            )}

            {/* Practice: next / finish */}
            {!isExam && (
              currentIdx < questions.length - 1 ? (
                <button onClick={goNext} className="btn-brand px-4 sm:px-5 py-2.5 text-sm">
                  Weiter &rarr;
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-5 sm:px-6 py-2.5 rounded-xl font-semibold text-white text-sm
                    bg-gradient-to-r from-accent-500 to-accent-600
                    shadow-[0_2px_8px_rgba(255,128,16,0.3),0_0_0_1px_rgba(255,128,16,0.2)]
                    hover:shadow-[0_4px_16px_rgba(255,128,16,0.4)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                    active:scale-95 transition-transform duration-200"
                >
                  Auswertung
                </button>
              )
            )}

            {/* Exam: next button */}
            {isExam && currentIdx < questions.length - 1 && (
              <button onClick={goNext} className="btn-brand px-4 sm:px-5 py-2.5 text-sm">
                Weiter &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ─────────────────────────────────────────────────────
  if (phase === 'results') {
    const maxScore = questions.length;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Timer expired banner */}
        {timerExpired && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-center animate-fade-up">
            <p className="text-sm font-semibold text-amber-800">{UI.examAutoSubmit}</p>
          </div>
        )}

        {/* Score ring */}
        <div className="text-center py-8 animate-fade-up">
          <ScoreRing score={score} maxScore={maxScore} pct={pct} />
          <div className="mt-3">
            <GradeLabel pct={pct} />
          </div>
          <p className="mt-2 text-gray-500 font-body text-sm">
            Figuren zusammensetzen &mdash; {isExam ? 'Prüfung' : DIFFICULTIES.find((d) => d.key === difficulty)?.label}
          </p>
        </div>

        {/* Question review */}
        <div className="surface-elevated p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="font-display text-lg sm:text-xl text-gray-800 tracking-heading mb-4 sm:mb-5">
            Fragenübersicht
          </h3>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const selected = answers[i];
              const wasAnswered = selected != null;
              const wasCorrect = wasAnswered && selected === q.correctOptionIndex;

              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-l-4 ${
                    wasCorrect
                      ? 'border-emerald-500 bg-emerald-50/60'
                      : wasAnswered
                      ? 'border-red-400 bg-red-50/60'
                      : 'border-gray-300 bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      wasCorrect
                        ? 'bg-emerald-500 text-white'
                        : wasAnswered
                        ? 'bg-red-400 text-white'
                        : 'bg-gray-300 text-white'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          <span>Ziel:</span>
                          <div className="w-8 h-8 rounded bg-gray-100 p-0.5 flex items-center justify-center">
                            <ShapeThumbnail path={q.correctShape.path} viewBox={q.correctShape.viewBox} small />
                          </div>
                          <span className="text-gray-700 font-semibold">{q.correctShape.name}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 font-body space-x-2">
                        {wasAnswered && (
                          <span>
                            Deine Antwort:{' '}
                            <strong className={wasCorrect ? 'text-emerald-700' : 'text-red-600'}>
                              {q.options[selected].label} ({q.options[selected].name})
                            </strong>
                          </span>
                        )}
                        {!wasAnswered && (
                          <span className="text-gray-400">Nicht beantwortet</span>
                        )}
                        {!wasCorrect && wasAnswered && (
                          <span>
                            Richtig:{' '}
                            <strong className="text-emerald-700">
                              {q.options[q.correctOptionIndex].label} ({q.options[q.correctOptionIndex].name})
                            </strong>
                          </span>
                        )}
                      </div>

                      {!wasCorrect && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                          <p className="text-xs text-amber-800 font-body leading-relaxed">
                            {q.explanation}
                          </p>
                          <div className="mt-3 flex justify-center">
                            <AssembledSolution pieces={q.pieces} correctShape={q.correctShape} size={160} label={false} />
                          </div>
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
          <button onClick={handleStart} className="btn-brand">
            Nochmal spielen
          </button>
          <button onClick={handleRestart} className="btn-secondary">
            Einstellungen ändern
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-xl border border-border bg-white
              hover:bg-gray-50 hover:border-gray-300
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
              active:scale-95 transition-transform duration-150"
          >
            Zurück zum Start
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Score ring
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
  else { label = 'Übe weiter!'; color = 'text-red-600'; bg = 'bg-red-50 border-red-200'; }

  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${color} ${bg}`}>
      {label}
    </span>
  );
}
