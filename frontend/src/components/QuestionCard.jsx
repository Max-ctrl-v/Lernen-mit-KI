import { memo, useMemo } from 'react';

export default memo(function QuestionCard({
  question,
  selectedIndex,
  onAnswer,
  showFeedback,
}) {
  const options = useMemo(() => JSON.parse(question.options || '[]'), [question.options]);
  const correctIndex = question.correctIndex;

  return (
    <div className="surface-elevated p-7 max-w-2xl mx-auto">
      <h3 className="font-display text-xl text-gray-900 tracking-heading mb-6">
        {question.questionText}
      </h3>

      <div className="space-y-3">
        {options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = i === correctIndex;
          const isWrong = showFeedback && isSelected && !isCorrectOption;
          const isRight = showFeedback && isCorrectOption;

          let classes = 'w-full text-left px-5 py-3.5 rounded-xl border-2 flex items-center gap-4 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

          if (isRight) {
            classes += ' border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400/30';
          } else if (isWrong) {
            classes += ' border-red-400 bg-red-50 text-red-800 ring-1 ring-red-400/30';
          } else if (isSelected && !showFeedback) {
            classes += ' border-brand-400 bg-brand-50 text-brand-800 shadow-glow-brand';
          } else if (showFeedback) {
            classes += ' border-border bg-white text-gray-400';
          } else {
            classes += ' border-border bg-white text-gray-700 shadow-raised hover:border-brand-300 hover:bg-brand-50/40 active:scale-[0.98] cursor-pointer';
          }

          return (
            <button
              key={i}
              onClick={() => !showFeedback && onAnswer(i)}
              disabled={showFeedback}
              className={classes}
            >
              <span
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isRight ? 'border-emerald-500 bg-emerald-500 text-white' :
                  isWrong ? 'border-red-500 bg-red-500 text-white' :
                  isSelected ? 'border-brand-500 bg-brand-500 text-white' :
                  'border-gray-300 text-gray-400'
                }`}
              >
                {isRight ? '\u2713' : isWrong ? '\u2717' : String.fromCharCode(65 + i)}
              </span>
              <span className="font-medium font-body">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
