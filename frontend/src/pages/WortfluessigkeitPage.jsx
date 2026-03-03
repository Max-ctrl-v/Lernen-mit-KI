import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateWortfluessigkeitSet } from '../utils/wortfluessigkeitGenerator';
import { saveExerciseResult, saveSessionState, getSessionState, clearSessionState } from '../utils/exerciseHistory';
import { useTimer } from '../hooks/useTimer';
import Timer from '../components/Timer';
import { UI } from '../utils/strings';

// ─── Constants ──────────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { key: 'MEDIUM', label: 'Mittel', desc: '6-7 Buchstaben, gebräuchliche Wörter' },
  { key: 'HARD', label: 'Schwer', desc: '7-8 Buchstaben, weniger gebräuchlich' },
  { key: 'VERY_HARD', label: 'Sehr schwer', desc: '8-10 Buchstaben, anspruchsvoll' },
];

const EXAM_CONFIG = { questions: 15, timeSeconds: 20 * 60, difficulty: 'HARD' };

// ─── Component ──────────────────────────────────────────────────────────────

export default function WortfluessigkeitPage() {
  // Restore saved session (lazy initializer — runs once)
  const [restored] = useState(() => {
    const s = getSessionState('wortfluessigkeit');
    if (s?.phase !== 'quiz') return null;
    // Adjust remaining for time elapsed since last save
    if (s.remaining != null && s.savedAt) {
      s.remaining = Math.max(0, s.remaining - Math.floor((Date.now() - s.savedAt) / 1000));
      if (s.remaining <= 0) return null; // exam expired while away
    }
    return s;
  });

  const [phase, setPhase] = useState(restored ? 'quiz' : 'start');
  const [mode, setMode] = useState(restored?.mode || 'practice');
  const [difficulty, setDifficulty] = useState(restored?.difficulty || 'MEDIUM');
  const [questionCount, setQuestionCount] = useState(restored?.questionCount || 10);
  const [questions, setQuestions] = useState(restored?.questions || []);
  const [currentIdx, setCurrentIdx] = useState(restored?.currentIdx || 0);
  // Object-keyed answers: { [questionIdx]: selectedOptionIndex }
  const [answers, setAnswers] = useState(restored?.answers || {});
  // Practice mode: tracks which questions have shown feedback
  const [feedback, setFeedback] = useState(restored?.feedback || {});
  const [timerExpired, setTimerExpired] = useState(false);
  const [timerInit, setTimerInit] = useState(restored?.remaining ?? EXAM_CONFIG.timeSeconds);

  const modeRef = useRef(restored?.mode || 'practice');
  const diffRef = useRef(restored?.difficulty || 'MEDIUM');
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const isExam = mode === 'exam';

  const currentQuestion = questions[currentIdx] || null;
  const selectedOption = answers[currentIdx] ?? null;
  const hasAnswered = selectedOption !== null;
  const hasFeedback = !isExam && !!feedback[currentIdx];

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) correct++;
    });
    return correct;
  }, [questions, answers]);

  // Timer for exam mode
  const handleTimerExpire = useCallback(() => {
    if (modeRef.current === 'exam') {
      const qs = questionsRef.current;
      const ans = answersRef.current;
      let correct = 0;
      qs.forEach((q, i) => { if (ans[i] === q.correctOptionIndex) correct++; });
      saveExerciseResult('wortfluessigkeit', EXAM_CONFIG.difficulty, correct, qs.length, 'exam');
      clearSessionState('wortfluessigkeit');
      setTimerExpired(true);
      setPhase('results');
    }
  }, []);

  const { remaining } = useTimer(
    timerInit,
    handleTimerExpire,
    modeRef.current === 'exam' && phase === 'quiz'
  );

  // Persist session during quiz (remaining captured via closure, not as dep to avoid per-second writes)
  useEffect(() => {
    if (phase === 'quiz' && questions.length > 0) {
      saveSessionState('wortfluessigkeit', {
        phase, mode: modeRef.current, difficulty: diffRef.current, questionCount,
        questions, currentIdx, answers, feedback,
        remaining: modeRef.current === 'exam' ? remaining : null,
      });
    }
  }, [phase, questions, currentIdx, answers, feedback, questionCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(() => {
    const isEx = mode === 'exam';
    const count = isEx ? EXAM_CONFIG.questions : questionCount;
    const diff = isEx ? EXAM_CONFIG.difficulty : difficulty;
    modeRef.current = mode;
    diffRef.current = diff;
    const set = generateWortfluessigkeitSet(count, diff);
    setQuestions(set);
    setCurrentIdx(0);
    setAnswers({});
    setFeedback({});
    setTimerExpired(false);
    setTimerInit(EXAM_CONFIG.timeSeconds);
    setPhase('quiz');
  }, [questionCount, difficulty, mode]);

  const handleSelectOption = useCallback(
    (idx) => {
      if (modeRef.current === 'exam') {
        // Exam: allow changing answers
        setAnswers((prev) => ({ ...prev, [currentIdx]: idx }));
      } else {
        // Practice: lock answer, show feedback
        if (feedback[currentIdx]) return;
        setAnswers((prev) => ({ ...prev, [currentIdx]: idx }));
        setFeedback((prev) => ({ ...prev, [currentIdx]: true }));
      }
    },
    [currentIdx, feedback]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  const handleFinish = useCallback(() => {
    const finalScore = questions.reduce((acc, q, i) =>
      acc + (answers[i] === q.correctOptionIndex ? 1 : 0), 0);
    saveExerciseResult('wortfluessigkeit', diffRef.current, finalScore, questions.length, modeRef.current);
    clearSessionState('wortfluessigkeit');
    setPhase('results');
  }, [questions, answers]);

  const handleRestart = useCallback(() => {
    clearSessionState('wortfluessigkeit');
    setPhase('start');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setFeedback({});
    setTimerExpired(false);
  }, []);

  // Cancel / abandon mid-exercise — saves partial result to history
  const handleCancel = useCallback(() => {
    const diff = modeRef.current === 'exam' ? EXAM_CONFIG.difficulty : diffRef.current;
    const currentScore = questions.reduce((acc, q, i) =>
      acc + (answers[i] === q.correctOptionIndex ? 1 : 0), 0);
    saveExerciseResult('wortfluessigkeit', diff, currentScore, questions.length, modeRef.current, { partial: true });
    clearSessionState('wortfluessigkeit');
    setPhase('start');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setFeedback({});
    setTimerExpired(false);
  }, [questions, answers]);

  // ── Render: Start
  if (phase === 'start') {
    return (
      <StartScreen
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        questionCount={questionCount}
        setQuestionCount={setQuestionCount}
        onStart={handleStart}
        mode={mode}
        onModeChange={setMode}
      />
    );
  }

  // ── Render: Quiz
  if (phase === 'quiz' && currentQuestion) {
    const isExamMode = modeRef.current === 'exam';
    const answeredCount = Object.keys(answers).length;

    return (
      <QuestionScreen
        question={currentQuestion}
        questionIdx={currentIdx}
        totalQuestions={questions.length}
        questions={questions}
        answers={answers}
        selectedOption={selectedOption}
        hasAnswered={hasAnswered}
        hasFeedback={hasFeedback}
        onSelectOption={handleSelectOption}
        onNext={handleNext}
        onPrev={handlePrev}
        onFinish={handleFinish}
        onCancel={handleCancel}
        onGoTo={setCurrentIdx}
        score={score}
        answeredCount={answeredCount}
        isExam={isExamMode}
        remaining={remaining}
        feedback={feedback}
      />
    );
  }

  // ── Render: Results
  if (phase === 'results') {
    return (
      <ResultsScreen
        questions={questions}
        answers={answers}
        score={score}
        onRestart={handleRestart}
        timerExpired={timerExpired}
        modeLabel={modeRef.current === 'exam' ? 'Prüfung' : DIFFICULTIES.find((d) => d.key === diffRef.current)?.label || 'Mittel'}
      />
    );
  }

  return null;
}

// ─── Start Screen ───────────────────────────────────────────────────────────

function StartScreen({ difficulty, setDifficulty, questionCount, setQuestionCount, onStart, mode, onModeChange }) {
  const isExam = mode === 'exam';

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

      {/* Mode toggle */}
      <div className="flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="inline-flex rounded-xl border-2 border-border bg-gray-50 p-1">
          <button
            onClick={() => onModeChange('practice')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !isExam ? 'bg-white text-brand-700 shadow-raised' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {UI.exercisePractice}
          </button>
          <button
            onClick={() => onModeChange('exam')}
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

      {/* Rules card — practice only */}
      {!isExam && (
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
      )}

      {/* Difficulty selector — practice only */}
      {!isExam && (
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
      )}

      {/* Question count slider — practice only */}
      {!isExam && (
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
      )}

      {/* Start button */}
      <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <button onClick={onStart} className="btn-brand text-lg px-10 py-4">
          {isExam ? UI.startExam : UI.startTraining}
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
  questions,
  answers,
  selectedOption,
  hasAnswered,
  hasFeedback,
  onSelectOption,
  onNext,
  onPrev,
  onFinish,
  onCancel,
  onGoTo,
  score,
  answeredCount,
  isExam,
  remaining,
  feedback,
}) {
  const isCorrect = hasFeedback && selectedOption === question.correctOptionIndex;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-up">
      {/* Header bar + Timer */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl text-gray-900 tracking-heading">
          Frage {questionIdx + 1} von {totalQuestions}
        </h2>
        {isExam ? (
          <Timer remaining={remaining} total={EXAM_CONFIG.timeSeconds} />
        ) : (
          <span className="text-sm font-semibold text-accent-700 bg-accent-50 px-3 py-1 rounded-full border border-accent-200">
            {score}/{answeredCount}
          </span>
        )}
      </div>

      {/* Question navigation grid — exam mode */}
      {isExam && (
        <div className="flex flex-wrap gap-2">
          {questions.map((_, i) => {
            const isAnswered = answers[i] != null;
            const isCurrent = i === questionIdx;

            let cls =
              'w-10 h-10 rounded-lg text-sm font-bold transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-90';

            if (isCurrent) {
              cls += ' bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand';
            } else if (isAnswered) {
              cls += ' bg-brand-100 text-brand-700 border border-brand-300';
            } else {
              cls += ' bg-gray-100 text-gray-500 hover:bg-gray-200';
            }

            return (
              <button key={i} onClick={() => onGoTo(i)} className={cls}>
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress bar — practice mode */}
      {!isExam && (
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06))' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((questionIdx + 1) / totalQuestions) * 100}%`,
              background: 'linear-gradient(90deg, #ff8010, #ff9d37)',
            }}
          />
        </div>
      )}

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

          if (isExam) {
            // Exam: only show selection color
            if (isThisSelected) {
              tileClass += ' border-brand-400 bg-brand-50 shadow-raised';
            } else {
              tileClass += ' border-border bg-white shadow-raised hover:border-accent-300 hover:shadow-elevated';
            }
          } else if (!hasFeedback) {
            tileClass += ' border-border bg-white shadow-raised hover:border-accent-300 hover:shadow-elevated';
          } else if (isThisCorrect) {
            tileClass += ' border-emerald-400 bg-emerald-50 shadow-raised';
          } else if (isThisSelected && !isThisCorrect) {
            tileClass += ' border-red-400 bg-red-50 shadow-raised';
          } else {
            tileClass += ' border-border bg-gray-50 opacity-50';
          }

          const isOptionE = idx === 4;

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              disabled={hasFeedback}
              className={`${tileClass} ${isOptionE ? 'col-span-2 sm:col-span-1' : ''} disabled:cursor-default`}
            >
              <span className={`absolute top-2 left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                hasFeedback && isThisCorrect
                  ? 'bg-emerald-500 text-white'
                  : hasFeedback && isThisSelected && !isThisCorrect
                  ? 'bg-red-400 text-white'
                  : isThisSelected
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {opt.label}
              </span>

              <span className={`block text-2xl sm:text-3xl font-bold mt-2 ${
                isOptionE ? 'text-sm sm:text-base' : ''
              } ${
                hasFeedback && isThisCorrect
                  ? 'text-emerald-700'
                  : hasFeedback && isThisSelected && !isThisCorrect
                  ? 'text-red-600'
                  : isThisSelected
                  ? 'text-brand-700'
                  : 'text-gray-800'
              }`}
                style={isOptionE ? {} : { fontFamily: '"DM Sans", ui-monospace, monospace' }}
              >
                {isOptionE ? 'Keine richtig' : opt.letter}
              </span>

              {hasFeedback && isThisCorrect && (
                <span className="absolute top-2 right-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
              {hasFeedback && isThisSelected && !isThisCorrect && (
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

      {/* Feedback / Explanation panel — practice only */}
      {hasFeedback && (
        <div
          className={`p-5 rounded-2xl border-2 animate-fade-up ${
            isCorrect ? 'border-emerald-300 bg-emerald-50/80' : 'border-red-300 bg-red-50/80'
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

      {/* Navigation */}
      {isExam ? (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={questionIdx === 0}
            className="btn-secondary px-4 sm:px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &larr; Zurück
          </button>
          <div className="flex gap-2">
            <button
              onClick={onFinish}
              className="px-5 sm:px-6 py-2.5 rounded-xl font-semibold text-white text-sm
                bg-gradient-to-r from-accent-500 to-accent-600
                shadow-[0_2px_8px_rgba(255,128,16,0.3),0_0_0_1px_rgba(255,128,16,0.2)]
                hover:shadow-[0_4px_16px_rgba(255,128,16,0.4)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                active:scale-95 transition-transform duration-200"
            >
              Auswertung ({answeredCount}/{totalQuestions})
            </button>
            {questionIdx < totalQuestions - 1 && (
              <button onClick={onNext} className="btn-brand px-4 sm:px-5 py-2.5 text-sm">
                Weiter &rarr;
              </button>
            )}
          </div>
        </div>
      ) : (
        hasFeedback && (
          <div className="flex justify-center animate-fade-up">
            <button
              onClick={() => {
                if (questionIdx + 1 >= totalQuestions) {
                  onFinish();
                } else {
                  onNext();
                }
              }}
              className="btn-brand px-8 py-3 text-base"
            >
              {questionIdx + 1 >= totalQuestions ? 'Ergebnis anzeigen' : 'Nächste Frage'} &rarr;
            </button>
          </div>
        )
      )}

      {/* Cancel link */}
      <div className="text-center pt-2">
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ─── Results Screen ─────────────────────────────────────────────────────────

function ResultsScreen({ questions, answers, score, onRestart, timerExpired, modeLabel }) {
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  let gradeLabel, gradeColor, gradeBg;
  if (pct >= 90) { gradeLabel = 'Hervorragend!'; gradeColor = 'text-brand-700'; gradeBg = 'bg-brand-50 border-brand-200'; }
  else if (pct >= 75) { gradeLabel = 'Sehr gut!'; gradeColor = 'text-brand-600'; gradeBg = 'bg-brand-50 border-brand-200'; }
  else if (pct >= 50) { gradeLabel = 'Gut \u2014 weiter so!'; gradeColor = 'text-amber-700'; gradeBg = 'bg-amber-50 border-amber-200'; }
  else { gradeLabel = 'Übe weiter!'; gradeColor = 'text-red-600'; gradeBg = 'bg-red-50 border-red-200'; }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Timer expired banner */}
      {timerExpired && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-center animate-fade-up">
          <p className="text-sm font-semibold text-amber-800">{UI.examAutoSubmit}</p>
        </div>
      )}

      {/* Score display */}
      <div className="text-center py-8 animate-fade-up">
        <ScoreRing score={score} maxScore={total} pct={pct} />
        <div className="mt-4">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${gradeColor} ${gradeBg}`}>
            {gradeLabel}
          </span>
        </div>
        <p className="mt-2 text-gray-500 font-body text-sm">Wortflüssigkeit &mdash; {modeLabel}</p>
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
            const userIdx = answers[i];
            const wasAnswered = userIdx != null;
            const isCorrect = wasAnswered && userIdx === q.correctOptionIndex;
            const userOption = wasAnswered ? q.options[userIdx] : null;
            const correctOption = q.options[q.correctOptionIndex];

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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                      <span className="font-bold text-sm text-gray-800" style={{ fontFamily: '"DM Sans", ui-monospace, monospace' }}>
                        {q.correctWord}
                      </span>
                    </div>

                    <div className="mt-1.5 text-xs text-gray-500 font-body space-x-2">
                      {wasAnswered ? (
                        <span>
                          Deine Antwort:{' '}
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                            {userOption.label}) {userOption.label === 'E' ? 'Keine richtig' : userOption.letter}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-gray-400">Nicht beantwortet</span>
                      )}
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

// ─── Score Ring ──────────────────────────────────────────────────────────────

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
