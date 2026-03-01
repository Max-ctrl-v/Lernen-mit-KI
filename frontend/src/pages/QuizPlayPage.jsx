import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import QuizQuestionCard from '../components/QuizQuestionCard';
import { UI } from '../utils/strings';

export default function QuizPlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quiz, questions, answers, loadQuiz, answerQuestion, submitQuiz } = useQuiz();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!quiz || quiz.id !== id) {
      loadQuiz(id).catch(() => navigate('/quiz'));
    }
  }, [id]);

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (quiz.status === 'COMPLETED') {
    navigate(`/quiz/${id}/results`, { replace: true });
    return null;
  }

  const question = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (selectedIndex) => {
    answerQuestion(question.id, selectedIndex);
    setFeedback((prev) => ({ ...prev, [question.id]: true }));
  };

  const handleSubmit = async () => {
    if (!window.confirm(UI.quizConfirmSubmit)) return;
    setSubmitting(true);
    try {
      await submitQuiz();
      navigate(`/quiz/${id}/results`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl text-gray-900 tracking-heading">
          {UI.question} {currentIdx + 1} {UI.of} {questions.length}
        </h2>
        <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          {answeredCount}/{questions.length}
        </span>
      </div>

      {/* Question nav grid */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const isAnswered = answers[q.id] != null;
          const isCurrent = i === currentIdx;
          const wasFeedback = feedback[q.id];
          const wasCorrect = wasFeedback && answers[q.id] === q.correctIndex;

          let cls =
            'w-11 h-11 rounded-lg text-sm font-bold transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-90';

          if (isCurrent) {
            cls += ' bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand';
          } else if (wasFeedback && wasCorrect) {
            cls += ' bg-emerald-100 text-emerald-700 border border-emerald-300';
          } else if (wasFeedback && !wasCorrect) {
            cls += ' bg-red-100 text-red-600 border border-red-300';
          } else if (isAnswered) {
            cls += ' bg-brand-100 text-brand-700 border border-brand-300';
          } else {
            cls += ' bg-gray-100 text-gray-500 hover:bg-gray-200';
          }

          return (
            <button key={q.id} onClick={() => setCurrentIdx(i)} className={cls}>
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <QuizQuestionCard
        question={question}
        selectedIndex={answers[question.id] ?? null}
        onAnswer={handleAnswer}
        showFeedback={!!feedback[question.id]}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="btn-secondary px-4 sm:px-5 py-3 sm:py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &larr; {UI.previous}
        </button>

        {currentIdx < questions.length - 1 ? (
          <button onClick={goNext} className="btn-brand px-4 sm:px-5 py-3 sm:py-2.5">
            {UI.next} &rarr;
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 sm:px-6 py-3 sm:py-2.5 rounded-xl font-semibold text-white
              bg-gradient-to-r from-accent-500 to-accent-600
              shadow-[0_2px_8px_rgba(255,128,16,0.3),0_0_0_1px_rgba(255,128,16,0.2)]
              hover:shadow-[0_4px_16px_rgba(255,128,16,0.4)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
              active:scale-95 transition-transform duration-200
              disabled:opacity-50"
          >
            {submitting ? '...' : UI.quizSubmit}
          </button>
        )}
      </div>
    </div>
  );
}
