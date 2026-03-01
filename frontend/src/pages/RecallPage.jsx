import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useTimer } from '../hooks/useTimer';
import QuestionCard from '../components/QuestionCard';
import QuestionNav from '../components/QuestionNav';
import CardCarousel from '../components/CardCarousel';
import Timer from '../components/Timer';
import { UI } from '../utils/strings';

export default function RecallPage() {
  const { session, cards, questions, answers, answerQuestion, submitAll } = useSession();
  const navigate = useNavigate();
  const isExam = session?.mode === 'EXAM';
  const isPractice = session?.mode === 'PRACTICE';
  const duration = session?.recallDuration || 900;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState({});

  const handleExpire = useCallback(() => {
    handleSubmit();
  }, []);

  const { remaining, elapsed } = useTimer(duration, handleExpire, isExam);

  const handleSubmit = async () => {
    if (submitting) return;
    if (isExam && !window.confirm(UI.confirmSubmit)) return;
    setSubmitting(true);
    try {
      await submitAll(elapsed);
      navigate(`/session/${session.id}/results`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleAnswer = (selectedIndex) => {
    const q = questions[currentIdx];
    answerQuestion(q.id, selectedIndex);

    if (isPractice) {
      setPracticeFeedback((prev) => ({ ...prev, [q.id]: true }));
    }
  };

  if (!session || questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-gray-900 tracking-heading">{UI.recallPhase}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-body font-medium bg-gray-100 px-3 py-1 rounded-full">
            {UI.question} {currentIdx + 1} {UI.of} {questions.length}
          </span>
          {isExam && <Timer remaining={remaining} total={duration} />}
        </div>
      </div>

      {/* Question navigation grid */}
      <QuestionNav
        total={questions.length}
        current={currentIdx}
        answers={answers}
        questions={questions}
        onSelect={setCurrentIdx}
      />

      {/* Question */}
      <QuestionCard
        question={currentQ}
        selectedIndex={answers[currentQ.id]}
        onAnswer={handleAnswer}
        showFeedback={!!practiceFeedback[currentQ.id]}
      />

      {/* Practice mode: show cards toggle */}
      {isPractice && (
        <div className="text-center">
          <button
            onClick={() => setShowCards(!showCards)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
              active:scale-95 transition-transform duration-150"
          >
            {showCards ? 'Karten ausblenden' : 'Karten anzeigen'}
          </button>
        </div>
      )}
      {showCards && <CardCarousel cards={cards} />}

      {/* Navigation + Submit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40"
        >
          {UI.previous}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-transform duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
            active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #f06506 0%, #c74b07 100%)',
            boxShadow: '0 2px 4px rgba(240,101,6,0.2), 0 8px 24px rgba(240,101,6,0.15)',
          }}
        >
          {UI.submit} ({answeredCount}/{questions.length})
        </button>

        <button
          onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
          disabled={currentIdx === questions.length - 1}
          className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40"
        >
          {UI.next}
        </button>
      </div>
    </div>
  );
}
