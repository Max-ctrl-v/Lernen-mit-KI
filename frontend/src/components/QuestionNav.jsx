import { memo } from 'react';

export default memo(function QuestionNav({ total, current, answers, questions, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const q = questions[i];
        const isAnswered = q && answers[q.id] != null;
        const isCurrent = i === current;

        let classes =
          'w-9 h-9 rounded-xl text-sm font-semibold flex items-center justify-center transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-90';

        if (isCurrent) {
          classes += ' text-white';
        } else if (isAnswered) {
          classes += ' bg-brand-100 text-brand-700 border border-brand-300 hover:bg-brand-200';
        } else {
          classes += ' bg-gray-100 text-gray-500 hover:bg-gray-200';
        }

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={classes}
            style={isCurrent ? {
              background: 'linear-gradient(135deg, #14bd6e 0%, #099958 100%)',
              boxShadow: '0 2px 8px rgba(20,189,110,0.3)',
            } : undefined}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
});
